<script lang="ts">
  import { CARD_IDS, RANGES, RANGE_LABELS, SOURCE_TYPES, type Pair } from '#lib/analytics'
  import { untrack } from 'svelte'
  import { money } from '#lib/api.js'
  import AreaChart from '#lib/backoffice/charts/AreaChart.svelte'
  import BarList from '#lib/backoffice/charts/BarList.svelte'
  import Donut from '#lib/backoffice/charts/Donut.svelte'
  import Heatmap from '#lib/backoffice/charts/Heatmap.svelte'
  import WorldMap from '#lib/backoffice/charts/WorldMap.svelte'

  let { data } = $props()
  const s = $derived(data.stats)
  const num = (n: number) => n.toLocaleString('sr-RS')

  // change against the previous period of the same length
  function delta(p: Pair) {
    if (p.before === 0) return p.now === 0 ? null : { text: 'ново', dir: 'up' }
    const pct = Math.round(((p.now - p.before) / p.before) * 100)
    return { text: `${pct > 0 ? '+' : ''}${pct}%`, dir: pct > 0 ? 'up' : pct < 0 ? 'down' : 'flat' }
  }

  const cards = $derived([
    { label: 'Посетиоци', value: s.visitors, hint: 'различитих особа' },
    { label: 'Посете', value: s.visits, hint: 'отварање сајта' },
    { label: 'Прегледаних страница', value: s.views, hint: `${s.visits.now ? (s.views.now / s.visits.now).toLocaleString('sr-RS', { maximumFractionDigits: 1 }) : '0'} по посети` },
    { label: 'Наруџбине', value: s.orders, hint: s.orders.revenue ? money(s.orders.revenue) : '' },
  ])

  const TITLES: Record<string, string> = {
    history: 'Историја броја посета',
    map: 'Посетиоци по земљама',
    countries: 'Државе',
    cities: 'Градови',
    sourceTypes: 'Извори посета',
    sources: 'Најчешћи извори',
    pages: 'Странице са највише посета',
    heat: 'Прегледи по данима и сатима',
    devices: 'Уређаји',
    browsers: 'Прегледачи',
  }

  // order and folded cards are kept on the server, so they are the same on every device
  let order = $state<string[]>(untrack(() => [...data.layout.order]))
  let collapsed = $state<string[]>(untrack(() => [...data.layout.collapsed]))
  let drag = $state<string | null>(null)

  function save() {
    const body = new FormData()
    body.set('layout', JSON.stringify({ order, collapsed }))
    fetch('?/layout', { method: 'POST', body, headers: { 'x-sveltekit-action': 'true' } }).catch(() => {})
  }
  // the other cards make room while a card is being dragged; the new order is saved when it is dropped
  function moveTo(id: string, target: string) {
    if (id === target) return
    const next = order.filter((x) => x !== id)
    next.splice(order.indexOf(target), 0, id)
    order = next
  }
  function step(id: string, by: number) {
    const j = order.indexOf(id) + by
    if (j < 0 || j >= order.length) return
    moveTo(id, order[j])
    save()
  }
  function toggle(id: string) {
    collapsed = collapsed.includes(id) ? collapsed.filter((x) => x !== id) : [...collapsed, id]
    save()
  }

  const sourceRows = $derived(s.sources.slice(0, 8).map((r) => ({ label: r.name, value: r.n, note: r.name === SOURCE_TYPES[r.type] ? undefined : SOURCE_TYPES[r.type] })))
  const cityRows = $derived(s.cities.slice(0, 8).map((r) => ({ label: r.city, value: r.v, note: s.countries.find((c) => c.code === r.code)?.name })))
  const countryRows = $derived([...s.countries.slice(0, 8).map((r) => ({ label: r.name, value: r.v })), ...(s.unknownCountry ? [{ label: 'Непознато', value: s.unknownCountry }] : [])])
  const pageRows = $derived(s.pages.map((r) => ({ label: r.title, value: r.views })))
</script>

