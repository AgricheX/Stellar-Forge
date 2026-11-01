<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { toaster } from '$lib/toaster';

	const editor = get_editor();
	const open = $derived(ui.panel === 'map');
	const project = $derived(editor().project);
	const names = $derived(project.all_maps().map((map) => map.name));

	let mode = $state<'blank' | 'copy' | 'variant'>('variant');
	let count = $state(400);
	let name = $state('');
	let busy = $state(false);

	const suggested = $derived(
		mode === 'variant' ? `${project.scenario_name} - ${count} Stars`
		: mode === 'copy' ? `${project.scenario_name} 2`
		: `${t('New map')} ${names.length + 1}`,
	);
	const final_name = $derived(name.trim() || suggested);
	const taken = $derived(names.includes(final_name));

	$effect(() => {
		if (open) {
			name = '';
			count = project.generator_settings.number_of_systems;
		}
	});

	const options = [
		{
			id: 'variant',
			icon: Icons.Sparkles,
			title: 'Same galaxy, another star count',
			text: 'Uses this painting and generates again with the number you choose.',
		},
		{
			id: 'copy',
			icon: Icons.Copy,
			title: 'Copy of this map',
			text: 'An exact copy you can change freely.',
		},
		{
			id: 'blank',
			icon: Icons.Square,
			title: 'Blank map',
			text: 'Start a new galaxy from scratch.',
		},
	] as const;

	async function create() {
		if (taken || busy) return;
		busy = true;
		try {
			const map = await editor().add_map(
				final_name,
				mode,
				mode === 'variant' ? count : undefined,
			);
			toaster.success({
				title: t('Map added'),
				description: t('"{name}" has {count} star systems.', {
					name: map.name,
					count: map.solar_systems.length,
				}),
			});
			ui.close();
		} catch (e) {
			toaster.error({
				title: t('Could not add the map'),
				description: e instanceof Error ? t(e.message) : String(e),
			});
		} finally {
			busy = false;
		}
	}
</script>

<Modal
	{open}
	title={t('Add map')}
	subtitle={t(
		'Every map in this project goes into the same mod and shows up as a galaxy size in the game.',
	)}
	tag={t('{count} maps in this mod', { count: names.length })}
	width="md"
	on_close={() => ui.close()}
>
	<div class="flex flex-col gap-3">
		{#each options as option (option.id)}
			<button
				class={[
					'flex gap-3 items-start rounded-md border p-3 text-left transition-colors',
					mode === option.id ?
						'border-primary-500 bg-primary-500/10'
					:	'border-surface-200-800 hover:border-surface-400-600',
				]}
				onclick={() => (mode = option.id)}
			>
				<option.icon class="size-4 mt-0.5 text-primary-500 shrink-0" />
				<span>
					<span class="block font-semibold text-sm">{t(option.title)}</span>
					<span class="block text-xs text-surface-500">{t(option.text)}</span>
				</span>
			</button>
		{/each}
		<div class="grid grid-cols-[1fr_6rem] gap-2">
			<label class="flex flex-col gap-1 min-w-0">
				<span class="label-text text-xs">{t('Name in the game')}</span>
				<input
					class="input bg-surface-100-900 ring-surface-200-800"
					placeholder={suggested}
					bind:value={name}
				/>
			</label>
			{#if mode === 'variant'}
				<label class="flex flex-col gap-1">
					<span class="label-text text-xs">{t('Stars')}</span>
					<input
						type="number"
						min="10"
						max="5000"
						step="50"
						class="input bg-surface-100-900 ring-surface-200-800 font-mono"
						bind:value={count}
					/>
				</label>
			{/if}
		</div>
		{#if taken}
			<span class="text-xs text-error-500">
				{t('A map with this name already exists.')}
			</span>
		{/if}
	</div>
	{#snippet footer()}
		<button class="btn preset-tonal" onclick={() => ui.close()}>
			{t('Cancel')}
		</button>
		<button
			class="btn preset-filled-primary-500 sf-btn-glow"
			disabled={taken || busy || (mode === 'variant' && !(count > 0))}
			onclick={create}
		>
			{#if busy}
				<Icons.RotateCcw class="size-4 sf-spin" />
			{:else}
				<Icons.Plus class="size-4" />
			{/if}
			{t('Add map')}
		</button>
	{/snippet}
</Modal>
