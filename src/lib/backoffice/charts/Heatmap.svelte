<script lang="ts">
  // When people visit: hour of the day (rows) x weekday (columns), shop time, darker = more page views.
  let { heat }: { heat: number[][] } = $props()

  const DAYS = ['Понедељак', 'Уторак', 'Среда', 'Четвртак', 'Петак', 'Субота', 'Недеља']
  const SHORT = ['Пон', 'Уто', 'Сре', 'Чет', 'Пет', 'Суб', 'Нед']
  const CW = 36 // column pitch
  const CH = 17 // row pitch
  const GAP = 3 // the same space between days as between hours
  const L = 42
  const T = 22
  const W = L + 7 * CW
  const H = T + 24 * CH
  const max = $derived(Math.max(...heat.flat(), 1))

  // light sand -> dark brown, on a square-root scale so quiet hours are still visible
  const mix = (a: number[], b: number[], t: number) => a.map((v, i) => Math.round(v + (b[i] - v) * t))
  const fill = (n: number) => (n === 0 ? '#f6f1e7' : `rgb(${mix([236, 222, 196], [79, 57, 51], Math.sqrt(n / max))})`)
  const num = (n: number) => n.toLocaleString('sr-RS')
  // scale labels, top to bottom: the colour runs on a square-root scale, so the value at a fraction t of the bar is max * t^2
  const ticks = $derived([1, 0.75, 0.5, 0.25, 0].map((t) => Math.round(max * t * t)))
</script>

<div class="wrap">
<div class="heat">
  <div class="plot">
  <svg viewBox="0 0 {W} {H}" role="img" aria-label="Прегледи по данима и сатима">
    {#each SHORT as name, d}
      <text x={L + d * CW + CW / 2} y={T - 8} class="axis" text-anchor="middle">{name}</text>
    {/each}
    {#each Array(24) as _, h}
      <text x={L - 11} y={T + h * CH + CH / 2 + 4} class="axis" text-anchor="end">{h}h</text>
      {#each heat as row, d}
        <rect x={L + d * CW + GAP / 2} y={T + h * CH + GAP / 2} width={CW - GAP} height={CH - GAP} rx="3" fill={fill(row[h])}>
          <title>{DAYS[d]}, {h}h · {num(row[h])}</title>
        </rect>
      {/each}
    {/each}
  </svg>
  </div>

  <!-- colour scale with five labels, from the busiest hour down to 0 -->
  <div class="key" aria-hidden="true">
    <i></i>
    <span class="vals">{#each ticks as v}<b>{num(v)}</b>{/each}</span>
  </div>
</div>
</div>

<style>
  .wrap {
    container-type: inline-size;
  }
  /* the chart takes the space left of the scale and is centred in it; the scale keeps a margin to the card's edge */
  .heat {
    display: flex;
    align-items: center;
  }
  .plot {
    flex: 1;
    min-width: 0;
    display: flex;
    justify-content: center;
  }
  svg {
    display: block;
    width: 100%;
    max-width: 294px; /* the drawing's own size, so the labels keep their size */
    height: auto;
  }
  .axis {
    fill: #5f5445;
    font-size: 12.5px;
  }
  .key {
    flex: none;
    display: flex;
    flex-direction: row-reverse; /* numbers on the left of the bar */
    gap: 6px;
    height: 220px;
    margin: 0 14px 0 8px;
    /* centred on the whole card: the card has its title above and only padding below, so the chart's own middle sits lower */
    transform: translateY(-18px);
    font-size: 12.5px;
    color: #5f5445;
  }
  .key i {
    width: 10px;
    border-radius: 3px;
    background: linear-gradient(to top, rgb(236, 222, 196), rgb(79, 57, 51));
  }
  .vals {
    display: flex;
    flex-direction: column;
    justify-content: space-between;
    align-items: flex-end;
    line-height: 1;
  }
  .vals b {
    font-weight: 400;
  }
  /* narrow card: no room beside the chart, so the scale lies under it */
  @container (max-width: 400px) {
    .heat {
      flex-direction: column;
    }
    .plot {
      flex: none;
      width: 100%;
    }
    .key {
      transform: none;
      flex-direction: column;
      width: 190px;
      height: auto;
      margin: 10px 0 0;
    }
    .key i {
      width: 100%;
      height: 10px;
      background: linear-gradient(to right, rgb(236, 222, 196), rgb(79, 57, 51));
    }
    .vals {
      flex-direction: row-reverse;
      align-items: stretch;
    }
  }
</style>
