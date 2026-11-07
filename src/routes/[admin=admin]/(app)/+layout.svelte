<script lang="ts">
  import { page } from '$app/state'

  let { data, children } = $props()

  // visits from the browser where the owner is signed in are not counted in the statistics (see src/lib/track.ts)
  $effect(() => {
    try {
      localStorage.setItem('kk-skip', '1')
    } catch {
      // storage blocked
    }
  })

  const links = $derived([
    ['narudzbine', 'Наруџбине'],
    ['knjige', 'Књиге'],
    ['slajder', 'Слајдер'],
    ['cenovnik', 'Ценовник'],
    ['obavestenja', 'Обавештења'],
    ['statistika', 'Статистика'],
  ])
</script>

<header class="bar">
  <nav>
    {#each links as [slug, label]}
      <a href="{data.base}/{slug}/" class:on={page.url.pathname.startsWith(`${data.base}/${slug}/`)}>
        {label}{#if slug === 'narudzbine' && data.newOrders > 0}<span class="badge">{data.newOrders}</span>{/if}
      </a>
    {/each}
  </nav>
  <span class="grow"></span>
  <a href="/" target="_blank" rel="noopener" class="btn-outline act" title="Сајт" aria-label="Сајт">
    <span class="lbl">Сајт ↗</span>
    <svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 3h6v6" /><path d="M10 14 21 3" /><path d="M18 14v5a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h5" /></svg>
  </a>
  <form method="post" action="{data.base}/logout">
    <button class="btn-outline act" type="submit" title="Одјава" aria-label="Одјава">
      <span class="lbl">Одјава</span>
      <svg class="ico" viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" /><path d="m16 17 5-5-5-5" /><path d="M21 12H9" /></svg>
    </button>
  </form>
</header>

<main class="adm-main">
  {@render children()}
</main>
