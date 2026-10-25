import { defineConfig } from 'vite';
import { createMp4Middleware } from './server/mp4.js';

export default defineConfig({
  plugins: [{
    name: 'bond-studio-local-mp4',
    configureServer(server) { server.middlewares.use(createMp4Middleware()); },
    configurePreviewServer(server) { server.middlewares.use(createMp4Middleware()); },
  }],
});
