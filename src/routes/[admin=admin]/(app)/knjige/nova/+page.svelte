<script lang="ts">
  import BookForm from '#lib/backoffice/BookForm.svelte'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()
</script>

<p class="back"><a href="{data.base}/knjige/">← Све књиге</a></p>

<BookForm id="book-form" book={form?.values ?? null} errors={form?.errors ?? {}}>
  {#snippet actions()}
    <button class="btn" type="submit">Сачувај</button>
  {/snippet}
</BookForm>
