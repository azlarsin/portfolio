import { defineConfig } from 'astro/config';

export default defineConfig({
  site: 'https://blog.azlar.cc',
  output: 'static',
  trailingSlash: 'always',
  build: {
    format: 'directory',
  },
});
