import { defineConfig } from 'astro/config';
import react from '@astrojs/react';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  output: 'static',
  integrations: [
    react(),
  ],
  server: {
    host: '0.0.0.0',
    port: 2222,
  },
  vite: {
    plugins: [tailwindcss()],
    worker: { format: 'es' },
  },
});
