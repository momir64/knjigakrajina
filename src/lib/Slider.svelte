<script lang="ts">
  import { onMount } from 'svelte'
  import type { Slide } from '#lib/types'

  let { slides }: { slides: Slide[] } = $props()
  let index = $state(0)
  let paused = false
  let startX: number | null = null

  const go = (n: number) => (index = (n + slides.length) % slides.length)

  onMount(() => {
    const t = slides.length > 1 ? setInterval(() => !paused && go(index + 1), 7200) : undefined

    // left / right arrow keys switch slides (ignored while typing in a field)
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || e.shiftKey) return
      const el = e.target
      if (el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))) return
      if (e.key === 'ArrowLeft') go(index - 1)
      else if (e.key === 'ArrowRight') go(index + 1)
      else return
      e.preventDefault()
    }
    addEventListener('keydown', onKey)

    return () => {
      clearInterval(t)
      removeEventListener('keydown', onKey)
    }
  })

  function down(e: PointerEvent) {
    startX = e.clientX
  }
  function up(e: PointerEvent) {
    if (startX === null) return
    const dx = e.clientX - startX
    startX = null
    if (Math.abs(dx) > 50) go(index + (dx < 0 ? 1 : -1))
  }
</script>

<section
  class="slider"
  role="group"
  aria-roledescription="carousel"
  onpointerdown={down}
  onpointerup={up}
  onpointercancel={() => (startX = null)}
>
  <div class="slider-track">
    {#each slides as s, i}
      <article class="slide" class:current={i === index} aria-hidden={i !== index} style="--ah:{s.ah}px;--ag:{s.ag}px;--tlh:{s.tlh};--tfs:{s.tfs}">
        <div class="slide-text">
          <h2>{s.title}</h2>
          <h3>{s.author}</h3>
          <div class="slide-desc" lang="sr-Cyrl">{@html s.html}</div>
          <a class="slide-btn" href="/knjige/{s.slug}/" tabindex={i === index ? 0 : -1}>Више о књизи</a>
        </div>
        <a class="slide-img" href="/knjige/{s.slug}/" tabindex="-1" draggable="false" style="--k:{s.k}">
          <img src={s.image} alt={s.title} draggable="false" />
        </a>
      </article>
    {/each}
  </div>

  {#if slides.length > 1}
    <button class="arrow prev" aria-label="prethodna knjiga" onclick={() => go(index - 1)}>
      <svg width="48" height="48" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M21.58 23.58l-7.962-7.583 7.86-7.485c.32-.262.522-.65.522-1.083C22 6.64 21.328 6 20.5 6c-.403 0-.768.15-1.038.398l-.004-.004-9 8.57v.002c-.282.26-.458.624-.458 1.028V16c0 .404.176.77.46 1.03h-.002l9 8.57c.27.247.638.4 1.042.4.83 0 1.5-.64 1.5-1.43 0-.384-.16-.733-.42-.99z" fill="#38342C" fill-rule="evenodd" /></svg>
    </button>
    <button class="arrow next" aria-label="sledeća knjiga" onclick={() => go(index + 1)}>
      <svg width="48" height="48" viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg"><path d="M22 15.997v-.003c0-.404-.176-.768-.46-1.028h.002l-9-8.572-.004.004C12.268 6.15 11.902 6 11.5 6c-.83 0-1.5.64-1.5 1.43 0 .432.203.82.523 1.082l7.86 7.485-7.963 7.583c-.26.257-.42.606-.42.99 0 .79.67 1.43 1.5 1.43.404 0 .77-.153 1.04-.4l9.002-8.57v-.002c.282-.26.458-.624.458-1.028v-.003z" fill="#38342C" fill-rule="evenodd" /></svg>
    </button>
  {/if}
</section>
