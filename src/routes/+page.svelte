<script lang="ts">
  import Slider from '#lib/Slider.svelte'
  import Seo from '#lib/Seo.svelte'
  import lektura from '../images/lektura-korektura.webp'
  import priprema from '../images/priprema.webp'

  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<Seo
  title="Књига Крајина | Припрема за штампу, лектура и коректурa"
  description="Књиге о Крајишким Србима и услуге припреме за штампу, лектуре и коректуре – Knjige o Krajišnicima, priprema za štampu, lektura i korektura. Snježana Stanišić, Novi Sad."
  path="/"
  image={data.slides[0]?.image}
/>

<h1 class="visually-hidden">Књига Крајина – књиге о Крајишким Србима, лектура и припрема за штампу</h1>

{#if data.slides.length > 0}
  <div class="home-slider-wrap">
    <Slider slides={data.slides} />
  </div>
{/if}
<section class="home-services">
  <h2 class="page-title">УСЛУГЕ</h2>
  <div class="services-grid">
    <a href="/usluge/" class="service">
      <img src={lektura} width="1012" height="768" alt="Илустрација лектуре и коректуре" />
      <h3>Лектура и коректура</h3>
    </a>
    <a href="/usluge/#tehnicka_obrada_teksta" class="service">
      <img src={priprema} width="1182" height="768" alt="Илустрација припреме за штампу" />
      <h3>Припрема за штампу</h3>
    </a>
  </div>
</section>
