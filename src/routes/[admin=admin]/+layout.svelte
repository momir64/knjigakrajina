<script lang="ts">
  import '../../styles/admin.scss'

  let { children } = $props()
</script>

<svelte:head>
  <title>Администрација</title>
  <meta name="robots" content="noindex, nofollow, noarchive" />
</svelte:head>

<div class="adm">
  {@render children()}
</div>
