<script lang="ts">
  import { notice } from './cart.svelte.js'
</script>

{#if notice.open}
  <div class="notice" role="alert">
    <span class="notice-icon" aria-hidden="true">
      <svg viewBox="0 0 512 512" width="20" height="20" fill="currentColor"><path d="M504 256c0 136.967-111.033 248-248 248S8 392.967 8 256 119.033 8 256 8s248 111.033 248 248zM227.314 387.314l184-184c6.248-6.248 6.248-16.379 0-22.627l-22.627-22.627c-6.248-6.249-16.379-6.249-22.628 0L216 308.118l-70.059-70.059c-6.248-6.248-16.379-6.248-22.627 0l-22.627 22.627c-6.248 6.248-6.248 16.379 0 22.627l104 104c6.249 6.249 16.379 6.249 22.628.001z" /></svg>
    </span>
    <a class="notice-btn" href="/korpa/">Преглед корпе</a>
    <span class="notice-text">
      {#if notice.qty > 1}{notice.qty} × „{notice.title}“ књига су додате у вашу корпу.{:else}„{notice.title}“ књига је додата у вашу корпу.{/if}
    </span>
  </div>
{/if}
