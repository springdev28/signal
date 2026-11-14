import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.OMNECARTA_BASE ? process.env.OMNECARTA_BASE.replace(/\/$/, '') + '/' : '/',
  build: { rolldownOptions: { input: { app: 'index.html', astra: 'astra/index.html', astraRuntime: 'astra/runtime.html' } } },
});
