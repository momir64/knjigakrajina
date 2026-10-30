import { defineParams } from '@sveltejs/kit/params'

// Shape only (the real path is checked on the server, see hooks.server.ts): lets one dynamic first segment lead to
// the back office without its name ever being part of the client code. Static routes (/knjige, /usluge, ...) win
// over this one; any other segment ends in the ordinary 404 page.
const SHAPE = /^[A-Za-z0-9_-]{1,64}$/

export const params = defineParams({
  admin: (param) => (SHAPE.test(param) ? param : undefined),
})
