<script lang="ts">
  import ConfirmDialog from '#lib/backoffice/ConfirmDialog.svelte'
  import SlideForm from '#lib/backoffice/SlideForm.svelte'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  let formEl = $state<HTMLFormElement>()
  let deleteForm = $state<HTMLFormElement>()
  let saveOpen = $state(false)
  let deleteOpen = $state(false)

  // native validation messages first, the confirmation only for a form that can be sent
  const askSave = () => formEl?.reportValidity() && (saveOpen = true)
</script>

<p class="back"><a href="{data.base}/slajder/">← Сви слајдови</a></p>

{#if data.created && !form}<p class="msg ok">Слајд је додат.</p>{/if}
{#if form?.saved}<p class="msg ok">Сачувано.</p>{/if}

<SlideForm id="slide-form" bind:formEl slide={form?.values ? { ...data.slide, ...form.values } : data.slide} books={data.books} errors={form?.errors ?? {}} action="?/save">
  {#snippet actions()}
    <button class="btn" type="button" onclick={askSave}>Сачувај</button>
    <a class="btn-outline" href="/" target="_blank" rel="noopener">Преглед</a>
    <button class="btn-outline danger" type="button" onclick={() => (deleteOpen = true)}>Обриши</button>
  {/snippet}
</SlideForm>

<form bind:this={deleteForm} method="post" action="?/delete" hidden></form>

<ConfirmDialog bind:open={saveOpen} title="Сачувати измене?" text="Измене ће бити видљиве након поништавања кеша." confirm="Сачувај" onconfirm={() => formEl?.requestSubmit()} />
<ConfirmDialog
  bind:open={deleteOpen}
  danger
  title="Обрисати слајд?"
  text="Слајд и његова слика биће трајно обрисани. Књига остаје на сајту."
  confirm="Обриши"
  onconfirm={() => deleteForm?.requestSubmit()}
/>
