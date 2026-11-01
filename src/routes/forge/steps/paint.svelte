<script lang="ts">
	import Tools from './tools.svelte';
	import PresetsPanel from './presets_panel.svelte';
	import TextPanel from './text_panel.svelte';
	import SectionHeader from '$lib/components/section_header.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { Icons } from '$lib/components/icons';
	import { ui } from '$lib/ui.svelte';
</script>

{#if ui.advanced}
	<button
		type="button"
		class="flex items-center gap-2 w-full rounded-md border border-dashed border-surface-300-700 px-3 py-2 text-sm text-surface-600-400 hover:border-primary-500/70 hover:text-surface-950-50 transition-colors"
		onclick={() => ui.open('command')}
	>
		<Icons.Terminal class="size-4 text-primary-500" />
		<span class="grow text-left font-mono text-xs truncate">
			spiral arms=4 stars=900
		</span>
		<span class="sf-kbd">Ctrl K</span>
	</button>
{/if}

<Tools step="paint" />

<SectionHeader>{t('Templates')}</SectionHeader>
<PresetsPanel />

<SectionHeader>{t('Text & Emoji')}</SectionHeader>
<TextPanel />
