import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// '/api' calls are forwarded to the Express backend -> no CORS problems
export default defineConfig({
  plugins: [react()],
  server: { port: 5173, proxy: { '/api': 'http://localhost:5000' } }
});
