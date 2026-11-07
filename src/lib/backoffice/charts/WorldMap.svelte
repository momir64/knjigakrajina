<script lang="ts">
  import { MAP } from '#lib/world-map'

  // Choropleth of visitors per country.
  let { countries }: { countries: { code: string; name: string; v: number }[] } = $props()

  // Natural Earth projection, the same one scripts/build-map.mjs used for the outlines
  const RAD = Math.PI / 180
  function project(lon: number, lat: number): [number, number] {
    const l = lon * RAD
    const p = lat * RAD
    const p2 = p * p
    const p4 = p2 * p2
    const x = l * (0.8707 - 0.131979 * p2 + p4 * (-0.013791 + p4 * (0.003971 * p2 - 0.001529 * p4)))
    const y = p * (1.007226 + p2 * (0.015085 + p4 * (-0.044475 + 0.028874 * p2 - 0.005916 * p4)))
    return [MAP.tx + MAP.k * x, MAP.ty - MAP.k * y]
  }

  // zoom presets: [centre longitude, centre latitude, west edge, east edge]
  const VIEWS = {
    world: { label: 'Свет' },
    europe: { label: 'Европа', at: [15, 50, -12, 42] },
    balkan: { label: 'Балкан', at: [19.5, 44.5, 10.5, 28.5] },
  } as const
  type View = keyof typeof VIEWS

  let view = $state<View>('europe')
  // zoom and pan on top of the chosen view; pan is the offset of the picture's centre in drawing units
  let zoom = $state(1)
  let pan = $state<[number, number]>([0, 0])
  function pick(v: View) {
    view = v
    zoom = 1
    pan = [0, 0]
  }

  // size of the drawing area: the zoomed views show as much extra land as it takes to fill its height
  let cw = $state(0)
  let ch = $state(0)

  const box = $derived.by(() => {
    const v = VIEWS[view]
    if (!('at' in v)) return { x: 0, y: 0, w: MAP.width, h: MAP.height }
    const [lon, lat, west, east] = v.at
    const [cx, cy] = project(lon, lat)
    const w = project(east, lat)[0] - project(west, lat)[0]
    const h = cw && ch ? Math.min((w * ch) / cw, MAP.height) : (w * MAP.height) / MAP.width
    return { x: cx - w / 2, y: cy - h / 2, w, h }
  })

  const vb = $derived.by(() => {
    const w = box.w / zoom
    const h = box.h / zoom
    return { x: box.x + box.w / 2 + pan[0] - w / 2, y: box.y + box.h / 2 + pan[1] - h / 2, w, h }
  })
  const minZoom = $derived(Math.min(1, Math.max(box.w / MAP.width, box.h / MAP.height)))

  // drawing units per screen pixel, and where the picture starts inside the stage (the box is fitted, not stretched)
  function scale(w: number, h: number) {
    const k = cw && ch ? Math.max(w / cw, h / ch) : 1
    return { k, ox: (cw - w / k) / 2, oy: (ch - h / k) / 2 }
  }
  function clampPan(x: number, y: number): [number, number] {
    const cx = box.x + box.w / 2
    const cy = box.y + box.h / 2
    return [Math.min(Math.max(x, -cx), MAP.width - cx), Math.min(Math.max(y, -cy), MAP.height - cy)]
  }
  // change the zoom and keep the point under (px, py) where it is
  function zoomAt(next: number, px: number, py: number) {
    const z = Math.min(Math.max(next, minZoom), 14)
    const a = scale(vb.w, vb.h)
    const ux = vb.x + (px - a.ox) * a.k
    const uy = vb.y + (py - a.oy) * a.k
    const w = box.w / z
    const h = box.h / z
    const b = scale(w, h)
    pan = clampPan(ux - (px - b.ox) * b.k + w / 2 - (box.x + box.w / 2), uy - (py - b.oy) * b.k + h / 2 - (box.y + box.h / 2))
    zoom = z
  }

  // wheel zoom needs a non-passive listener so the page does not scroll as well
  function wheel(node: HTMLElement) {
    const on = (e: WheelEvent) => {
      e.preventDefault()
      const r = node.getBoundingClientRect()
      zoomAt(zoom * Math.exp(-e.deltaY * 0.0015), e.clientX - r.left, e.clientY - r.top)
    }
    node.addEventListener('wheel', on, { passive: false })
    return { destroy: () => node.removeEventListener('wheel', on) }
  }

  const pointers = new Map<number, [number, number]>()
  let pinch = 0
  const dist = () => {
    const [a, b] = [...pointers.values()]
    return Math.hypot(a[0] - b[0], a[1] - b[1])
  }
  function down(e: PointerEvent) {
    pointers.set(e.pointerId, [e.clientX, e.clientY])
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    if (pointers.size === 2) pinch = dist()
  }
  function move(e: PointerEvent) {
    const last = pointers.get(e.pointerId)
    if (!last) return
    pointers.set(e.pointerId, [e.clientX, e.clientY])
    if (pointers.size === 2) {
      const d = dist()
      const r = (e.currentTarget as HTMLElement).getBoundingClientRect()
      const [a, b] = [...pointers.values()]
      if (pinch) zoomAt(zoom * (d / pinch), (a[0] + b[0]) / 2 - r.left, (a[1] + b[1]) / 2 - r.top)
      pinch = d
    } else if (pointers.size === 1) {
      const k = scale(vb.w, vb.h).k
      pan = clampPan(pan[0] - (e.clientX - last[0]) * k, pan[1] - (e.clientY - last[1]) * k)
      if (Math.abs(e.clientX - last[0]) + Math.abs(e.clientY - last[1]) > 0) tip = null
    }
  }
  function up(e: PointerEvent) {
    pointers.delete(e.pointerId)
    pinch = 0
  }
  function buttonZoom(f: number) {
    zoomAt(zoom * f, cw / 2, ch / 2)
  }

  const byCode = $derived(new Map(countries.map((c) => [c.code, c])))
  const max = $derived(Math.max(...countries.map((c) => c.v), 1))
  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
  // sand -> accent -> dark brown; the log scale keeps one big country from flattening all the others
  const fill = (v: number) => {
    const t = max <= 1 ? 1 : Math.log(1 + v) / Math.log(1 + max)
    const c = t < 0.5 ? mix([232, 220, 196], [188, 157, 119], t * 2) : mix([188, 157, 119], [79, 57, 51], (t - 0.5) * 2)
    return `rgb(${c})`
  }

  let tip = $state<{ x: number; y: number; title: string; v: number } | null>(null)
  function show(e: PointerEvent, title: string, v: number) {
    const r = (e.currentTarget as SVGElement).closest('.map')!.getBoundingClientRect()
    tip = { x: e.clientX - r.left, y: e.clientY - r.top, title, v }
  }
