<script lang="ts">
  import { goto } from '$app/navigation'
  import { cart, subtotal, clear, setMethod } from '#lib/cart.svelte.js'
  import { placeOrder, money } from '#lib/api.js'
  import Seo from '#lib/Seo.svelte'
  import type { Address, OrderPayload } from '#lib/types'

  const states = ['Београд', 'Бор', 'Браничево', 'Централни Банат', 'Дунав', 'Јабланица', 'Колубара', 'Мачва', 'Морава', 'Нишава', 'Северна Бачка', 'Северни Банат', 'Пчиња', 'Пирот', 'Поморавље', 'Расина', 'Рашка', 'Јужна Бачка', 'Јужни Банат', 'Срем', 'Шумадија', 'Топлица', 'Западна Бачка', 'Зајечар', 'Златибор', 'Косово', 'Пећ', 'Призрен', 'Косовска Митровица', 'Косовско Поморавље', 'Косово-Метохија', 'Војводина']

  const blank = (): Address => ({ first_name: '', last_name: '', country: 'Србија', address: '', city: '', state: '', postcode: '', phone: '' })
  let billing = $state({ ...blank(), email: '' })
  let shipping = $state(blank())
  let shipDifferent = $state(false)
  let comments = $state('')
  let method = $state(cart.method)
  let errors = $state<Record<string, string>>({})
  let busy = $state(false)
  let failed = $state(false)

  // Empty cart -> back to the cart page, like WooCommerce
  $effect(() => {
    if (cart.items.length === 0 && !busy) goto('/korpa/', { replaceState: true })
  })

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    busy = true
    failed = false
    errors = {}
    const payload: OrderPayload = {
      ...billing,
      ship_different: shipDifferent,
      ...Object.fromEntries(Object.entries(shipping).map(([k, v]) => [`ship_${k}`, v])),
      order_comments: comments,
      shipping_method: method,
      items: cart.items.map((i) => ({ slug: i.slug, qty: i.qty })),
    }
    try {
      const { ok, data } = await placeOrder(payload)
      if (ok) {
        clear()
        goto('/placanje/narudzbina-primljena/')
        return
      }
      errors = data.errors ?? {}
      failed = !data.errors
    } catch {
      failed = true
    }
    busy = false
    if (!failed) requestAnimationFrame(() => document.querySelector('.invalid')?.scrollIntoView({ block: 'center' }))
  }
</script>

<Seo title="ПЛАЋАЊЕ | Књига Крајина" path="/placanje/" noindex />

{#snippet field(label: string, obj: Record<string, string>, key: string, prefix: string, opts: { wide?: boolean; optional?: boolean; select?: boolean; type?: string; placeholder?: string } = {})}
  {@const name = prefix + key}
  <p class="form-row" class:invalid={errors[name]} class:wide={opts.wide}>
    <label for={name}>{label}{#if !opts.optional}&nbsp;<abbr title="обавезно">*</abbr>{:else}&nbsp;<span class="opt">(опционо)</span>{/if}</label>
    {#if opts.select}
      <select id={name} bind:value={obj[key]} autocomplete="address-level1">
        <option value="">Одаберите опцију…</option>
        {#each states as s}<option>{s}</option>{/each}
      </select>
    {:else if key === 'country'}
      <select id={name} bind:value={obj[key]}><option>Србија</option></select>
    {:else}
      <input id={name} type={opts.type ?? 'text'} bind:value={obj[key]} placeholder={opts.placeholder ?? ''} />
    {/if}
    {#if errors[name]}<span class="err">{errors[name] === 'invalid' ? 'Унесите исправну вредност.' : 'Ово поље је обавезно.'}</span>{/if}
  </p>
{/snippet}

<div class="content-narrow checkout">
  <h2 class="page-title">ПЛАЋАЊЕ</h2>

  <form onsubmit={submit} novalidate>
    <div class="checkout-cols">
      <div class="checkout-fields">
        <h3>Подаци за испоруку</h3>
        <div class="form-grid">
          {@render field('Име', billing, 'first_name', 'billing_')}
          {@render field('Презиме', billing, 'last_name', 'billing_')}
          {@render field('Држава', billing, 'country', 'billing_', { wide: true })}
          {@render field('Улица и кућни број', billing, 'address', 'billing_', { wide: true })}
          {@render field('Град', billing, 'city', 'billing_', { wide: true })}
          {@render field('Поштански број', billing, 'postcode', 'billing_', { wide: true })}
          {@render field('Телефон', billing, 'phone', 'billing_', { wide: true, type: 'tel' })}
          {@render field('Адреса е-поште', billing, 'email', 'billing_', { wide: true, type: 'email' })}
        </div>

      </div>

      <div class="order-review">
        <h3>Ваша наруџбина</h3>
        <table>
          <thead><tr><th>Производ</th><th>Цена</th></tr></thead>
          <tbody>
            {#each cart.items as i (i.slug)}
              <tr><td>{i.title}&nbsp;<strong class="num">× {i.qty}</strong></td><td class="num">{money(i.price * i.qty)}</td></tr>
            {/each}
          </tbody>
          <tfoot>
            <!-- <tr><th>Укупно без поштарине</th><td class="num">{money(subtotal())}</td></tr> -->
            <tr>
              <th>Пошиљка</th>
              <td>
                <ul class="methods">
                  <li><label><input type="radio" bind:group={method} onchange={() => setMethod(method)} value="pickup" /> Лично преузимање</label></li>
                  <li><label><input type="radio" bind:group={method} onchange={() => setMethod(method)} value="post" /> Пост експрес</label></li>
                </ul>
                {#if errors.shipping_method}<span class="err">Одаберите начин испоруке.</span>{/if}
              </td>
            </tr>
            <tr><th>Укупно</th><td class="num"><strong>{money(subtotal())}</strong></td></tr>
          </tfoot>
        </table>

        <div class="payment">
          <p>Плаћање поузећем</p>
          <p>Платите готовином приликом преузимања пакета.</p>
          {#if method === 'post'}<p>Цена поштарине није урачуната у цену.</p>{/if}
        </div>

        {#if failed}<p class="woo-error">Дошло је до грешке приликом слања наруџбине. Покушајте поново.</p>{/if}
        <button class="btn-main block" type="submit" disabled={busy}>{busy ? 'Слање…' : 'Наручите'}</button>
      </div>
    </div>
  </form>
</div>
