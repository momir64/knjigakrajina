<script lang="ts">
  import '../styles/app.scss'
  import { page } from '$app/state'
  import Header from '#lib/Header.svelte'
  import Footer from '#lib/Footer.svelte'
  import Notice from '#lib/Notice.svelte'
  import Seo from '#lib/Seo.svelte'
  import { hideNotice } from '#lib/cart.svelte.js'

  let { children } = $props()

  $effect(() => {
    page.url.pathname
    hideNotice()
  })
</script>

<Seo />
<Header />
<Notice />
<main>
  {@render children()}
</main>
<Footer />
