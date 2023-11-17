const {
  PORT: port = 3000,
  PRIVATE_KEY: private_key,
  PUBLIC_KEY: public_key,
  COOKIE_SAMESITE = 'none',
  COOKIE_PATH = '/',
  COOKIE_SECURE: cookie_secure = 'true',
  COOKIE_DOMAIN,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PWD,
  VITE_AZURE_CLIENT,
  MICROSOFT_CLIENT_SECRET,
  VITE_MICROSOFT_REDIRECT_URI = 'http://localhost:8888/minecraft-oauth',
  MICROSOFT_TENANT_ID,
  VITE_DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  VITE_DISCORD_REDIRECT_URI = 'http://localhost:8888/discord-oauth',
  CREW3_API_KEY,
  RECAPTCHA_SECRET,
  ACCESS_TOKEN_COOKIE_NAME = 'aresrpg_',
  ACCESS_TOKEN_EXPIRATION = '90d',
} = process.env;

export const PORT = +port;

export {
  COOKIE_DOMAIN,
  COOKIE_PATH,
  COOKIE_SAMESITE,
  CREW3_API_KEY,
  VITE_DISCORD_CLIENT_ID,
  DISCORD_CLIENT_SECRET,
  VITE_DISCORD_REDIRECT_URI,
  VITE_AZURE_CLIENT,
  MICROSOFT_CLIENT_SECRET,
  VITE_MICROSOFT_REDIRECT_URI,
  MICROSOFT_TENANT_ID,
  RECAPTCHA_SECRET,
  REDIS_HOST,
  REDIS_PORT,
  REDIS_PWD,
  ACCESS_TOKEN_COOKIE_NAME,
  ACCESS_TOKEN_EXPIRATION,
};

export const PRIVATE_KEY = Buffer.from(private_key, 'base64').toString();
export const PUBLIC_KEY = Buffer.from(public_key, 'base64').toString();
export const COOKIE_SECURE = cookie_secure === 'true';
