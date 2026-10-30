<script lang="ts">
  import SlideForm from '#lib/backoffice/SlideForm.svelte'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<p class="back"><a href="{data.base}/slajder/">← Сви слајдови</a></p>

<SlideForm id="slide-form" slide={form?.values ?? null} books={data.books} errors={form?.errors ?? {}}>
  {#snippet actions()}
    <button class="btn" type="submit">Сачувај</button>
  {/snippet}
</SlideForm>
