// vite.config.js
export default {
  root: '.',
  publicDir: 'public',
  build: {
    outDir: 'dist',
    assetsDir: 'assets',
    sourcemap: true
  },
  server: {
    port: 3000,
    open: true,
    headers: {
      'Cache-Control': 'no-store',
      'Pragma': 'no-cache'
    }
  }
}
