<script lang="ts">
  import BookForm from '#lib/backoffice/BookForm.svelte'
  import ConfirmDialog from '#lib/backoffice/ConfirmDialog.svelte'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  let formEl = $state<HTMLFormElement>()
  let deleteForm = $state<HTMLFormElement>()
  let saveOpen = $state(false)
  let deleteOpen = $state(false)

  // native validation messages first, the confirmation only for a form that can be sent
  const askSave = () => formEl?.reportValidity() && (saveOpen = true)
</script>

<p class="back"><a href="{data.base}/knjige/">← Све књиге</a></p>

{#if data.created && !form}<p class="msg ok">Књига је додата.</p>{/if}

<BookForm id="book-form" bind:formEl book={form?.values ? { ...data.book, ...form.values } : data.book} errors={form?.errors ?? {}} action="?/save">
  {#snippet actions()}
    <button class="btn" type="button" onclick={askSave}>Сачувај</button>
    <a class="btn-outline" href="/knjige/{data.book.slug}/" target="_blank" rel="noopener">Преглед</a>
    <button class="btn-outline danger" type="button" onclick={() => (deleteOpen = true)}>Обриши</button>
  {/snippet}
</BookForm>

<form bind:this={deleteForm} method="post" action="?/delete" hidden></form>

<p class="muted">ID: {data.book.id}</p>

<ConfirmDialog bind:open={saveOpen} title="Сачувати измене?" text="Измене ће бити видљиве након поништавања кеша." confirm="Сачувај" onconfirm={() => formEl?.requestSubmit()} />
<ConfirmDialog
  bind:open={deleteOpen}
  danger
  title="Обрисати књигу?"
  text="Књига и њена корица биће трајно обрисани. Постојеће наруџбине остају сачуване."
  confirm="Обриши"
  onconfirm={() => deleteForm?.requestSubmit()}
/>
