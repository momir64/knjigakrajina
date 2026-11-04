import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-node'

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      // Scripts only from this origin (SvelteKit adds hashes for its own inline bootstrap script). Fonts are self-hosted
      // (src/fonts); inline styles are used by components.
      csp: {
        directives: {
          'default-src': ['self'],
          'script-src': ['self'],
          'style-src': ['self', 'unsafe-inline'],
          'font-src': ['self', 'data:'],
          'img-src': ['self', 'data:'],
          'connect-src': ['self'],
          'object-src': ['none'],
          'base-uri': ['self'],
          'form-action': ['self'],
          'frame-ancestors': ['none'],
        },
      },
    }),
  ],
  server: { port: 5173 },
})
