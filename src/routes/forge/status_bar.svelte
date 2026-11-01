<script lang="ts">
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui, get_tool_layer, LAYERS } from '$lib/ui.svelte';
	import { tools } from '$lib/models/tool';

	const editor = get_editor();
	const layer = $derived(
		LAYERS.find((l) => l.id === get_tool_layer(editor().primary_tool_id)),
	);
	const project = $derived(editor().project);
	const spawns = $derived(
		project.solar_systems.filter((system) => system.is_spawn).length,
	);
</script>

<footer
	class="flex items-center gap-4 h-7 px-3 text-[0.7rem] font-mono border-t border-surface-200-800 bg-surface-50-950 text-surface-600-400 select-none overflow-hidden whitespace-nowrap"
>
	<span class="flex items-center gap-1.5">
		<span
			class="size-1.5 rounded-full bg-success-500 shadow-[0_0_6px_#3ccf7a]"
		></span>
		{t('Saved locally')}
	</span>
	{#if ui.advanced}
		<span>
			{#if ui.cursor}
				X {ui.cursor.x} · Y {ui.cursor.y}
			{:else}
				X — · Y —
			{/if}
		</span>
		<span>{Math.round(ui.zoom * 100)}%</span>
		<span class="hidden md:inline">
			{t('Tool')}:
			<span class="text-surface-950-50">
				{t(tools[editor().primary_tool_id].name)}
			</span>
			{#if layer}
				· {t('Layer')}:
				<span
					class={ui.is_locked(layer.id) ? 'text-warning-500' : (
						'text-surface-950-50'
					)}
				>
					{t(layer.name)}{#if ui.is_locked(layer.id)}
						({t('locked')}){/if}
				</span>
			{/if}
		</span>
	{/if}
	<span class="grow"></span>
	<span>{project.solar_systems.length} {t('systems')}</span>
	<span>{project.hyperlanes.length} {t('hyperlanes')}</span>
	<span>{spawns} {t('spawns')}</span>
	<button
		class="hover:text-primary-500 transition-colors"
		onclick={() => ui.open('shortcuts')}
	>
		? {t('shortcuts')}
	</button>
</footer>
