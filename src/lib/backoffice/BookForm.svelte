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
  <header class="editor-head">
    <h1>{book ? v.title || 'Књига' : 'Нова књига'}</h1>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </header>

  <aside class="side">
    <section class="card cover">
      <h2>Корице</h2>
      <div class="art">
        {#if cover}<img src={cover} alt="Корице" />{:else}<span class="muted">Нема корица</span>{/if}
      </div>
      <label class="pick">
        {v.image || preview ? 'Замени корице' : 'Одабери корице'}
        <input type="file" name="image" accept="image/webp,image/png,image/jpeg,image/gif,image/avif" onchange={pick} />
        {#if errors.image}<span class="msg err">{errors.image}</span>{/if}
        <span class="hint">WebP, PNG, JPEG, GIF или AVIF, највише 20 MB.</span>
      </label>
    </section>

    <section class="card">
      <h2>Продаја</h2>
      <div class="stack">
        <label>
          Цена (РСД)
          <input name="price" inputmode="numeric" value={v.price ?? ''} required pattern="[0-9]+" />
          {#if errors.price}<span class="msg err">{errors.price}</span>{/if}
        </label>
        <label>
          Приказ на сајту
          <select name="active">
            <option value="1" selected={book ? !!v.active : true}>Да</option>
            <option value="0" selected={book ? !v.active : false}>Не</option>
          </select>
        </label>
      </div>
    </section>
  </aside>

  <div class="main">
    <section class="card">
      <h2>Основни подаци</h2>
      <div class="stack">
        <label>
          Наслов
          <input name="title" value={v.title ?? ''} required maxlength="300" />
          {#if errors.title}<span class="msg err">{errors.title}</span>{/if}
        </label>
        <div class="fgrid" style="--n: 3">
          {@render field('author', 'Аутор')}
          <label>
            Адреса на сајту
            <input name="slug" bind:value={slug} placeholder="празно = од наслова" maxlength="100" />
            {#if errors.slug}<span class="msg err">{errors.slug}</span>{/if}
          </label>
          {@render field('isbn', 'ISBN')}
        </div>
      </div>
    </section>

    <section class="card">
      <h2>Издање</h2>
      <div class="fgrid" style="--n: 4">
        {@render field('year', 'Година издавања')}
        {@render field('binding', 'Повез', BINDINGS)}
        {@render field('script', 'Писмо', SCRIPTS)}
        {@render field('pages', 'Број страна')}
      </div>
    </section>

    <section class="card">
      <h2>Тежина и димензије</h2>
      <div class="fgrid" style="--n: 4">
        {@render field('weight', 'Тежина (g)')}
        {@render field('length', 'Дужина (cm)')}
        {@render field('width', 'Ширина (cm)')}
        {@render field('height', 'Висина (cm)')}
      </div>
    </section>

    <section class="card">
      <h2>Опис</h2>
      <label>
        <span class="visually-hidden">Опис (HTML)</span>
        <textarea name="description" rows="14">{v.description ?? ''}</textarea>
        {#if errors.description}<span class="msg err">{errors.description}</span>{/if}
      </label>
      <details class="help">
        <summary>Како се пише опис (HTML ознаке)</summary>
        <p class="hint">Текст се пише у HTML-у. Свака ознака се отвара и затвара, нпр. {'<p>текст</p>'}.</p>
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
      </details>
    </section>
  </div>
</form>
