import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  optimizeDeps: {
    exclude: ['lucide-react'],
  },
  build: {
    // El build se genera directamente en la carpeta que sirve el backend
    outDir: '../Kordia_backend/dist',
    emptyOutDir: true,
  },
  server: {
    host: true,
    // En desarrollo, las llamadas a /api/* se redirigen al backend
    proxy: {
      '/search': 'http://localhost:8000',
      '/stream': 'http://localhost:8000',
      '/offline': 'http://localhost:8000',
      '/cleanup': 'http://localhost:8000',
    },
  },
});
