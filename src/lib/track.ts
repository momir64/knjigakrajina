// Anonymous page view counter for the back office statistics: one small request per page view, no cookies.
// Browsers that send "Do Not Track" and the one where the owner is signed in to the back office are not counted.
export function track(entry: boolean) {
  try {
    if (navigator.doNotTrack === '1' || localStorage.getItem('kk-skip')) return
  } catch {
    // storage blocked: count as usual
  }
  const body: Record<string, unknown> = { p: location.pathname }
  if (entry) {
    body.e = 1
    body.r = document.referrer
    body.u = new URLSearchParams(location.search).get('utm_source') ?? ''
  }
  fetch('/api/hit', { method: 'POST', body: JSON.stringify(body), keepalive: true, headers: { 'content-type': 'application/json' } }).catch(() => {})
}
