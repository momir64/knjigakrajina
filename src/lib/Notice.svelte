<script lang="ts">
  import { hideNotice, notice } from './cart.svelte.js'

  // Serbian number agreement: 1, 21, 31 ... one book; 2-4, 22-24 ... books (plural verb); 5-20, 25-30 ... "књига" with a neuter verb
  function added(n: number): string {
    const last = n % 10
    const tail = n % 100
    if (last === 1 && tail !== 11) return 'књига је додата'
    if (last >= 2 && last <= 4 && (tail < 12 || tail > 14)) return 'књиге су додате'
    return 'књига је додато'
  }
</script>

{#if notice.open}
  <div class="notice" role="alert">
    <span class="notice-icon" aria-hidden="true">
      <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.627 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z" /></svg>
    </span>
    <a class="notice-btn" href="/korpa/">Преглед корпе</a>
    <span class="notice-text">
      {#if notice.qty > 1}{notice.qty} × „{notice.title}“ {added(notice.qty)} у вашу корпу.{:else}„{notice.title}“ књига је додата у вашу корпу.{/if}
    </span>
    <button class="notice-close" type="button" aria-label="Затвори" onclick={hideNotice}>
      <svg viewBox="0 0 24 24" width="16" height="16" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" /></svg>
    </button>
  </div>
{/if}
