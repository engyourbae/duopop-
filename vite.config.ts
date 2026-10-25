/// <reference types="vitest/config" />
import { defineConfig, type Plugin } from 'vite';
import react from '@vitejs/plugin-react';
import { readFileSync, writeFileSync, existsSync } from 'node:fs';

// BASE: ubah lewat variabel VITE_BASE (mis. "/nama-repo/"). Default "./" (relatif) sehingga
// berjalan di subpath repository mana pun karena routing memakai HashRouter.
const base = process.env.VITE_BASE ?? './';

function swVersion(): Plugin {
  return {
    name: 'sw-version',
    apply: 'build',
    closeBundle() {
      const f = 'dist/sw.js';
      if (existsSync(f)) writeFileSync(f, readFileSync(f, 'utf8').split('__BUILD__').join(String(Date.now())));
    },
  };
}

export default defineConfig({
  base,
  plugins: [react(), swVersion()],
  build: { chunkSizeWarningLimit: 700 },
  test: { environment: 'jsdom', globals: true, setupFiles: ['./src/test/setup.ts'], css: false },
});
