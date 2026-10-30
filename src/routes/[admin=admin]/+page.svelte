<script lang="ts">
  import type { ActionData } from './$types'

  let { form }: { form: ActionData } = $props()
</script>

<div class="login">
  <h1>Администрација</h1>
  <form method="post">
    <label>
      Лозинка
      <input type="password" name="password" autocomplete="current-password" required maxlength="200" />
    </label>
    {#if form?.error}<p class="msg err">{form.error}</p>{/if}
    <button class="btn" type="submit">Пријава</button>
  </form>
</div>
