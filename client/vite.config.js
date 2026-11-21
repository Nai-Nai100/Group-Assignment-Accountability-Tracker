import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  // The client only talks to the API over HTTP; in development Vite forwards /api to the server.
  server: { proxy: { '/api': 'http://localhost:5000' } },
  test: { environment: 'jsdom', setupFiles: './src/setupTests.js' },
});
