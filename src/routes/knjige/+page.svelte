<script lang="ts">
  import { money } from '#lib/api.js'
  import { add, showNotice } from '#lib/cart.svelte.js'
  import Seo from '#lib/Seo.svelte'
  import { bookImage } from '#lib/media'

  import type { PageData } from './$types'
  import type { Book } from '#lib/types'

  let { data }: { data: PageData } = $props()
  let books = $derived(data.books)
  let added = $state<string | null>(null)

  function addToCart(b: Book) {
    add(b)
    showNotice(b, 1)
    scrollTo({ top: 0, behavior: 'smooth' })
    added = b.slug
    setTimeout(() => added === b.slug && (added = null), 1500)
  }
</script>

<Seo
  title="КЊИГЕ | Књига Крајина"
  description="Књиге у издању Књиге Крајине: бећарац Срба у западној Славонији, баштина крајишких Срба, антологије – Knjige: Bećarac Srba u zapadnoj Slavoniji, Baština krajiških Srba, antologije."
  path="/knjige/"
  image={books[0] && bookImage(books[0].image)}
/>

<h1 class="page-title">КЊИГЕ</h1>

<div class="book-grid">
  {#each books as b (b.slug)}
    <article class="book-card">
      <a href="/knjige/{b.slug}/" class="book-card-img">
        <img src={bookImage(b.image)} alt={b.title} loading="lazy" />
      </a>
      <h2><a href="/knjige/{b.slug}/">{b.title}</a></h2>
      <p class="author">{b.author}</p>
      <p class="price">{money(b.price)}</p>
      <button class="btn-light" onclick={() => addToCart(b)}>{added === b.slug ? 'Додато ✓' : 'Додај у корпу'}</button>
    </article>
  {/each}
</div>
