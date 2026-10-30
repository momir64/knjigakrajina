<script lang="ts">
  import { page } from '$app/state'

  let { data, children } = $props()

  const links = $derived([
    ['narudzbine', 'Наруџбине'],
    ['knjige', 'Књиге'],
    ['slajder', 'Слајдер'],
    ['cenovnik', 'Ценовник'],
    ['obavestenja', 'Обавештења'],
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
  <a href="/" target="_blank" rel="noopener" class="btn-outline">Сајт ↗</a>
  <form method="post" action="{data.base}/logout"><button class="btn-outline" type="submit">Одјава</button></form>
</header>

<main class="adm-main">
  {@render children()}
</main>
