<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { LAYERS, ui, get_tool_layer, type LayerId } from '$lib/ui.svelte';
	import { slide } from 'svelte/transition';
	import { placement } from '$lib/placement.svelte';

	const editor = get_editor();
	const active_layer = $derived(get_tool_layer(editor().primary_tool_id));

	function count(layer: LayerId): number | null {
		const project = editor().project;
		if (layer === 'systems') return project.solar_systems.length;
		if (layer === 'spawns')
			return project.solar_systems.filter((system) => system.is_spawn).length;
		if (layer === 'hyperlanes') return project.hyperlanes.length;
		if (layer === 'wormholes') return project.wormholes.length;
		if (layer === 'nebulas') return project.nebulas.length;
		if (layer === 'fe_zones') return project.fallen_empire_zones.length;
		return null;
	}
</script>

{#if ui.layers_open && !placement.active}
	<section
		class="sf-glass absolute left-3 bottom-10 z-10 w-64 overflow-hidden"
		transition:slide={{ duration: 180 }}
		aria-label={t('Layers')}
	>
		<header
			class="flex items-center justify-between px-3 py-2 border-b border-surface-200-800"
		>
			<span class="flex items-center gap-2 text-sm font-semibold">
				<Icons.Layers class="size-4 text-primary-500" />
				{t('Layers')}
			</span>
			<span class="flex items-center gap-1">
				{#if ui.solo}
					<button
						class="sf-tag text-primary-500! hover:underline"
						onclick={() => (ui.solo = null)}
					>
						{t('Solo')} ✕
					</button>
				{/if}
				<button
					class="sf-icon-btn size-7!"
					title={t('Reset Layers')}
					onclick={() => ui.reset_layers()}
				>
					<Icons.RotateCcw class="size-3.5" />
				</button>
				<button
					class="sf-icon-btn size-7!"
					title={t('Close')}
					onclick={() => ui.toggle_layers_open()}
				>
					<Icons.X class="size-3.5" />
				</button>
			</span>
		</header>
		<ul class="py-1">
			{#each LAYERS as layer, i (layer.id)}
				{@const Icon = Icons[layer.icon]}
				{@const state = ui.layers[layer.id]}
				{@const visible = ui.is_visible(layer.id)}
				{@const n = count(layer.id)}
				<li
					class={[
						'group relative flex items-center gap-1.5 ps-3 pe-1.5 py-1 transition-colors',
						layer.id === active_layer && 'bg-primary-500/10',
						!visible && 'opacity-55',
					]}
				>
					{#if layer.id === active_layer}
						<span
							class="absolute left-0 top-1 bottom-1 w-0.5 rounded bg-primary-500 shadow-[0_0_8px_rgba(229,50,45,0.8)]"
						></span>
					{/if}
					<Icon class="size-3.5 shrink-0 text-surface-600-400" />
					<span class="text-xs grow truncate" title={t(layer.name)}>
						{t(layer.name)}
					</span>
					{#if n != null}
						<span class="font-mono text-[0.65rem] text-surface-500">{n}</span>
					{/if}
					<input
						type="range"
						min="0"
						max="1"
						step="0.05"
						value={state.opacity}
						class="w-12 accent-primary-500 opacity-0 group-hover:opacity-100 transition-opacity"
						title={t('Opacity')}
						oninput={(e) =>
							ui.set_opacity(layer.id, e.currentTarget.valueAsNumber)}
					/>
					<button
						class="sf-icon-btn size-6!"
						title="{t('Show/Hide')} (Shift {i + 1}) · Alt: {t('Solo')}"
						onclick={(e) => {
							if (e.altKey) ui.toggle_solo(layer.id);
							else ui.toggle_visible(layer.id);
						}}
					>
						{#if visible}
							<Icons.Eye class="size-3.5" />
						{:else}
							<Icons.EyeOff class="size-3.5" />
						{/if}
					</button>
					{#if layer.id !== 'guides'}
						<button
							class={[
								'sf-icon-btn size-6!',
								state.locked && 'text-warning-500!',
							]}
							title={state.locked ? t('Unlock') : t('Lock')}
							onclick={() => ui.toggle_locked(layer.id)}
						>
							{#if state.locked}
								<Icons.Lock class="size-3.5" />
							{:else}
								<Icons.LockOpen class="size-3.5" />
							{/if}
						</button>
					{:else}
						<span class="size-6"></span>
					{/if}
				</li>
			{/each}
		</ul>
		<p class="px-3 pb-2 text-[0.68rem] text-surface-500 leading-snug">
			{t(
				'Locked layers ignore every tool. Alt+click the eye to show only that layer.',
			)}
		</p>
	</section>
{/if}
