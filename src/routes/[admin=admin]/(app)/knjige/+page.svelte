<script lang="ts">
  import { money } from '#lib/api.js'
  import { bookImage } from '#lib/media'

  let { data, form } = $props()
</script>

<div class="page-head">
  <h1>Књиге <small>({data.books.length})</small></h1>
  <a class="btn" href="{data.base}/knjige/nova/">+ Нова књига</a>
</div>

{#if form?.error}<p class="msg err">{form.error}</p>{/if}

<div class="scroll">
  <table class="list">
    <thead><tr><th class="st">Ред</th><th></th><th>Наслов</th><th>Аутор</th><th class="num">Цена</th><th class="num">Видљиво</th><th></th></tr></thead>
    <tbody>
      {#each data.books as b, i (b.id)}
        <tr class:off={!b.active}>
          <td class="st">
            <form method="post" action="?/move" class="order-btns">
              <input type="hidden" name="id" value={b.id} />
              <button class="icon-btn small" name="dir" value="up" disabled={i === 0} title="Помери горе" aria-label="Помери горе">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 15l6-6 6 6" /></svg>
              </button>
              <button class="icon-btn small" name="dir" value="down" disabled={i === data.books.length - 1} title="Помери доле" aria-label="Помери доле">
                <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9l6 6 6-6" /></svg>
              </button>
            </form>
          </td>
          <td class="thumb"><img src={bookImage(b.image)} alt="" loading="lazy" /></td>
          <td>{b.title}</td>
          <td>{b.author}</td>
          <td class="num">{money(b.price)}</td>
          <td class="num">{b.active ? 'Да' : 'Не'}</td>
          <td class="act">
            <a class="icon-btn" href="{data.base}/knjige/{b.id}/" title="Више детаља" aria-label="Више детаља">
              <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
            </a>
          </td>
        </tr>
      {/each}
    </tbody>
  </table>
</div>
