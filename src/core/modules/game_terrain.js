import { on } from 'events'
import { setInterval } from 'timers/promises'

import {
  EComputationMethod,
  HeightmapViewer,
  TerrainViewer,
  VoxelmapViewer,
} from '@aresrpg/aresrpg-engine'
import { aiter } from 'iterator-helper'
import { Color, Vector3 } from 'three'
import { WorldApi, WorldCache, WorldWorkerApi } from '@aresrpg/aresrpg-world'

import { context, current_three_character } from '../game/game.js'
import { abortable, typed_on } from '../utils/iterator.js'
import { blocks_colors } from '../utils/terrain/world_settings.js'
import { gen_chunk_ids, make_chunk } from '../utils/terrain/chunk_utils.js'

const world_worker = new Worker(
  new URL('../utils/terrain/world_compute_worker.js', import.meta.url),
  { type: 'module' },
)

const voxel_materials_list = Object.values(blocks_colors).map(col => ({
  color: new Color(col),
}))
const min_altitude = -1
const max_altitude = 400

const patch_render_queue = []

/** @type {Type.Module} */
export default function () {
  // World setup
  // run `world-compute`in worker
  const world_worker_api = new WorldWorkerApi(world_worker)
  // tell `world-api` to use worker
  WorldApi.usedApi = world_worker_api
  // increase `world-cache` gradually
  // WorldCache.cachePowRadius = 1

  // Engine
  const map = {
    minAltitude: min_altitude,
    maxAltitude: max_altitude,
    voxelMaterialsList: voxel_materials_list,
    getLocalMapData: async (block_start, block_end) => {
      return {
        data: [],
        size: new Vector3().subVectors(block_end, block_start),
        isEmpty: true,
      }
    },
    async sampleHeightmap(coords) {
      const res = await WorldCache.processBlocksBatch(coords)
      const data = res.map(block => ({
        altitude: block.level + 0.25,
        color: new Color(blocks_colors[block.type]),
      }))
      return data
    },
  }

  const patch_size = { xz: 64, y: 64 }
  const min_patch_id_y = Math.floor(min_altitude / patch_size.y)
  const max_patch_id_y = Math.floor(max_altitude / patch_size.y)
  const voxelmap_viewer = new VoxelmapViewer(
    min_patch_id_y,
    max_patch_id_y,
    voxel_materials_list,
    {
      patchSize: patch_size,
      computationOptions: {
        method: EComputationMethod.CPU_MULTITHREADED,
        threadsCount: 4,
      },
    },
  )
  const heightmap_viewer = new HeightmapViewer(map, {
    basePatchSize: voxelmap_viewer.chunkSize.xz,
    voxelRatio: 2,
    maxLevel: 5,
  })
  const terrain_viewer = new TerrainViewer(heightmap_viewer, voxelmap_viewer)
  terrain_viewer.parameters.lod.enabled = true

  return {
    tick() {
      // feed engine with chunks
      if (patch_render_queue.length > 0) {
        const patch_key = patch_render_queue.pop()
        const patch = WorldCache.patchLookupIndex[patch_key]
        const chunks_ids = gen_chunk_ids(patch, min_patch_id_y, max_patch_id_y)
        const chunks = chunks_ids.map(chunk_id => make_chunk(patch, chunk_id))
        chunks
          .filter(chunk => voxelmap_viewer.doesPatchRequireVoxelsData(chunk.id))
          .forEach(chunk => {
            voxelmap_viewer.enqueuePatch(chunk.id, chunk)
          })
      }
      terrain_viewer.update()
    },
    observe({ camera, events, signal, scene, get_state }) {
      window.dispatchEvent(new Event('assets_loading'))
      // this notify the player_movement module that the terrain is ready
      events.emit('CHUNKS_LOADED')

      scene.add(terrain_viewer.container)

      aiter(abortable(typed_on(events, 'STATE_UPDATED', { signal }))).reduce(
        async (
          { last_view_distance, last_far_view_distance },
          { settings: { view_distance, far_view_distance } },
        ) => {
          if (last_view_distance) {
            if (
              last_view_distance !== view_distance ||
              last_far_view_distance !== far_view_distance
            ) {
              // await reset_chunks(true)
            }
          }

          return {
            last_view_distance: view_distance,
            last_far_view_distance: far_view_distance,
          }
        },
      )

      aiter(abortable(setInterval(1000, null))).reduce(async () => {
        const state = get_state()
        const player_position =
          current_three_character(state)?.position?.clone()
        if (player_position) {
          WorldCache.refresh(player_position).then(batch_content => {
            if (batch_content.length > 0) {
              // console.log(
              //   `batch size: ${batch_content.length} (total cache size ${WorldCache.patchContainer.count})`,
              // )
              // cache_pow_radius < world_cache_pow_limit &&
              // cache_pow_radius++
              const chunks_ids = Object.values(WorldCache.patchLookupIndex)
                .map(patch =>
                  gen_chunk_ids(patch, min_patch_id_y, max_patch_id_y),
                )
                .flat()
              // declare them as visible, hide the others
              voxelmap_viewer.setVisibility(chunks_ids)
              // add patch keys requiring chunks generation
              batch_content.forEach(patch_key =>
                patch_render_queue.push(patch_key),
              )
            }
          })
        }
        terrain_viewer.setLod(camera.position, 50, camera.far)
      })
    },
  }
}
