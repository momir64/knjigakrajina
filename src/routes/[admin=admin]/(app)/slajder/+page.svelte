<script lang="ts">
  import { sliderImage } from '#lib/media'

  let { data, form } = $props()
  const full = $derived(data.slides.length >= data.max)
</script>

<div class="page-head">
  <h1>Слајдер <small>({data.slides.length})</small></h1>
  {#if full}
    <span class="muted">Највише {data.max} слајдова</span>
  {:else}
    <a class="btn" href="{data.base}/slajder/nova/">+ Нови слајд</a>
  {/if}
</div>

<p class="lead">
  Слајдови на почетној страни смењују се овим редом. Слајд се не приказује ако је искључен или ако је његова књига сакривена.
  <a href="/" target="_blank" rel="noopener">Почетна ↗</a>
</p>

{#if form?.error}<p class="msg err">{form.error}</p>{/if}

{#if data.slides.length === 0}
  <p class="empty">Нема слајдова – на почетној страни се не приказује слајдер.</p>
{:else}
  <div class="scroll">
    <table class="list slides">
      <thead>
        <tr><th class="st">Ред</th><th></th><th>Књига</th><th>Опис</th><th class="num">Видљиво</th><th class="st"></th></tr>
      </thead>
      <tbody>
        {#each data.slides as s, i (s.id)}
          {@const shown = s.active && s.bookShown}
          <tr class:off={!shown}>
            <td class="st">
              <form method="post" action="?/move" class="order-btns">
                <input type="hidden" name="id" value={s.id} />
                <button class="icon-btn small" name="dir" value="up" disabled={i === 0} title="Помери горе" aria-label="Помери горе">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6" /></svg>
                </button>
                <button class="icon-btn small" name="dir" value="down" disabled={i === data.slides.length - 1} title="Помери доле" aria-label="Помери доле">
                  <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
                </button>
              </form>
            </td>
            <td class="thumb slide-thumb"><img src={sliderImage(s.image)} alt="" loading="lazy" /></td>
            <td>
              {#if s.title}{s.title}{:else}<span class="msg err">Књига више не постоји</span>{/if}
            </td>
            <td class="blurb">{s.text}</td>
            <td class="num">
              {shown ? 'Да' : 'Не'}
              {#if s.active && s.title && !s.bookShown}<br /><small class="muted">књига је сакривена</small>{/if}
            </td>
            <td class="act">
              <a class="icon-btn" href="{data.base}/slajder/{s.id}/" title="Више детаља" aria-label="Више детаља">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>
{/if}
