<script lang="ts">
  import { ORDER_STATUSES } from '#lib/admin'
  import { money } from '#lib/api.js'

  let { data } = $props()

  const query = (page: number, status = data.status) => {
    const q = new URLSearchParams()
    if (status) q.set('status', status)
    if (page > 1) q.set('page', String(page))
    return q.size ? `?${q}` : '.'
  }
</script>

<h1>Наруџбине <small>({data.total})</small></h1>

<p class="filters">
  <a href={query(1, '')} class:on={!data.status}>Све</a>
  {#each Object.entries(ORDER_STATUSES) as [key, label]}
    <a href={query(1, key)} class:on={data.status === key}>{label}</a>
  {/each}
</p>

{#if data.orders.length === 0}
  <p class="empty">Нема наруџбина.</p>
{:else}
  <div class="scroll">
    <table class="list">
      <thead>
        <tr><th>Датум</th><th>Купац</th><th>Место</th><th class="num">Ком.</th><th class="num">Износ</th><th class="st">Статус</th><th class="st"></th></tr>
      </thead>
      <tbody>
        {#each data.orders as o (o.id)}
          <tr>
            <td>{o.created}</td>
            <td>{o.name}</td>
            <td>{o.city}</td>
            <td class="num">{o.qty}</td>
            <td class="num">{money(o.total)}</td>
            <td class="st"><span class="status s-{o.status}">{ORDER_STATUSES[o.status]}</span></td>
            <td class="act">
              <a class="icon-btn" href="{data.base}/narudzbine/{o.id}/" title="Више детаља" aria-label="Више детаља">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="7" /><path d="m20 20-4-4" /></svg>
              </a>
            </td>
          </tr>
        {/each}
      </tbody>
    </table>
  </div>

  {#if data.pages > 1}
    <p class="pager">
      {#if data.page > 1}<a href={query(data.page - 1)}>← Новије</a>{/if}
      <span>{data.page} / {data.pages}</span>
      {#if data.page < data.pages}<a href={query(data.page + 1)}>Старије →</a>{/if}
    </p>
  {/if}
{/if}
