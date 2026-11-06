<script lang="ts">
  import { money } from '#lib/api.js'
  import { add, showNotice } from '#lib/cart.svelte.js'
  import Seo from '#lib/Seo.svelte'
  import { bookImage } from '#lib/media'
  import { plainText } from '#lib/seo.js'
  import { latinTitle, toLatin } from '#lib/translit'
  import searchIcon from '../../../images/emoji-search.svg'

  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
  let book = $derived(data.book)
  let qty = $state(1)
  let zoom = $state(false)

  // schema.org wants its own values for the binding
  const BOOK_FORMATS: Record<string, string> = { тврд: 'https://schema.org/Hardcover', тврди: 'https://schema.org/Hardcover', мек: 'https://schema.org/Paperback', меки: 'https://schema.org/Paperback' }
  const num = (v: string) => String(v).replace('.', ',')
  const rows = $derived(
    book
      ? [
          ['Тежина', book.weight && `${book.weight} g`],
          ['Димензије', book.length && `${num(book.length)} × ${num(book.width)} × ${num(book.height)} cm`],
          ['Аутор', book.author],
          ['Број страна', book.pages],
          ['Повез', book.binding],
          ['Писмо', book.script],
          ['Година издавања', book.year],
          ['ISBN', book.isbn],
        ].filter(([, v]) => v)
      : [],
  )

  function addToCart() {
    add(book, qty)
    showNotice(book, qty)
    scrollTo({ top: 0, behavior: 'smooth' })
  }
</script>

<Seo
  title="{book.title} | Књига Крајина"
  description={plainText(book.description, 95)}
  latin="{latinTitle(book.title)}, {toLatin(book.author)}"
  path="/knjige/{book.slug}/"
  image={bookImage(book.image)}
  type="book"
  jsonLd={[{
    '@context': 'https://schema.org',
    '@type': ['Product', 'Book'],
    '@id': '/knjige/' + book.slug + '/#product',
    name: book.title,
    alternateName: latinTitle(book.title),
    sku: book.slug,
    brand: { '@type': 'Brand', name: 'Књига Крајина' },
    publisher: { '@id': '/#org' },
    author: { '@type': 'Person', name: book.author, alternateName: toLatin(book.author) },
    description: plainText(book.description, 500),
    image: bookImage(book.image),
    url: '/knjige/' + book.slug + '/',
    inLanguage: 'sr',
    numberOfPages: book.pages || undefined,
    bookFormat: BOOK_FORMATS[book.binding.toLowerCase()],
    datePublished: book.year ? String(book.year) : undefined,
    isbn: book.isbn || undefined,
    offers: {
      '@type': 'Offer',
      priceCurrency: 'RSD',
      price: book.price,
      priceValidUntil: new Date(Date.now() + 365 * 864e5).toISOString().slice(0, 10),
      itemCondition: 'https://schema.org/NewCondition',
      availability: 'https://schema.org/InStock',
      url: '/knjige/' + book.slug + '/',
      seller: { '@id': '/#org' },
    },
  }, {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: [
      { '@type': 'ListItem', position: 1, name: 'Књига Крајина', item: '/' },
      { '@type': 'ListItem', position: 2, name: 'Књиге', item: '/knjige/' },
      { '@type': 'ListItem', position: 3, name: book.title, item: '/knjige/' + book.slug + '/' },
    ],
  }]}
/>

{#if book}
  <section class="product">
   <div class="product-top">
    <div class="product-gallery">
      <button class="zoom" aria-label="Увећај" onclick={() => (zoom = true)}>
        <img src={searchIcon} alt="" draggable="false" />
      </button>
      <img src={bookImage(book.image)} alt={book.title} />
    </div>

    <div class="product-summary">
      <h1>{book.title}</h1>
      <h2 class="product-author">{book.author}</h2>
      <p class="product-price">{money(book.price)}</p>
      <form class="add-form" onsubmit={(e) => {
        e.preventDefault()
        addToCart()
      }}>
        <div class="qty wl">
          <button type="button" class="step" aria-label="Мање" onclick={() => (qty = Math.max(1, qty - 1))}><svg viewBox="0 0 448 512" width="14" height="16" fill="currentColor" aria-hidden="true"><path d="M416 208H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h384c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" /></svg></button>
          <input type="number" min="1" max="99" bind:value={qty} aria-label="Количина производа" />
          <button type="button" class="step" aria-label="Више" onclick={() => (qty = Math.min(99, qty + 1))}><svg viewBox="0 0 448 512" width="14" height="16" fill="currentColor" aria-hidden="true"><path d="M416 208H272V64c0-17.67-14.33-32-32-32h-32c-17.67 0-32 14.33-32 32v144H32c-17.67 0-32 14.33-32 32v32c0 17.67 14.33 32 32 32h144v144c0 17.67 14.33 32 32 32h32c17.67 0 32-14.33 32-32V304h144c17.67 0 32-14.33 32-32v-32c0-17.67-14.33-32-32-32z" /></svg></button>
        </div>
        <button class="btn-main" type="submit">Додај у корпу</button>
      </form>
    </div>
   </div>

   <div class="product-bottom">
    <div class="product-desc">{@html book.description}</div>

    <table class="product-attrs">
      <tbody>
        {#each rows as [k, v]}
          <tr><th>{k}</th><td>{v}</td></tr>
        {/each}
      </tbody>
    </table>
   </div>
  </section>

  {#if zoom}
    <button class="lightbox" aria-label="Затвори" onclick={() => (zoom = false)}>
      <img src={bookImage(book.image)} alt={book.title} />
    </button>
  {/if}
{/if}
