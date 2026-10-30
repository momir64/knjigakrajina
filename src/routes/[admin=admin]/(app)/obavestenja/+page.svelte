<script lang="ts">
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  // svelte-ignore state_referenced_locally
  let emails = $state<string[]>(form?.emails ?? [...data.emails])
  const MAX_ADDRESSES = 20

  const testResult = {
    sent: ['ok', 'Пробна порука је послата.'],
    'no-key': ['err', 'Слање није подешено (недостаје RESEND_API_KEY на серверу).'],
    failed: ['err', 'Слање није успело, погледајте дневник сервера.'],
    'no-recipients': ['err', 'Нема ниједне адресе на списку.'],
  } as const
</script>

<div class="narrow-page">
<h1>Обавештења о наруџбинама</h1>

<section class="card">
  <p>На ове адресе стиже порука кад неко пошаље наруџбину. Купац увек добија своју потврду на адресу коју је унео.</p>
  <form method="post" action="?/save">
    <div class="mail-list">
      {#each emails as _, i (i)}
        <div class="mail-row">
          <input type="email" name="email" bind:value={emails[i]} placeholder="adresa@primer.rs" maxlength="254" spellcheck="false" autocomplete="off" aria-label="Адреса {i + 1}" />
          <button type="button" class="x" title="Уклони адресу" aria-label="Уклони адресу {i + 1}" onclick={() => emails.splice(i, 1)}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
        </div>
      {/each}
      {#if emails.length === 0}<p class="mail-empty">Нема адреса – нико неће добијати обавештења.</p>{/if}
    </div>
    <div class="grid-actions mail-actions">
      <button type="button" class="btn-outline" disabled={emails.length >= MAX_ADDRESSES} onclick={() => emails.push('')}>Додај адресу</button>
      <button class="btn" type="submit">Сачувај</button>
    </div>
    {#if form?.error}<p class="msg err">{form.error}</p>{/if}
    {#if form?.saved}<p class="msg ok">Сачувано.</p>{/if}
  </form>
</section>

<section class="card">
  <h2>Провера слања</h2>
  <p>
    Слање порука преко Resend-а је {data.mailConfigured ? 'подешено' : 'искључено (RESEND_API_KEY није постављен, поруке се само исписују у дневник сервера)'}.
  </p>
  <form method="post" action="?/test" class="center-actions">
    <button class="btn" type="submit">Пошаљи пробну поруку на сачуване адресе</button>
  </form>
  {#if form?.test}<p class="msg {testResult[form.test][0]}">{testResult[form.test][1]}</p>{/if}
</section>
</div>
