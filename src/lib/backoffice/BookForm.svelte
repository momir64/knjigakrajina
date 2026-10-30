<script lang="ts">
  import type { Snippet } from 'svelte'
  import { BINDINGS, SCRIPTS, type AdminBook } from '#lib/admin'
  import { bookImage } from '#lib/media'

  type Values = Partial<Omit<AdminBook, 'id'>>

  let {
    book,
    errors = {},
    action = '',
    id,
    actions,
    formEl = $bindable(),
  }: {
    book: Values | null
    errors?: Record<string, string>
    action?: string
    id?: string
    /** buttons shown in the cover row, top right */
    actions?: Snippet
    formEl?: HTMLFormElement
  } = $props()
  const v = $derived(book ?? {})

  // address under the slug field follows what is typed
  let slug = $derived(v.slug ?? '')

  // cover: the stored one, replaced by a preview of the newly chosen file
  let preview = $state<string | null>(null)
  const cover = $derived(preview ?? (v.image ? bookImage(v.image) : null))
  function pick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    preview = file ? URL.createObjectURL(file) : null
  }

</script>

{#snippet field(name: keyof Values & string, label: string, options?: string[])}
  <label>
    {label}
    {#if options}
      {@const current = String(v[name] ?? (book ? '' : options[0]))}
      <select {name}>
        <option value="" selected={current === ''}>—</option>
        {#each options as o}<option value={o} selected={current === o}>{o}</option>{/each}
        {#if current && !options.includes(current)}<option value={current} selected>{current}</option>{/if}
      </select>
    {:else}
      <input {name} value={v[name] ?? ''} />
    {/if}
    {#if errors[name]}<span class="msg err">{errors[name]}</span>{/if}
  </label>
{/snippet}

<form bind:this={formEl} method="post" {id} {action} enctype="multipart/form-data" class="book-form">
  <div class="wide cover">
    {#if cover}<img src={cover} alt="Корица" />{/if}
    <label class="pick">
      {v.image || preview ? 'Замени корицу' : 'Корица'}
      <input type="file" name="image" accept="image/webp,image/png,image/jpeg,image/gif,image/avif" onchange={pick} />
      {#if errors.image}<span class="msg err">{errors.image}</span>{/if}
      <span class="hint">WebP, PNG, JPEG, GIF или AVIF, највише 20 MB.</span>
    </label>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </div>

  <label class="wide">
    Наслов
    <input name="title" value={v.title ?? ''} required maxlength="300" />
    {#if errors.title}<span class="msg err">{errors.title}</span>{/if}
  </label>

  <div class="frow" style="--n: 4">
    {@render field('author', 'Аутор')}
    <label>
      Адреса на сајту
      <input name="slug" bind:value={slug} placeholder="празно = од наслова" maxlength="100" />
      {#if errors.slug}<span class="msg err">{errors.slug}</span>{/if}
      <!-- <span class="hint">/knjige/<b>{slug || '…'}</b>/</span> -->
    </label>
    {@render field('isbn', 'ISBN')}
    <label>
      Цена (РСД)
      <input name="price" inputmode="numeric" value={v.price ?? ''} required pattern="[0-9]+" />
      {#if errors.price}<span class="msg err">{errors.price}</span>{/if}
    </label>
  </div>

  <div class="frow" style="--n: 5">
    {@render field('pages', 'Број страна')}
    {@render field('weight', 'Тежина (g)')}
    {@render field('length', 'Дужина (cm)')}
    {@render field('width', 'Ширина (cm)')}
    {@render field('height', 'Висина (cm)')}
  </div>

  <div class="frow" style="--n: 5">
    {@render field('year', 'Година издавања')}
    {@render field('binding', 'Повез', BINDINGS)}
    {@render field('script', 'Писмо', SCRIPTS)}
    <label>
      Приказ на сајту
      <select name="active">
        <option value="1" selected={book ? !!v.active : true}>Да</option>
        <option value="0" selected={book ? !v.active : false}>Не</option>
      </select>
    </label>
    <label>
      Редослед
      <input name="sort" inputmode="numeric" value={v.sort ?? ''} placeholder="празно = на крај" />
      {#if errors.sort}<span class="msg err">{errors.sort}</span>{/if}
      <span class="hint">Мањи број је раније на списку.</span>
    </label>
  </div>

  <label class="wide">
    Опис (HTML)
    <textarea name="description" rows="14">{v.description ?? ''}</textarea>
    {#if errors.description}<span class="msg err">{errors.description}</span>{/if}
    <span class="hint">
      Текст се пише у HTML-у. Свака ознака се отвара и затвара, нпр. {'<p>текст</p>'}.
    </span>
    <ul class="hint tags">
      <li><code>{'<p>…</p>'}</code> – један пасус; сваки пасус стави у своје <code>{'<p>'}</code>.</li>
      <li><code>{'<br>'}</code> – знак за нови ред унутар пасуса (не затвара се).</li>
      <li><code>{'<em>…</em>'}</code> – курзив, <code>{'<strong>…</strong>'}</code> – подебљано.</li>
      <li><code>{'<a href="https://…">…</a>'}</code> – линк.</li>
      <li><code>{'<ul><li>…</li><li>…</li></ul>'}</code> – листа са тачкама.</li>
      <li>
        <code>{'&#8222;'}</code> – доњи наводник „ (отварање), <code>{'&#8220;'}</code> – горњи наводник “ (затварање), нпр.
        <code>{'&#8222;Наслов&#8220;'}</code>.
      </li>
    </ul>
  </label>

</form>
