<script lang="ts">
  // Visitors and page views per day: two lines with a soft area, hover shows the exact day.
  let { days }: { days: { day: string; views: number; visitors: number }[] } = $props()

  const W = 480
  const H = 290
  const M = { l: 38, r: 10, t: 12, b: 28 }
  const pw = W - M.l - M.r
  const ph = H - M.t - M.b

  const niceMax = (max: number) => {
    if (max <= 4) return 4
    const step = Math.pow(10, Math.floor(Math.log10(max / 4)))
    const unit = [1, 2, 2.5, 5, 10].map((m) => m * step).find((s) => s * 4 >= max) ?? step * 10
    return unit * 4
  }
  const top = $derived(niceMax(Math.max(...days.map((d) => d.views), 1)))
  const x = (i: number) => M.l + (days.length < 2 ? pw / 2 : (i / (days.length - 1)) * pw)
  const y = (v: number) => M.t + ph - (v / top) * ph
  const line = (key: 'views' | 'visitors') => days.map((d, i) => `${i ? 'L' : 'M'}${x(i).toFixed(1)},${y(d[key]).toFixed(1)}`).join('')
  const area = (key: 'views' | 'visitors') => `${line(key)}L${x(days.length - 1).toFixed(1)},${y(0)}L${x(0).toFixed(1)},${y(0)}Z`

  const ticks = $derived([0, 1, 2, 3, 4].map((i) => (top / 4) * i))
  const labelEvery = $derived(Math.max(1, Math.ceil(days.length / 5)))
  const short = (day: string) => `${Number(day.slice(8))}. ${Number(day.slice(5, 7))}.`
  const long = (day: string) => `${Number(day.slice(8))}. ${Number(day.slice(5, 7))}. ${day.slice(0, 4)}.`
  const num = (n: number) => n.toLocaleString('sr-RS')

  let hover = $state<number | null>(null)
  function move(e: PointerEvent) {
    const box = (e.currentTarget as SVGElement).ownerSVGElement!.getBoundingClientRect()
    const px = ((e.clientX - box.left) / box.width) * W
    hover = Math.max(0, Math.min(days.length - 1, Math.round(((px - M.l) / pw) * (days.length - 1))))
  }
</script>

<div class="chart">
  <svg viewBox="0 0 {W} {H}" role="img" aria-label="Посетиоци и прегледи по данима">
    <defs>
      <linearGradient id="g-views" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#bc9d77" stop-opacity="0.38" />
        <stop offset="1" stop-color="#bc9d77" stop-opacity="0.02" />
      </linearGradient>
      <linearGradient id="g-vis" x1="0" y1="0" x2="0" y2="1">
        <stop offset="0" stop-color="#4f3933" stop-opacity="0.3" />
        <stop offset="1" stop-color="#4f3933" stop-opacity="0.02" />
      </linearGradient>
    </defs>

    {#each ticks as t}
      <line x1={M.l} x2={W - M.r} y1={y(t)} y2={y(t)} class="grid" />
      <text x={M.l - 8} y={y(t) + 4} class="axis" text-anchor="end">{num(t)}</text>
    {/each}
    {#each days as d, i}
      {#if i % labelEvery === 0}
        <text x={x(i)} y={H - 8} class="axis" text-anchor="middle">{short(d.day)}</text>
      {/if}
    {/each}

    <path d={area('views')} fill="url(#g-views)" />
    <path d={line('views')} class="l-views" />
    <path d={area('visitors')} fill="url(#g-vis)" />
    <path d={line('visitors')} class="l-vis" />

    {#if hover !== null}
      <line x1={x(hover)} x2={x(hover)} y1={M.t} y2={M.t + ph} class="cursor" />
      <circle cx={x(hover)} cy={y(days[hover].views)} r="4.5" class="dot views" />
      <circle cx={x(hover)} cy={y(days[hover].visitors)} r="4.5" class="dot vis" />
    {/if}
    <rect x={M.l} y={M.t} width={pw} height={ph} fill="transparent" onpointermove={move} onpointerleave={() => (hover = null)} role="presentation" />
  </svg>

  {#if hover !== null}
    {@const d = days[hover]}
    <div class="tip" style="left: {(x(hover) / W) * 100}%; --flip: {hover > days.length * 0.6 ? 1 : 0}">
      <b>{long(d.day)}</b>
      <span><i class="sw vis"></i>Посетиоци <b>{num(d.visitors)}</b></span>
      <span><i class="sw views"></i>Прегледаних страница <b>{num(d.views)}</b></span>
    </div>
  {/if}

  <p class="legend"><span><i class="sw vis"></i>Посетиоци</span><span><i class="sw views"></i>Прегледаних страница</span></p>
</div>

<style>
  .chart {
    position: relative;
  }
  svg {
    display: block;
    width: 100%;
    height: auto;
    touch-action: pan-y;
  }
  .grid {
    stroke: #f0e8dd;
    stroke-width: 1;
  }
  .axis {
    fill: #776a59;
    font-size: 12px;
  }
  .l-views,
  .l-vis {
    fill: none;
    stroke-width: 2.2;
    stroke-linejoin: round;
    stroke-linecap: round;
  }
  .l-views {
    stroke: #bc9d77;
  }
  .l-vis {
    stroke: #4f3933;
  }
  .cursor {
    stroke: #bc9d77;
    stroke-dasharray: 3 3;
  }
  .dot {
    stroke: #fff;
    stroke-width: 2;
  }
  .dot.views {
    fill: #bc9d77;
  }
  .dot.vis {
    fill: #4f3933;
  }
  .tip {
    position: absolute;
    top: 6px;
    transform: translateX(calc(-100% * var(--flip) + (1 - var(--flip) * 2) * 12px));
    display: grid;
    gap: 2px;
    padding: 8px 12px;
    border: 1px solid #f0e8dd;
    border-radius: 6px;
    background: rgba(255, 255, 255, 0.96);
    box-shadow: 0 4px 14px rgba(79, 57, 51, 0.14);
    font-size: 13px;
    pointer-events: none;
    white-space: nowrap;
  }
  .tip b:first-child {
    margin-bottom: 2px;
  }
  .legend {
    display: flex;
    gap: 18px;
    justify-content: center;
    margin: 4px 0 0;
    font-size: 13px;
    color: #776a59;
  }
  .sw {
    display: inline-block;
    width: 10px;
    height: 10px;
    margin-right: 6px;
    border-radius: 50%;
  }
  .sw.vis {
    background: #4f3933;
  }
  .sw.views {
    background: #bc9d77;
  }
</style>
