<script lang="ts">
  // Share of each part with the total in the middle; legend with percentages next to it.
  let { items, label = '' }: { items: { label: string; value: number }[]; label?: string } = $props()

  const COLORS = ['#4f3933', '#bc9d77', '#96704a', '#d9c3a0', '#7a8f6a', '#a45a4a', '#c9b79a']
  const R = 52
  const C = 2 * Math.PI * R
  const total = $derived(items.reduce((s, i) => s + i.value, 0))
  const arcs = $derived(
    items.reduce<{ len: number; off: number; color: string }[]>((acc, it, i) => {
      const len = total ? (it.value / total) * C : 0
      const off = acc.length ? acc[acc.length - 1].off + acc[acc.length - 1].len : 0
      return [...acc, { len, off, color: COLORS[i % COLORS.length] }]
    }, []),
  )
  const pct = (v: number) => (total ? Math.round((v / total) * 100) : 0)
</script>

<div class="donut">
  <svg viewBox="0 0 140 140" role="img" aria-label={label}>
    <circle cx="70" cy="70" r={R} class="track" />
    {#each arcs as a}
      {#if a.len > 0}
        <circle cx="70" cy="70" r={R} fill="none" stroke={a.color} stroke-width="18" stroke-dasharray="{Math.max(a.len - 1.5, 0.5)} {C}" stroke-dashoffset={-a.off} transform="rotate(-90 70 70)" />
      {/if}
    {/each}
    <text x="70" y="68" text-anchor="middle" class="big">{total.toLocaleString('sr-RS')}</text>
    <text x="70" y="86" text-anchor="middle" class="small">{label}</text>
  </svg>
  <ul>
    {#each items as it, i}
      <li><i style="background: {COLORS[i % COLORS.length]}"></i><span>{it.label}</span><b>{pct(it.value)}%</b></li>
    {/each}
  </ul>
</div>

<style>
  .donut {
    display: flex;
    align-items: center;
    justify-content: center; /* chart and legend stay together as one centred group */
    gap: 42px;
    flex-wrap: wrap;
    padding: 6px 0;
  }
  svg {
    width: 150px;
    height: 150px;
    flex: none;
  }
  .track {
    fill: none;
    stroke: #f6f1e7;
    stroke-width: 18;
  }
  .big {
    font: 600 20px sans-serif;
    fill: #4f3933;
  }
  .small {
    font-size: 9.5px;
    fill: #776a59;
  }
  ul {
    flex: none;
    min-width: 150px;
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 7px;
    font-size: 14px;
  }
  li {
    display: flex;
    align-items: center;
    gap: 8px;
  }
  li span {
    flex: 1;
    padding-right: 14px;
  }
  i {
    width: 10px;
    height: 10px;
    border-radius: 50%;
    flex: none;
  }
  b {
    font-weight: 600;
    font-variant-numeric: tabular-nums;
  }
</style>
