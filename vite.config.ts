import { defineConfig } from 'vite';

export default defineConfig({
  base: process.env.OMNECARTA_BASE ? process.env.OMNECARTA_BASE.replace(/\/$/, '') + '/' : '/',
});
