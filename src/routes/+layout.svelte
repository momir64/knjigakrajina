<script lang="ts">
  import '../styles/app.scss'
  import { page } from '$app/state'
  import Header from '#lib/Header.svelte'
  import Footer from '#lib/Footer.svelte'
  import Notice from '#lib/Notice.svelte'
  import Seo from '#lib/Seo.svelte'
  import { hideNotice } from '#lib/cart.svelte.js'

  let { data, children } = $props()

  $effect(() => {
    page.url.pathname
    hideNotice()
  })
</script>

{#if data.chrome !== false}
  <Seo />
  <Header />
  <Notice />
  <main>
    {@render children()}
  </main>
  <Footer />
{:else}
  {@render children()}
{/if}
