<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
</script>

<button
	type="button"
	class="flex items-center justify-center gap-2 w-full rounded-md border border-dashed border-surface-300-700 px-3 py-2 text-xs text-surface-600-400 hover:border-primary-500/70 hover:text-surface-950-50 transition-colors"
	onclick={() => ui.toggle_advanced()}
>
	<Icons.SlidersHorizontal class="size-3.5 text-primary-500" />
	{ui.advanced ? t('Hide advanced settings') : t('Show advanced settings')}
</button>