</script>

<div class="map">
  <div class="views" role="group" aria-label="Приказ мапе">
    {#each Object.entries(VIEWS) as [key, v]}
      <button type="button" class:on={view === key} onclick={() => pick(key as View)}>{v.label}</button>
    {/each}
  </div>
  <div class="stage" bind:clientWidth={cw} bind:clientHeight={ch} use:wheel onpointerdown={down} onpointermove={move} onpointerup={up} onpointercancel={up} role="presentation">
  <svg viewBox="{vb.x} {vb.y} {vb.w} {vb.h}" role="img" aria-label="Мапа посетилаца по државама">
    {#each MAP.countries as [code, d]}
      {@const c = byCode.get(code)}
      <path {d} class:has={!!c} fill={c ? fill(c.v) : '#efe8da'} onpointermove={(e) => c && pointers.size === 0 && show(e, c.name, c.v)} onpointerleave={() => (tip = null)} role="presentation" />
    {/each}
  </svg>
  </div>

  <div class="zoom" role="group" aria-label="Зум">
    <button type="button" aria-label="Увећај" title="Увећај" onclick={() => buttonZoom(1.5)}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M8 3.5v9M3.5 8h9" /></svg>
    </button>
    <button type="button" aria-label="Умањи" title="Умањи" onclick={() => buttonZoom(1 / 1.5)}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M3.5 8h9" /></svg>
    </button>
    <button type="button" aria-label="Врати приказ" title="Врати приказ" onclick={() => pick(view)}>
      <svg viewBox="0 0 16 16" aria-hidden="true"><path d="M2.5 6V2.5H6M10 2.5h3.5V6M13.5 10v3.5H10M6 13.5H2.5V10" /></svg>
    </button>
  </div>

  {#if tip}
    <div class="tip" style="left: {tip.x}px; top: {tip.y}px"><b>{tip.title}</b> · {tip.v.toLocaleString('sr-RS')}</div>
  {/if}

  <div class="key" aria-hidden="true"><span>мање</span><i></i><span>више</span></div>
</div>

<style>
  .map {
    position: relative;
    flex: 1;
    display: flex;
    flex-direction: column;
  }
  .stage {
    position: relative;
    flex: 1;
    min-height: 240px;
    cursor: grab;
    touch-action: none; /* dragging and pinching move the map, not the page */
    user-select: none;
  }
  .stage:active {
    cursor: grabbing;
  }
  .stage svg {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
  }
  .stage path {
    stroke: #fffdf8;
    stroke-width: 0.7px;
    stroke-linejoin: round;
    vector-effect: non-scaling-stroke;
  }
  .stage path.has:hover {
    stroke: #4f3933;
    stroke-width: 1.4px;
  }
  .views {
    position: absolute;
    top: 10px;
    right: 10px;
    z-index: 1;
    display: flex;
    gap: 4px;
  }
  .views button {
    padding: 3px 11px;
    border: 1px solid #d8ccba;
    border-radius: 14px;
    background: #fff;
    color: #4f3933;
    font: inherit;
    font-size: 13px;
    cursor: pointer;
  }
  .views button.on {
    border-color: #4f3933;
    background: #4f3933;
    color: #fff;
  }
  /* one pill of three buttons, in the corner opposite the view switch */
  .zoom {
    position: absolute;
    left: 10px;
    top: 10px;
    z-index: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    border: 1px solid #d8ccba;
    border-radius: 10px;
    background: #fff;
  }
  .zoom button {
    display: grid;
    place-items: center;
    width: 30px;
    height: 30px;
    padding: 0;
    border: 0;
    background: none;
    color: #4f3933;
    cursor: pointer;
  }
  .zoom button + button {
    border-top: 1px solid #ece3d3;
  }
  .zoom button:hover {
    background: #f6f1e7;
  }
  .zoom svg {
    width: 14px;
    height: 14px;
    fill: none;
    stroke: currentColor;
    stroke-width: 1.8;
    stroke-linecap: round;
    stroke-linejoin: round;
  }
  .tip {
    position: absolute;
    transform: translate(12px, -130%);
    padding: 5px 10px;
    border: 1px solid #f0e8dd;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.97);
    box-shadow: 0 4px 14px rgba(79, 57, 51, 0.14);
    font-size: 13px;
    white-space: nowrap;
    pointer-events: none;
  }
  .key {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
    margin-top: 6px;
    font-size: 12px;
    color: #776a59;
  }
  .key i {
    width: 120px;
    height: 8px;
    border-radius: 4px;
    background: linear-gradient(90deg, rgb(232, 220, 196), rgb(188, 157, 119), rgb(79, 57, 51));
  }
</style>
