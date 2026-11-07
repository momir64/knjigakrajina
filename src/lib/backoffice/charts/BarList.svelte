<script lang="ts">
  // Ranked list with a bar behind every row (relative to the biggest value).
  let { rows }: { rows: { label: string; value: number; note?: string }[] } = $props()
  const max = $derived(Math.max(...rows.map((r) => r.value), 1))
</script>

{#if rows.length === 0}
  <p class="none">Још нема података.</p>
{:else}
  <ul>
    {#each rows as r}
      <li title="{r.label}: {r.value.toLocaleString('sr-RS')}">
        <span class="bar" style="width: {Math.max((r.value / max) * 100, 2)}%"></span>
        <span class="name">{r.label}{#if r.note}<small>{r.note}</small>{/if}</span>
        <b>{r.value.toLocaleString('sr-RS')}</b>
      </li>
    {/each}
  </ul>
{/if}

<style>
  ul {
    margin: 0;
    padding: 0;
    list-style: none;
    display: grid;
    gap: 5px;
  }
  li {
    position: relative;
    display: flex;
    justify-content: space-between;
    gap: 10px;
    padding: 5px 10px;
    border-radius: 4px;
    font-size: 14px;
    overflow: hidden;
  }
  .bar {
    position: absolute;
    inset: 0 auto 0 0;
    background: linear-gradient(90deg, #ecdfc6, #f4ecdf);
    border-radius: 4px;
  }
  .name,
  b {
    position: relative;
  }
  .name {
    min-width: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }
  small {
    margin-left: 8px;
    color: #776a59;
  }
  b {
    font-variant-numeric: tabular-nums;
    font-weight: 600;
  }
  .none {
    margin: 0;
    color: #776a59;
    font-size: 14px;
  }
</style>
