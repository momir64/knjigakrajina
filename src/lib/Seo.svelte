<script lang="ts">
  import { page } from '$app/state'
  import { absolutize } from './seo.js'
  import { sliderImage } from './media'

  const SITE = 'Књига Крајина'
  const SITE_LATIN = 'Knjiga Krajina' // search metadata only, for people who type it in Latin letters
  const DEFAULT_IMAGE = sliderImage('slide-becarac.webp')

  // Rendered by the root layout without props (site-wide data) and by every page with its own.
  interface Props {
    title?: string
    description?: string
    path?: string
    image?: string
    type?: string
    noindex?: boolean
    jsonLd?: Record<string, unknown> | Record<string, unknown>[]
  }
  let { title, description, path, image, type = 'website', noindex = false, jsonLd }: Props = $props()

  const origin = $derived(page.data.origin ?? '')
  const url = $derived(origin + (path ?? page.url.pathname))
  const img = $derived(origin + (image ?? DEFAULT_IMAGE))
  const script = (data: unknown) => `<script type="application/ld+json">${JSON.stringify(data).replace(/</g, '\\u003c')}<\/script>`
  const ld = $derived(jsonLd && script(absolutize(jsonLd, origin)))
  const site = $derived(
    script({
      '@context': 'https://schema.org',
      '@graph': [
        { '@type': 'WebSite', '@id': origin + '/#website', url: origin + '/', name: SITE, alternateName: SITE_LATIN, inLanguage: 'sr-Cyrl-RS' },
        {
          '@type': 'Organization',
          '@id': origin + '/#org',
          name: SITE,
          alternateName: SITE_LATIN,
          url: origin + '/',
          logo: origin + '/logo.svg',
          email: 'snjezana.stanisic.ns@gmail.com',
          telephone: '+381642973929',
          address: { '@type': 'PostalAddress', addressLocality: 'Нови Сад', addressCountry: 'RS' },
        },
      ],
    }),
  )
</script>

<svelte:head>
  {#if title}
    <title>{title}</title>
    {#if description}<meta name="description" content={description} />{/if}
    {#if noindex}
      <meta name="robots" content="noindex, nofollow" />
    {:else}
      <link rel="canonical" href={url} />
      <meta property="og:site_name" content={SITE} />
      <meta property="og:locale" content="sr_RS" />
      <meta property="og:type" content={type} />
      <meta property="og:title" content={title} />
      {#if description}<meta property="og:description" content={description} />{/if}
      <meta property="og:url" content={url} />
      <meta property="og:image" content={img} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:title" content={title} />
      {#if description}<meta name="twitter:description" content={description} />{/if}
      <meta name="twitter:image" content={img} />
    {/if}
    {#if ld}{@html ld}{/if}
  {:else if origin}
    {@html site}
  {/if}
</svelte:head>
