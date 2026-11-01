<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { make_seed } from '$lib/random';
	import {
		random_recipe,
		render_galaxy_mask,
		type RandomKind,
	} from '$lib/galaxy';
	import { forge_random } from '$lib/forge';
	import { toaster } from '$lib/toaster';

	const editor = get_editor();
	const HISTORY_KEY = 'stellar-forge-seeds';

	let seed = $state(make_seed());
	let kind = $state<RandomKind>('any');
	let lock_systems = $state(false);
	let systems = $state(800);
	let busy = $state(false);
	let preview = $state('');
	let history = $state<string[]>(
		JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'),
	);

	const info = $derived(random_recipe(seed.trim() || 'nova', kind));

	$effect(() => {
		if (ui.panel !== 'random') return;
		const recipe = info.recipe;
		const mask = render_galaxy_mask(recipe);
		const canvas = document.createElement('canvas');
		canvas.width = 280;
		canvas.height = 280;
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = '#0d0d0f';
		ctx.fillRect(0, 0, 280, 280);
		ctx.drawImage(mask, 0, 0, 280, 280);
		ctx.globalCompositeOperation = 'multiply';
		ctx.fillStyle = '#ffd9d6';
		ctx.fillRect(0, 0, 280, 280);
		preview = canvas.toDataURL();
	});

	async function forge() {
		busy = true;
		const value = seed.trim() || make_seed();
		try {
			if (editor().step !== 'paint') editor().set_step('paint');
			await forge_random(editor(), value, {
				kind,
				...(lock_systems ? { keep_systems: systems } : {}),
			});
			history = [value, ...history.filter((s) => s !== value)].slice(0, 8);
			localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
			toaster.success({
				title: t('Random Galaxy'),
				description: `${t('Seed')}: ${value}`,
			});
			ui.close();
		} finally {
			busy = false;
		}
	}
</script>

<Modal
	open={ui.panel === 'random'}
	title={t('Random Galaxy')}
	subtitle={t(
		'One click, a whole new galaxy. The same seed always forges the same map, so you can share it.',
	)}
	tag={t('100% random')}
	width="md"
	on_close={() => ui.close()}
>
	<div class="grid grid-cols-[9rem_1fr] gap-4 items-start">
		<div
			class="relative aspect-square rounded-md overflow-hidden border border-surface-200-800 bg-[#0d0d0f]"
		>
			{#if preview}
				{#key preview}
					<img src={preview} alt="" class="size-full sf-fade-in" />
				{/key}
			{/if}
			<span
				class="absolute bottom-1 left-1 sf-tag bg-black/60 px-1 rounded text-white!"
			>
				{t(info.label)}
			</span>
		</div>
		<div class="flex flex-col gap-3">
			<label class="flex flex-col gap-1">
				<span class="label-text">{t('Seed')}</span>
				<div class="flex gap-1">
					<input
						class="input font-mono bg-surface-100-900 ring-surface-200-800"
						bind:value={seed}
					/>
					<button
						class="sf-icon-btn border border-surface-200-800 shrink-0"
						title={t('New seed')}
						onclick={() => (seed = make_seed())}
					>
						<Icons.Shuffle class="size-4" />
					</button>
				</div>
			</label>
			<div class="flex flex-col gap-1">
				<span class="label-text">{t('Galaxies')}</span>
				<div
					class="grid grid-cols-3 rounded-md border border-surface-200-800 overflow-hidden text-xs"
				>
					{#each [['any', 'Surprise me'], ['single', 'Just one'], ['multi', 'Several']] as const as [value, label] (value)}
						<button
							type="button"
							class={[
								'px-2 py-1.5 transition-colors',
								kind === value ?
									'bg-primary-500 text-white'
								:	'text-surface-600-400 hover:bg-surface-200-800',
							]}
							onclick={() => (kind = value)}
						>
							{t(label)}
						</button>
					{/each}
				</div>
			</div>
			<label class="flex items-center gap-2 text-sm cursor-pointer">
				<input type="checkbox" class="checkbox" bind:checked={lock_systems} />
				{t('Lock number of systems')}
			</label>
			{#if lock_systems}
				<input
					class="input font-mono bg-surface-100-900 ring-surface-200-800"
					type="number"
					min="50"
					max="5000"
					step="50"
					bind:value={systems}
				/>
			{:else}
				<p class="text-xs text-surface-500">
					{t('Suggested')}:
					<span class="font-mono">{info.systems}</span>
					{t('systems')}
				</p>
			{/if}
		</div>
	</div>
	{#if history.length > 0}
		<div class="sf-tag mt-4 mb-1.5">{t('Recent seeds')}</div>
		<div class="flex flex-wrap gap-1">
			{#each history as item (item)}
				<button
					class="px-2 py-1 rounded border border-surface-200-800 font-mono text-xs hover:border-primary-500/60"
					onclick={() => (seed = item)}
				>
					{item}
				</button>
			{/each}
		</div>
	{/if}
	{#snippet footer()}
		<button class="btn preset-tonal" onclick={() => (seed = make_seed())}>
			<Icons.Dices class="size-4" />
			{t('Reroll')}
		</button>
		<button
			class="btn preset-filled-primary-500 sf-btn-glow"
			disabled={busy}
			onclick={forge}
		>
			{#if busy}
				<Icons.RotateCcw class="size-4 sf-spin" />
			{:else}
				<Icons.Sparkles class="size-4" />
			{/if}
			{t('Forge Galaxy')}
		</button>
	{/snippet}
</Modal>
