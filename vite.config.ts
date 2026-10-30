import { defineConfig } from 'vite'
import { sveltekit } from '@sveltejs/kit/vite'
import adapter from '@sveltejs/adapter-node'

export default defineConfig({
  plugins: [
    sveltekit({
      adapter: adapter(),
      // Scripts only from this origin (SvelteKit adds hashes for its own inline bootstrap script). Styles and fonts
      // come from Google Fonts; inline styles are used by components and the e-mail-free pages alike.
      csp: {
        directives: {
          'default-src': ['self'],
          'script-src': ['self'],
          'style-src': ['self', 'unsafe-inline', 'https://fonts.googleapis.com'],
          'font-src': ['self', 'https://fonts.gstatic.com', 'data:'],
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
