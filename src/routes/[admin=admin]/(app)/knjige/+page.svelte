<script lang="ts">
  import { money } from '#lib/api.js'
  import { bookImage } from '#lib/media'

  let { data } = $props()
</script>

<div class="page-head">
  <h1>Књиге <small>({data.books.length})</small></h1>
  <a class="btn" href="{data.base}/knjige/nova/">+ Нова књига</a>
</div>

<div class="scroll">
  <table class="list">
    <thead><tr><th></th><th>Наслов</th><th>Аутор</th><th class="num">Цена</th><th class="num">Ред</th><th class="num">Видљиво</th><th></th></tr></thead>
    <tbody>
      {#each data.books as b (b.id)}
        <tr class:off={!b.active}>
          <td class="thumb"><img src={bookImage(b.image)} alt="" loading="lazy" /></td>
          <td>{b.title}</td>
          <td>{b.author}</td>
          <td class="num">{money(b.price)}</td>
          <td class="num">{b.sort}</td>
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
