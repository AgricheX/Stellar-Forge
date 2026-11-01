<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { placement } from '$lib/placement.svelte';
	import { commit_placement } from '$lib/commit';
	import { CANVAS_HEIGHT, CANVAS_WIDTH } from '$lib/constants';
	import { fly } from 'svelte/transition';

	const editor = get_editor();
	const tr = $derived(placement.transform);

	function number_field(
		value: number,
		on_change: (value: number) => void,
		label: string,
		suffix = '',
	) {
		return { value, on_change, label, suffix };
	}

	const fields = $derived([
		number_field(
			Math.round(tr.cx - CANVAS_WIDTH / 2),
			(v) => placement.set_transform({ cx: v + CANVAS_WIDTH / 2 }),
			'X',
		),
		number_field(
			Math.round(tr.cy - CANVAS_HEIGHT / 2),
			(v) => placement.set_transform({ cy: v + CANVAS_HEIGHT / 2 }),
			'Y',
		),
		number_field(
			Math.round(tr.width),
			(v) => placement.set_transform({ width: Math.max(v, 4) }),
			'W',
		),
		number_field(
			Math.round(tr.height),
			(v) => placement.set_transform({ height: Math.max(v, 4) }),
			'H',
		),
		number_field(
			Math.round(tr.rotation),
			(v) => placement.set_transform({ rotation: v }),
			'↻',
			'°',
		),
	]);
</script>

{#if placement.active}
	<div
		class="sf-glass absolute bottom-3 left-1/2 -translate-x-1/2 z-20 flex flex-wrap justify-center items-center gap-x-2 gap-y-1.5 px-3 py-2 w-max max-w-[calc(100%-1.5rem)]"
		transition:fly={{ y: 12, duration: 200 }}
	>
		<span
			class="flex items-center gap-2 pe-2 me-1 border-e border-surface-200-800"
		>
			{#if placement.source?.kind === 'text'}
				<Icons.Type class="size-4 text-primary-500" />
				<span class="text-sm font-semibold max-w-32 truncate">
					{placement.source.style.text.replace(/\n/g, ' ')}
				</span>
			{:else if placement.source?.kind === 'galaxy'}
				<Icons.Galaxy class="size-4 text-primary-500" />
				<span class="text-sm font-semibold max-w-40 truncate">
					{t(placement.source.label)}
				</span>
			{/if}
			{#if placement.busy}
				<Icons.RotateCcw class="size-3.5 sf-spin text-surface-500" />
			{/if}
		</span>
		{#each fields as field (field.label)}
			<label class="flex items-center gap-1 text-xs font-mono">
				<span class="text-surface-500">{field.label}</span>
				<input
					type="number"
					class="input h-7 w-16 px-1.5 py-0 text-xs font-mono bg-surface-100-900 ring-surface-200-800"
					value={field.value}
					onchange={(e) => {
						const value = e.currentTarget.valueAsNumber;
						if (!Number.isNaN(value)) field.on_change(value);
					}}
				/>
			</label>
		{/each}
		<button
			class="sf-icon-btn size-7!"
			aria-pressed={tr.flip_x}
			title={t('Flip Horizontal')}
			onclick={() => placement.set_transform({ flip_x: !tr.flip_x })}
		>
			<Icons.FlipHorizontal class="size-4" />
		</button>
		<button
			class="sf-icon-btn size-7!"
			aria-pressed={tr.flip_y}
			title={t('Flip Vertical')}
			onclick={() => placement.set_transform({ flip_y: !tr.flip_y })}
		>
			<Icons.FlipVertical class="size-4" />
		</button>
		<span class="h-6 w-px bg-surface-200-800"></span>
		<label class="flex items-center gap-1.5 text-xs">
			<span class="text-surface-500">{t('Strength')}</span>
			<input
				type="range"
				min="0.05"
				max="1"
				step="0.05"
				class="w-20 accent-primary-500"
				bind:value={placement.strength}
			/>
			<span class="font-mono w-8">{Math.round(placement.strength * 100)}%</span>
		</label>
		<label class="flex items-center gap-1.5 text-xs">
			<span class="text-surface-500">{t('Blur')}</span>
			<input
				type="range"
				min="0"
				max="30"
				step="1"
				class="w-16 accent-primary-500"
				bind:value={placement.blur}
			/>
		</label>
		<button
			class={[
				'btn btn-sm h-7 text-xs',
				placement.erase ? 'preset-filled-warning-500' : 'preset-tonal',
			]}
			onclick={() => (placement.erase = !placement.erase)}
			title={t('Erase instead of paint')}
		>
			{placement.erase ? t('Erase') : t('Paint')}
		</button>
		<label class="flex items-center gap-1.5 text-xs cursor-pointer">
			<input
				type="checkbox"
				class="checkbox size-3.5"
				bind:checked={placement.replace}
			/>
			{t('Replace painting')}
		</label>
		<span class="h-6 w-px bg-surface-200-800"></span>
		<button
			class="btn btn-sm h-7 preset-tonal text-xs"
			onclick={() => placement.cancel()}
		>
			{t('Cancel')}
			<span class="sf-kbd">Esc</span>
		</button>
		<button
			class="btn btn-sm h-7 preset-filled-primary-500 sf-btn-glow text-xs"
			onclick={() => commit_placement(editor())}
		>
			<Icons.Check class="size-3.5" />
			{t('Apply')}
			<span class="sf-kbd border-white/30! bg-white/10! text-white!">
				Enter
			</span>
		</button>
		{#if placement.source?.kind === 'galaxy'}
			<button
				class="btn btn-sm h-7 preset-outlined-primary-500 text-xs"
				onclick={() => commit_placement(editor(), { generate: true })}
			>
				<Icons.Sparkles class="size-3.5" />
				{t('Apply & Generate')}
			</button>
		{/if}
	</div>
{/if}