<div class="stats-head">
  <h1>Статистика</h1>
  <p class="filters">
    {#each RANGES as r}
      <a href="?range={r}" class:on={s.range === r}>{RANGE_LABELS[r]}</a>
    {/each}
  </p>
  <p class="live" title="Посетиоци у последњих 5 минута"><i class:on={s.live > 0}></i>Сада на сајту: <b>{num(s.live)}</b></p>
</div>

{#if s.total === 0}
  <div class="card stats-empty">
    <h2>Још нема података</h2>
    <p>Бројање је укључено. Чим неко отвори сајт, овде ће се појавити посетиоци, места одакле долазе и странице које гледају.<br />Ботови и ваше посете из ове администрације се не броје.</p>
  </div>
{:else}
  <div class="kpis">
    {#each cards as c}
      {@const d = delta(c.value)}
      <div class="card kpi">
        <span class="kpi-label">{c.label}</span>
        <span class="kpi-value">{num(c.value.now)}</span>
        <span class="kpi-foot">
          {#if d}<b class="delta {d.dir}">{d.dir === 'up' ? '▲' : d.dir === 'down' ? '▼' : '■'} {d.text}</b>{/if}
          <span class="muted">{c.hint}</span>
        </span>
      </div>
    {/each}
  </div>

  <div class="stats-cols">
    {#each CARD_IDS as id (id)}
      <section
        class="card chart"
        role="group"
        class:closed={collapsed.includes(id)}
        style:order={order.indexOf(id)}
        class:dragging={drag === id}
        ondragover={(e) => { if (drag) { e.preventDefault(); moveTo(drag, id) } }}
        ondrop={(e) => e.preventDefault()}
      >
        <header>
          <button
            class="grip"
            type="button"
            draggable="true"
            title="Превуците да промените редослед"
            aria-label="Промени редослед: {TITLES[id]}"
            ondragstart={(e) => { drag = id; e.dataTransfer?.setData('text/plain', id); const c = (e.currentTarget as HTMLElement).closest('section'); if (c) e.dataTransfer?.setDragImage(c, 20, 20) }}
            ondragend={() => { drag = null; save() }}
            onkeydown={(e) => { if (e.key === 'ArrowUp' || e.key === 'ArrowDown') { e.preventDefault(); step(id, e.key === 'ArrowUp' ? -1 : 1) } }}
          ><svg viewBox="0 0 10 16" aria-hidden="true">{#each [3, 8, 13] as y}<circle cx="2.5" cy={y} r="1.7" /><circle cx="7.5" cy={y} r="1.7" />{/each}</svg></button>
          <h2>{TITLES[id]}</h2>
          <button class="fold" type="button" aria-expanded={!collapsed.includes(id)} title={collapsed.includes(id) ? 'Прикажи' : 'Сакриј'} onclick={() => toggle(id)}>
            <svg viewBox="0 0 12 12" aria-hidden="true"><path d="M2 4.5 6 8.5 10 4.5" /></svg>
          </button>
        </header>
        {#if !collapsed.includes(id)}
          <div class="body" class:mid={id === 'devices' || id === 'sourceTypes'}>
            {#if id === 'history'}
              <AreaChart days={s.daily} />
            {:else if id === 'map'}
              <WorldMap countries={s.countries} />
            {:else if id === 'countries'}
              <BarList rows={countryRows} />
            {:else if id === 'cities'}
              <BarList rows={cityRows} />
              {#if s.cities.length === 0}
                <p class="muted note">Градови се не виде: у Cloudflare-у (Rules → Settings → Managed Transforms) укључите „Add visitor location headers“.</p>
              {/if}
            {:else if id === 'sourceTypes'}
              {#if s.sourceTypes.length}
                <Donut label="посета" items={s.sourceTypes.map((t) => ({ label: SOURCE_TYPES[t.type] ?? t.type, value: t.n }))} />
              {:else}
                <p class="muted">Још нема података.</p>
              {/if}
            {:else if id === 'sources'}
              <BarList rows={sourceRows} />
            {:else if id === 'pages'}
              <BarList rows={pageRows} />
            {:else if id === 'heat'}
              <Heatmap heat={s.heat} />
            {:else if id === 'devices'}
              <Donut label="посетилаца" items={s.devices.map((d) => ({ label: d.name, value: d.n }))} />
            {:else if id === 'browsers'}
              <BarList rows={s.browsers.slice(0, 6).map((b) => ({ label: b.name, value: b.n }))} />
            {/if}
          </div>
        {/if}
      </section>
    {/each}
  </div>

  <p class="muted stats-foot">
    Бројање је анонимно: без колачића и без чувања IP адреса. „Посетилац“ је ознака која се мења сваког дана, па иста особа која дође у више дана
    сабира се више пута. Не броје се ботови, посете из ове администрације и прегледачи са укљученим „Do Not Track“.
  </p>
{/if}
