<script lang="ts">
  import { onMount } from 'svelte'
  import { page } from '$app/state'
  import { count } from './cart.svelte.js'

  const path = $derived(page.url.pathname)
  let open = $state(false)
  // the cart lives in localStorage, so the count is only shown once the page runs in the browser
  let mounted = $state(false)
  onMount(() => (mounted = true))

  const links = [
    ['/', 'ПОЧЕТНА'],
    ['/knjige/', 'КЊИГЕ'],
    ['/usluge/', 'УСЛУГЕ'],
    ['/kontakt/', 'КОНТАКТ'],
  ]
  const active = (href: string) => (href === '/' ? path === '/' : path.startsWith(href.replace(/\/$/, '')))

  $effect(() => {
    path
    open = false
  })
</script>

<header class="site-header">
  <a class="logo" href="/" aria-label="Књига Крајина">
    <img src="/logo.svg" width="216" height="70" alt="Лого Књига Крајина" />
  </a>

  <div class="header-right">
    <nav class="nav-desktop" aria-label="Главни мени">
      {#each links as [href, label]}
        <a {href} class:active={active(href)}>{label}</a>
      {/each}
    </nav>

    <button class="burger" aria-label="Мени" onclick={() => (open = true)}>
      <svg viewBox="0 0 24 24" width="22" height="22" fill="currentColor"><path d="M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z" /></svg>
    </button>

    <a class="cart-link" href="/korpa/" aria-label="Корпа">
      <i class="eicon eicon-cart" aria-hidden="true"></i>
      {#if mounted && count() > 0}<span class="bubble">{count()}</span>{/if}
    </a>

  </div>
</header>

<div class="flyout" class:open>
  <button class="flyout-overlay" aria-label="Затвори" onclick={() => (open = false)}></button>
  <div class="flyout-panel">
    <button class="flyout-close" aria-label="Затвори" onclick={() => (open = false)}>
      <svg viewBox="0 0 24 24" width="26" height="26" fill="currentColor"><path d="M19 6.4 17.6 5 12 10.6 6.4 5 5 6.4 10.6 12 5 17.6 6.4 19 12 13.4 17.6 19 19 17.6 13.4 12z" /></svg>
    </button>
    <nav>
      {#each links as [href, label]}
        <a {href} class:active={active(href)}>{label}</a>
      {/each}
    </nav>
  </div>
</div>
