<script lang="ts">
  import { page } from '$app/state'
  import Seo from '#lib/Seo.svelte'
</script>

<Seo title="Страница није пронађена | Књига Крајина" path={page.url.pathname} noindex />

<div class="content-narrow">
  <h1 class="page-title">{page.status}</h1>
  {#if page.status === 404}
    <p class="center">Страница коју тражите не постоји. <a href="/">Повратак на почетну</a></p>
  {:else}
    <p class="center">Дошло је до грешке. <a href="/">Повратак на почетну</a></p>
  {/if}
</div>
