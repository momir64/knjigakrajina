<script lang="ts">
  import { cart, setQty, remove, subtotal, setMethod } from '#lib/cart.svelte.js'
  import { money } from '#lib/api.js'
  import Seo from '#lib/Seo.svelte'
  import { bookImage } from '#lib/media'
</script>

<Seo title="КОРПА | Књига Крајина" path="/korpa/" noindex />

<div class="cart-page" class:empty={cart.items.length === 0}>
  <h2 class="page-title">КОРПА</h2>

  {#if cart.items.length === 0}
    <p class="woo-notice">Ваша корпа је тренутно празна.</p>
    <p class="center"><a class="btn-main inline" href="/knjige/">Назад у продавницу</a></p>
  {:else}
    <div class="cart-wrap">
    <div class="cart-scroll">
    <table class="cart-table">
      <colgroup><col class="c-rm" /><col class="c-img" /><col class="c-name" /><col class="c-price" /><col class="c-qty" /><col class="c-total" /></colgroup>
      <thead>
        <tr><th></th><th class="th-book">Књига</th><th></th><th>Цена</th><th>Количина</th><th>Укупно</th></tr>
      </thead>
      <tbody>
        {#each cart.items as i (i.slug)}
          <tr>
            <td class="rm"><button aria-label="Уклони {i.title}" onclick={() => remove(i.slug)}><svg viewBox="0 0 24 24" width="18" height="18" fill="none" aria-hidden="true"><path d="M5 5l14 14M19 5L5 19" stroke="currentColor" stroke-width="3.4" stroke-linecap="round" /></svg></button></td>
            <td class="thumb"><a href="/knjige/{i.slug}/"><img src={bookImage(i.image)} alt={i.title} /></a></td>
            <td data-label="Књига"><a href="/knjige/{i.slug}/">{i.title}</a></td>
            <td data-label="Цена">{money(i.price)}</td>
            <td data-label="Количина">
              <div class="qty small">
                <button type="button" aria-label="Мање" onclick={() => setQty(i.slug, i.qty - 1)}>−</button>
                <input type="number" min="1" max="99" value={i.qty} onchange={(e) => setQty(i.slug, +e.currentTarget.value || 1)} aria-label="Количина" />
                <button type="button" aria-label="Више" onclick={() => setQty(i.slug, i.qty + 1)}>+</button>
              </div>
            </td>
            <td data-label="Укупно">{money(i.price * i.qty)}</td>
          </tr>
        {/each}
      </tbody>
    </table>
    </div>

    <div class="cart-totals">
      <table>
        <tbody>
          <tr><th>Укупно без поштарине</th><td>{money(subtotal())}</td></tr>
          <tr>
            <th>Пошиљка</th>
            <td class="methods">
              <label><input type="radio" name="m" value="pickup" checked={cart.method === 'pickup'} onchange={() => setMethod('pickup')} /> Лично преузимање</label>
              <label><input type="radio" name="m" value="post" checked={cart.method === 'post'} onchange={() => setMethod('post')} /> Пост експрес</label>
            </td>
          </tr>
          <tr><th>Укупно</th><td>{money(subtotal())}</td></tr>
        </tbody>
      </table>
      <a class="btn-main block big" href="/placanje/">Настави са поруџбином</a>
    </div>
    </div>
  {/if}
</div>
