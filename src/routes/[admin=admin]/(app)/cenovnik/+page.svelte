<script lang="ts">
  import ConfirmDialog from '#lib/backoffice/ConfirmDialog.svelte'
  import { MAX_COLUMNS, MAX_ROWS, type PriceList } from '#lib/pricelist'
  import type { ActionData, PageData } from './$types'

  let { data, form }: { data: PageData; form: ActionData } = $props()

  // the table is edited as local state (add / remove columns and rows), the form sends the result
  // svelte-ignore state_referenced_locally
  let sections = $state<PriceList>(structuredClone($state.snapshot(form?.sections ?? data.sections)))

  let formEl = $state<HTMLFormElement>()
  let confirmOpen = $state(false)
  const askSave = () => formEl?.reportValidity() && (confirmOpen = true)

  const addColumn = (s: PriceList[number]) => {
    s.head.push('')
    for (const r of s.rows) r.values.push('')
  }
  const removeColumn = (s: PriceList[number], j: number) => {
    s.head.splice(j, 1)
    for (const r of s.rows) r.values.splice(j, 1)
  }
  const addRow = (s: PriceList[number]) => s.rows.push({ label: '', values: s.head.map(() => '') })
  const removeRow = (s: PriceList[number], k: number) => s.rows.splice(k, 1)
</script>

<div class="page-head">
  <h1>Ценовник</h1>
  <button class="btn nudge-down" type="button" onclick={askSave}>Сачувај</button>
</div>

<p class="lead">
  Табела са странице <a href="/usluge/" target="_blank" rel="noopener">Услуге ↗</a>. Колоне и редови се додају и уклањају испод и поред табеле.
</p>

{#if form?.saved}<p class="msg ok">Сачувано.</p>{/if}
{#if form?.error}<p class="msg err">{form.error}</p>{/if}

<form bind:this={formEl} method="post" class="price-form">
  {#each sections as s, i}
    <section class="card price-card">
      <label class="price-title">
        Наслов одељка
        <input name="s{i}_title" bind:value={s.title} maxlength="120" required />
      </label>
      <input type="hidden" name="s{i}_cols" value={s.head.length} />
      <input type="hidden" name="s{i}_rows" value={s.rows.length} />

      <div class="grid-scroll">
        <table class="price">
          <thead>
            <tr class="col-tools">
              <td></td>
              {#each s.head as _, j}
                <td>
                  <button type="button" class="x" title="Уклони колону" aria-label="Уклони колону {j + 1}" disabled={s.head.length <= 1} onclick={() => removeColumn(s, j)}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                </td>
              {/each}
              <td></td>
            </tr>
            <tr class="head">
              <th><input name="s{i}_headLabel" bind:value={s.headLabel} maxlength="120" required aria-label="Наслов првог реда" /></th>
              {#each s.head as _, j}
                <th><input name="s{i}_head{j}" bind:value={s.head[j]} maxlength="120" required aria-label="Колона {j + 1}" /></th>
              {/each}
              <th></th>
            </tr>
          </thead>
          <tbody>
            {#each s.rows as r, k}
              <tr>
                <td class="label"><input name="s{i}_r{k}_label" bind:value={r.label} maxlength="120" required aria-label="Назив реда {k + 1}" /></td>
                {#each r.values as _, j}
                  <td><input name="s{i}_r{k}_v{j}" bind:value={r.values[j]} maxlength="120" required aria-label="Ред {k + 1}, колона {j + 1}" /></td>
                {/each}
                <td class="row-tools">
                  <button type="button" class="x" title="Уклони ред" aria-label="Уклони ред {k + 1}" disabled={s.rows.length <= 1} onclick={() => removeRow(s, k)}><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" aria-hidden="true"><path d="M6 6l12 12M18 6L6 18" /></svg></button>
                </td>
              </tr>
            {/each}
          </tbody>
        </table>
      </div>

      <div class="grid-actions">
        <button type="button" class="btn-outline" disabled={s.rows.length >= MAX_ROWS} onclick={() => addRow(s)}>+ Ред</button>
        <button type="button" class="btn-outline" disabled={s.head.length >= MAX_COLUMNS} onclick={() => addColumn(s)}>+ Колона</button>
      </div>

      <label class="notes-field">
        Напомене испод табеле <span class="hint-inline">(свака у свом реду)</span>
        <textarea name="s{i}_notes" rows="4">{s.notes.join('\n')}</textarea>
      </label>
    </section>
  {/each}
</form>

<ConfirmDialog
  bind:open={confirmOpen}
  title="Сачувати ценовник?"
  text="Измене ће бити видљиве након поништавања кеша."
  confirm="Сачувај"
  onconfirm={() => formEl?.requestSubmit()}
/>
