<script lang="ts">
  import Seo from '#lib/Seo.svelte'

  const head = ['1', '1-10', '10-50', '50-100', 'преко 100']
</script>

<Seo
  title="ЦЕНОВНИК | Припрема за штампу, лектура и коректура"
  description="Ценовник услуга лектуре, коректуре и техничке обраде текста (прелом) – цене по лекторској страни и по броју страна."
  path="/usluge/"
/>

<div class="services">
  <h1 class="services-title">ЦЕНОВНИК УСЛУГА</h1>

  <h2 class="section-title">Лектура и коректура</h2>
  <table class="rounded-corners">
    <tbody>
      <tr>
        <td colspan="2">Број лекторских страна</td>
        {#each head as h}<td>{h}</td>{/each}
      </tr>
      <tr>
        <td colspan="2">Лектура и коректура</td>
        {#each ['5', '3', '2,5', '2', '1,5'] as v}<td>{v}</td>{/each}
      </tr>
    </tbody>
  </table>
  <ul class="notes">
    <li>Једну лекторску страну чини 1800 карактера са проредом.</li>
    <li>Цена услуге смањује са са повећањем броја лекторских страна за обраду.</li>
    <li>Цене су изражене у еврима, исплата је у динарској противвредности.</li>
  </ul>

    <h2 class="section-title" id="tehnicka_obrada_teksta">Техничка обрада текста</h2>
  <table class="rounded-corners">
    <tbody>
      <tr>
        <td colspan="2">Број страна</td>
        {#each head as h}<td>{h}</td>{/each}
      </tr>
      <tr>
        <td colspan="2">Прелом текста</td>
        {#each ['2,5', '2,2', '2', '1,5', '1'] as v}<td>{v}</td>{/each}
      </tr>
      <tr>
        <td colspan="2">Прелом текста са сликама</td>
        {#each ['5', '4', '2,5', '2', '1,8'] as v}<td>{v}</td>{/each}
      </tr>
    </tbody>
  </table>
  <ul class="notes">
    <li>Цене се могу кориговати након увида у достављени материјал.</li>
    <li>Цене су изражене у еврима, исплата је у динарској противвредности.</li>
  </ul>
</div>
