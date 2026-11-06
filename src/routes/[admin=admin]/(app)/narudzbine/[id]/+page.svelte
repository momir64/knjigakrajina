<script lang="ts">
  import ConfirmDialog from '#lib/backoffice/ConfirmDialog.svelte'
  import { ORDER_STATUSES, SHIPPING_LABELS } from '#lib/admin'
  import { money } from '#lib/api.js'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
  const o = $derived(data.order)
  let deleteForm = $state<HTMLFormElement>()
  let deleteOpen = $state(false)
</script>

<p class="back"><a href="{data.base}/narudzbine/">← Све наруџбине</a></p>
<div class="page-head">
  <h1>Наруџбина од {data.created}</h1>
  <button class="btn danger" type="button" onclick={() => (deleteOpen = true)}>Обриши</button>
</div>

<div class="cols">
  <section class="card">
    <h2>Купац и испорука</h2>
    <p>
      {o.first_name} {o.last_name}<br />
      <a href="mailto:{o.email}">{o.email}</a><br />
      <a href="tel:{o.phone}">{o.phone}</a>
    </p>
    <p>{o.address}<br />{o.postcode} {o.city}{#if o.state}, {o.state}{/if}<br />{o.country}</p>
    <p>{SHIPPING_LABELS[o.shipping_method] ?? o.shipping_method} · плаћање поузећем</p>
  </section>

  <section class="card">
    <h2>Статус</h2>
    <form id="status-form" method="post" action="?/status" class="row">
      <select name="status" aria-label="Статус">
        {#each Object.entries(ORDER_STATUSES) as [key, label]}
          <option value={key} selected={o.status === key}>{label}</option>
        {/each}
      </select>
      <button class="btn" type="submit">Сачувај</button>
    </form>
    <label class="check-line">
      <input type="checkbox" name="notify" form="status-form" /> Обавести купца е-поштом
    </label>
    {#if form?.saved}
      <p class="msg ok">Сачувано.{#if form.mail === 'sent'} Купцу је послата порука.{/if}</p>
    {/if}
    {#if form?.mail === 'failed'}<p class="msg err">Порука купцу није послата (проверите подешавање е-поште).</p>{/if}
    {#if form?.error}<p class="msg err">{form.error}</p>{/if}
  </section>
</div>

{#if o.note}
  <section class="card">
    <h2>Напомена купца</h2>
    <p class="pre">{o.note}</p>
  </section>
{/if}

<section class="card">
  <h2>Књиге</h2>
  <div class="scroll">
    <table class="list">
      <thead><tr><th>Наслов</th><th class="num">Цена</th><th class="num">Ком.</th><th class="num">Износ</th></tr></thead>
      <tbody>
        {#each data.items as i (i.id)}
          <tr><td>{i.title}</td><td class="num">{money(i.price)}</td><td class="num">{i.qty}</td><td class="num">{money(i.price * i.qty)}</td></tr>
        {/each}
      </tbody>
      <tfoot><tr><th colspan="3">Укупно (без поштарине)</th><th class="num">{money(o.total)}</th></tr></tfoot>
    </table>
  </div>
</section>

<p class="muted">ID: {o.id}</p>

<form bind:this={deleteForm} method="post" action="?/delete" hidden></form>

<ConfirmDialog
  bind:open={deleteOpen}
  danger
  title="Обрисати наруџбину?"
  text="Наруџбина ће бити трајно обрисана."
  confirm="Обриши"
  onconfirm={() => deleteForm?.requestSubmit()}
/>
