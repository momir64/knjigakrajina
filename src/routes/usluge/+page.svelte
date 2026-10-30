<script lang="ts">
  import Seo from '#lib/Seo.svelte'
  import type { PageData } from './$types'

  let { data }: { data: PageData } = $props()
</script>

<Seo
  title="ЦЕНОВНИК | Припрема за штампу, лектура и коректура"
  description="Ценовник услуга лектуре, коректуре и техничке обраде текста (прелом) – цене по лекторској страни и по броју страна."
  path="/usluge/"
/>

<div class="services">
  <h1 class="services-title">ЦЕНОВНИК УСЛУГА</h1>

  {#each data.sections as section}
    <h2 class="section-title" id={section.id || undefined}>{section.title}</h2>
    <table class="rounded-corners">
      <tbody>
        <tr>
          <td colspan="2">{section.headLabel}</td>
          {#each section.head as h}<td>{h}</td>{/each}
        </tr>
        {#each section.rows as row}
          <tr>
            <td colspan="2">{row.label}</td>
            {#each row.values as v}<td>{v}</td>{/each}
          </tr>
        {/each}
      </tbody>
    </table>
    <ul class="notes">
      {#each section.notes as note}<li>{note}</li>{/each}
    </ul>
  {/each}
</div>
