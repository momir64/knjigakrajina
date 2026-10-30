<script lang="ts">
  interface Props {
    open?: boolean
    title: string
    text?: string
    confirm?: string
    cancel?: string
    danger?: boolean
    onconfirm: () => void
  }
  let { open = $bindable(false), title, text = '', confirm = 'У реду', cancel = 'Откажи', danger = false, onconfirm }: Props = $props()

  let dialog: HTMLDialogElement

  $effect(() => {
    if (open && !dialog.open) dialog.showModal()
    else if (!open && dialog.open) dialog.close()
  })
</script>

<!-- a click on the dialog itself (not its content box) is a click on the backdrop; Esc closes natively -->
<!-- svelte-ignore a11y_click_events_have_key_events, a11y_no_noninteractive_element_interactions -->
<dialog bind:this={dialog} class="confirm" onclose={() => (open = false)} onclick={(e) => e.target === dialog && (open = false)}>
  <div class="box">
    <h2>{title}</h2>
    {#if text}<p>{text}</p>{/if}
    <div class="buttons">
      <button type="button" class="btn-outline" onclick={() => (open = false)}>{cancel}</button>
      <button
        type="button"
        class="btn"
        class:danger
        onclick={() => {
          open = false
          onconfirm()
        }}>{confirm}</button
      >
    </div>
  </div>
</dialog>
