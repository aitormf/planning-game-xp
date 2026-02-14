import fs from 'fs';

/**
 * Generates a lightweight IA config file exposed to the client.
 * Only exposes non-sensitive flags so we never leak the actual key.
 */
export function generateIaConfig(env) {
  const runtimeEnv = env.APP_RUNTIME_ENV || env.ASTRO_MODE || env.MODE || '';
  // No exponemos la API key; solo un flag de disponibilidad legacy si alguien la pasó por env
  const legacyKeyPresent = Boolean(env.IA_API_KEY || env.PUBLIC_IA_API_KEY);
  const fallbackEnabled = env.IA_ENABLED === 'true' || legacyKeyPresent;
  const config = {
    runtimeEnv,
    fallbackEnabled
  };

  const content = `
// This file is generated automatically by astro.config.mjs
export const IA_CONFIG = ${JSON.stringify(config, null, 2)};
`;

  fs.writeFileSync('./public/ia-config.js', content);
  console.log('✅ IA config generated successfully!');
}
