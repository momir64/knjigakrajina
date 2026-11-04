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
      <svg class="cart-icon" viewBox="0 -850 1000 1000" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path transform="scale(1 -1)" d="M740 -4Q740 -26 755 -41Q770 -56 792 -56Q814 -56 829 -41Q844 -26 844 -4Q844 18 828.5 33Q813 48 792 48Q771 48 755.5 33Q740 18 740 -4ZM217 694H958Q972 694 981.5 683.5Q991 673 989 659L957 398Q952 355 919 326.5Q886 298 843 298H297L303 269Q309 236 335 215Q361 194 395 194H875Q888 194 897 185Q906 176 906 163Q906 150 897 140.5Q888 131 875 131H394Q357 131 324.5 147.5Q292 164 270 192.5Q248 221 241 257L141 756H42Q29 756 19.5 765.5Q10 775 10 788Q10 801 19.5 810Q29 819 42 819H167Q178 819 187 812Q196 805 198 794ZM230 631 284 360H843Q862 360 877 373Q892 386 895 406L923 631ZM677 -4Q677 27 692.5 53Q708 79 734.5 94.5Q761 110 792 110Q823 110 849.5 94.5Q876 79 891 53Q906 27 906 -4Q906 -35 890.5 -61.5Q875 -88 849 -103.5Q823 -119 792 -119Q761 -119 734.5 -103.5Q708 -88 692.5 -61.5Q677 -35 677 -4ZM260 -4Q260 27 275.5 53Q291 79 317.5 94.5Q344 110 375 110Q406 110 432.5 94.5Q459 79 474.5 53Q490 27 490 -4Q490 -35 474.5 -61.5Q459 -88 432.5 -103.5Q406 -119 375 -119Q344 -119 317.5 -103.5Q291 -88 275.5 -61.5Q260 -35 260 -4ZM323 -4Q323 -26 338 -41Q353 -56 375 -56Q397 -56 412 -41Q427 -26 427 -4Q427 18 412 33Q397 48 375 48Q353 48 338 33Q323 18 323 -4Z" /></svg>
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
