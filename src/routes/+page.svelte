<script lang="ts">
  import Slider from '#lib/Slider.svelte'
  import Seo from '#lib/Seo.svelte'

  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<Seo
  title="Књига Крајина | Припрема за штампу, лектура и коректурa"
  description="Књиге о Крајишким Србима и услуге припреме за штампу, лектуре и коректуре Сњежане Станишић из Новог Сада."
  path="/"
  image={data.slides[0]?.image}
/>

<div class="home-slider-wrap">
  <Slider slides={data.slides} />
</div>
<section class="home-services">
  <h2 class="page-title">УСЛУГЕ</h2>
  <div class="services-grid">
    <a href="/usluge/" class="service">
      <img src="/images/lektura-korektura.webp" alt="Илустрација лектуре и коректуре" />
      <h3>Лектура и коректура</h3>
    </a>
    <a href="/usluge/#tehnicka_obrada_teksta" class="service">
      <img src="/images/priprema.webp" alt="Илустрација припреме за штампу" />
      <h3>Припрема за штампу</h3>
    </a>
  </div>
</section>
