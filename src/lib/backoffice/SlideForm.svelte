<script lang="ts">
  import type { Snippet } from 'svelte'
  import { sliderImage } from '#lib/media'
  import type { SlideConfig } from '#lib/slider'

  type Values = Partial<Omit<SlideConfig, 'id'>>

  let {
    slide,
    books,
    errors = {},
    action = '',
    id,
    actions,
    formEl = $bindable(),
  }: {
    slide: Values | null
    books: { slug: string; title: string; active: number }[]
    errors?: Record<string, string>
    action?: string
    id?: string
    /** buttons shown in the artwork row, top right */
    actions?: Snippet
    formEl?: HTMLFormElement
  } = $props()
  const v = $derived(slide ?? {})

  // artwork: the stored one, replaced by a preview of the newly chosen file
  let preview = $state<string | null>(null)
  const art = $derived(preview ?? (v.image ? sliderImage(v.image) : null))
  function pick(e: Event) {
    const file = (e.currentTarget as HTMLInputElement).files?.[0]
    if (preview) URL.revokeObjectURL(preview)
    preview = file ? URL.createObjectURL(file) : null
  }
</script>

<form bind:this={formEl} method="post" {id} {action} enctype="multipart/form-data" class="book-form slide-form">
  <header class="editor-head">
    <h1>{slide ? 'Измена слајда' : 'Нови слајд'}</h1>
    {#if actions}<div class="actions">{@render actions()}</div>{/if}
  </header>

  <aside class="side">
    <section class="card cover">
      <h2>Слика</h2>
      <div class="art">
        {#if art}<img src={art} alt="Слика слајда" />{:else}<span class="muted">Нема слике</span>{/if}
      </div>
      <label class="pick">
        {v.image || preview ? 'Замени слику' : 'Одабери слику'}
        <input type="file" name="image" accept="image/webp,image/png,image/jpeg,image/gif,image/avif" onchange={pick} />
        {#if errors.image}<span class="msg err">{errors.image}</span>{/if}
        <span class="hint">WebP, PNG, JPEG, GIF или AVIF, највише 20 MB. Најбоље изгледа слика књиге на провидној или светлој позадини.</span>
      </label>
    </section>
  </aside>

  <div class="main">
    <section class="card">
      <h2>Подешавања</h2>
      <div class="fgrid" style="--n: 3">
        <label>
          Књига
          <select name="slug" required>
            <option value="" selected={!v.slug}>— одаберите —</option>
            {#each books as b}
              <option value={b.slug} selected={v.slug === b.slug}>{b.title}{b.active ? '' : ' (сакривена)'}</option>
            {/each}
          </select>
          {#if errors.slug}<span class="msg err">{errors.slug}</span>{/if}
        </label>
        <label>
          Величина слике (%)
          <input name="size" inputmode="numeric" value={v.k ? Math.round(v.k * 100) : 100} required pattern="[0-9]+" />
          {#if errors.size}<span class="msg err">{errors.size}</span>{/if}
        </label>
        <label>
          Приказ на сајту
          <select name="active">
            <option value="1" selected={slide ? !!v.active : true}>Да</option>
            <option value="0" selected={slide ? !v.active : false}>Не</option>
          </select>
        </label>
      </div>
    </section>

    <section class="card">
      <h2>Опис на слајду</h2>
      <label>
        <span class="visually-hidden">Опис на слајду</span>
        <textarea name="html" rows="9" required>{v.html ?? ''}</textarea>
        {#if errors.html}<span class="msg err">{errors.html}</span>{/if}
      </label>
      <ul class="hint tags">
        <li>Кратак текст од неколико реченица; дужи опис књиге се уређује на страници књиге.</li>
        <li><code>{'<br>'}</code> – нови ред, <code>{'<em>…</em>'}</code> – курзив, <code>{'<strong>…</strong>'}</code> – подебљано.</li>
        <li>Остале ознаке се уклањају, а текст остаје.</li>
      </ul>
    </section>
  </div>
</form>
