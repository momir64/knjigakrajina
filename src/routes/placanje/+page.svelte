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
  let tooMany = $state(false)
  let summary = $state('')

  // Same rules as the server (src/routes/api/orders/+server.ts). Checking here first means a form with a missing field
  // never reaches the server, so it cannot use up the rate limit meant for real orders.
  const REQUIRED: Record<string, string> = {
    first_name: 'Име',
    last_name: 'Презиме',
    country: 'Држава',
    address: 'Улица и кућни број',
    city: 'Град',
    postcode: 'Поштански број',
    phone: 'Телефон',
    email: 'Адреса е-поште',
  }
  const EMAIL_RE = /^[^@\s<>,;"']+@[^@\s<>,;"']+\.[^@\s<>,;"']+$/
  const MAX_LEN: Record<string, number> = { email: 254, address: 200 }

  function validate(): Record<string, string> {
    const found: Record<string, string> = {}
    for (const key of Object.keys(REQUIRED)) {
      const v = String((billing as Record<string, string>)[key] ?? '').trim()
      if (!v) found['billing_' + key] = 'required'
      else if (v.length > (MAX_LEN[key] ?? 100)) found['billing_' + key] = 'too long'
      else if (key === 'email' && !EMAIL_RE.test(v)) found['billing_' + key] = 'invalid'
    }
    return found
  }

  // field names as they read inside a sentence: име, улица и кућни број
  const labelOf = (name: string) => (REQUIRED[name.replace('billing_', '')] ?? name).toLowerCase()

  // а, б и в
  const list = (items: string[]) => (items.length < 2 ? items.join('') : `${items.slice(0, -1).join(', ')} и ${items[items.length - 1]}`)

  function describe(found: Record<string, string>): string {
    const names = Object.keys(found)
    const missing = names.filter((n) => found[n] === 'required').map(labelOf)
    const wrong = names.filter((n) => found[n] !== 'required').map(labelOf)
    const parts: string[] = []
    if (missing.length) parts.push(`Попуните ${missing.length === 1 ? 'обавезно поље' : 'обавезна поља'} ${list(missing)}.`)
    if (wrong.length) parts.push(`Проверите ${wrong.length === 1 ? 'поље' : 'поља'} ${list(wrong)}.`)
    return parts.join(' ')
  }

  function showErrors(found: Record<string, string>) {
    errors = found
    summary = describe(found)
    requestAnimationFrame(() => {
      const first = document.querySelector<HTMLElement>('.form-row.invalid')
      first?.scrollIntoView({ block: 'center' })
      first?.querySelector<HTMLElement>('input, select')?.focus({ preventScroll: true })
    })
  }

  const message = (name: string) => {
    const kind = errors[name]
    if (kind === 'required') return `Поље ${labelOf(name)} је обавезно.`
    if (name === 'billing_email') return 'Унесите исправну адресу е-поште.'
    return `Проверите поље ${labelOf(name)}.`
  }

  // Empty cart -> back to the cart page, like WooCommerce
  $effect(() => {
    if (cart.items.length === 0 && !busy) goto('/korpa/', { replaceState: true })
  })

  async function submit(e: SubmitEvent) {
    e.preventDefault()
    if (busy) return
    failed = false
    tooMany = false
    summary = ''
    errors = {}
    const found = validate()
    if (Object.keys(found).length) return showErrors(found)
    busy = true
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
      if (data.errors) {
        // the server names fields without the "billing_" prefix the inputs use
        busy = false
        return showErrors(Object.fromEntries(Object.entries(data.errors).map(([k, v]) => [k in REQUIRED ? 'billing_' + k : k, v])))
      }
      tooMany = data.error === 'too many requests'
      failed = !tooMany
    } catch {
      failed = true
    }
    busy = false
  }
</script>

<Seo title="ПЛАЋАЊЕ | Књига Крајина" path="/placanje/" noindex />

{#snippet field(label: string, obj: Record<string, string>, key: string, prefix: string, opts: { wide?: boolean; optional?: boolean; select?: boolean; type?: string; placeholder?: string } = {})}
  {@const name = prefix + key}
  <p class="form-row" class:invalid={errors[name]} class:wide={opts.wide}>
    <span class="field">
      {#if opts.select}
        <select id={name} bind:value={obj[key]} autocomplete="address-level1">
          <option value="">Одаберите опцију…</option>
          {#each states as s}<option>{s}</option>{/each}
        </select>
      {:else if key === 'country'}
        <select id={name} bind:value={obj[key]}><option>Србија</option></select>
      {:else}
        <input id={name} type={opts.type ?? 'text'} bind:value={obj[key]} placeholder=" " />
      {/if}
      <label for={name}>{label}{#if !opts.optional}<abbr title="обавезно">*</abbr>{:else}&nbsp;<span class="opt">(опционо)</span>{/if}</label>
    </span>
    {#if errors[name]}<span class="err">{message(name)}</span>{/if}
  </p>
{/snippet}

<div class="content-narrow checkout">
  <h2 class="page-title">ПЛАЋАЊЕ</h2>

  <form onsubmit={submit} novalidate>
    <div class="checkout-cols">
      <div class="checkout-fields">
        <h3>Подаци за испоруку</h3>
        <div class="field-group" role="group" aria-labelledby="group-contact">
          <h4 id="group-contact">Контакт</h4>
          <div class="form-grid">
            {@render field('Име', billing, 'first_name', 'billing_')}
            {@render field('Презиме', billing, 'last_name', 'billing_')}
            {@render field('Телефон', billing, 'phone', 'billing_', { wide: true, type: 'tel' })}
            {@render field('Адреса е-поште', billing, 'email', 'billing_', { wide: true, type: 'email' })}
          </div>
        </div>

        <div class="field-group" role="group" aria-labelledby="group-address">
          <h4 id="group-address">Адреса</h4>
          <div class="form-grid">
            {@render field('Држава', billing, 'country', 'billing_', { wide: true })}
            {@render field('Улица и кућни број', billing, 'address', 'billing_', { wide: true })}
            {@render field('Град', billing, 'city', 'billing_')}
            {@render field('Поштански број', billing, 'postcode', 'billing_')}
          </div>
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

        {#if summary}<p class="woo-error" role="alert">{summary}</p>{/if}
        {#if tooMany}<p class="woo-error" role="alert">Послато је превише покушаја. Сачекајте неколико минута и покушајте поново.</p>{/if}
        {#if failed}<p class="woo-error" role="alert">Дошло је до грешке приликом слања наруџбине. Покушајте поново.</p>{/if}
        <button class="btn-main block" type="submit" disabled={busy}>{busy ? 'Слање…' : 'Наручите'}</button>
      </div>
    </div>
  </form>
</div>
