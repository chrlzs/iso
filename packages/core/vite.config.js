// vite.config.js
import { defineConfig } from 'vite';
import { resolve } from 'path';

export default defineConfig({
  build: {
    lib: {
      entry: resolve(__dirname, 'src/index.js'),
      name: 'IsoGameCore',
      fileName: 'iso-game-core'
    },
    rollupOptions: {
      // External dependencies that shouldn't be bundled
      external: ['pixi.js'],
      output: {
        // Global variables to use in UMD build for externalized deps
        globals: {
          'pixi.js': 'PIXI'
        }
      }
    }
  }
});
