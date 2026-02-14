import { defineConfig } from 'astro/config';
import dotenv from 'dotenv';
import { KANBAN_BG_COLORS } from './public/js/config/app-constants.js';
import { generateFirebaseConfig } from './scripts/generateFirebaseConfig.js';
import { generateFirebaseMessagingServiceWorker } from './scripts/generateFirebaseMessagingServiceWorker.js';
import { generateKanbanStatusColorsCss } from './scripts/generateKanbanStatusColorsCss.js';


// Cargar las variables de entorno desde el archivo .env
dotenv.config();

// Generar los archivos antes de iniciar la aplicación
generateFirebaseConfig(process.env);
generateFirebaseMessagingServiceWorker(process.env);
generateKanbanStatusColorsCss(KANBAN_BG_COLORS);

// Exportar la configuración de Astro
export default defineConfig({
  integrations: [],
  alias: {
    '@firebase': './src/firebase',
  },
  build: {
    target: 'esnext'
  },
  vite: {
    esbuild: {
      target: 'esnext'
    }
  }
});