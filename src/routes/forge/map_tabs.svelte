<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { tick } from 'svelte';

	const editor = get_editor();
	const project = $derived(editor().project);
	const maps = $derived(project.all_maps());
	const active = $derived(project.active_map_index);

	let editing = $state<number | null>(null);
	let draft = $state('');
	let input = $state<HTMLInputElement>();
	let bar = $state<HTMLDivElement>();

	$effect(() => {
		const index = active;
		void maps.length;
		tick().then(() => {
			bar
				?.querySelector(`[data-map="${index}"]`)
				?.scrollIntoView({ block: 'nearest', inline: 'nearest' });
		});
	});

	async function start_rename(index: number) {
		editing = index;
		draft = maps[index]?.name ?? '';
		await tick();
		input?.select();
	}

	function finish_rename() {
		if (editing == null) return;
		const name = draft.trim();
		const taken = maps.some((map, i) => i !== editing && map.name === name);
		if (name && !taken) editor().rename_map(editing, name);
		editing = null;
	}

	function remove(index: number) {
		const name = maps[index]?.name ?? '';
		if (
			window.confirm(
				t('Delete the map "{name}" from this project? This cannot be undone.', {
					name,
				}),
			)
		) {
			editor().delete_map(index);
		}
	}
</script>

<div
	bind:this={bar}
	class="flex items-center gap-1 h-9 px-2 border-b border-surface-200-800 bg-surface-50-950 overflow-x-auto select-none"
>
	<span class="sf-tag shrink-0 me-1 hidden sm:inline">{t('Maps')}</span>
	{#each maps as map, index (index)}
		<div
			data-map={index}
			class={[
				'group flex items-center gap-1 h-7 rounded-md border text-xs shrink-0 transition-colors',
				index === active ?
					'border-primary-500/60 bg-primary-500/15 text-primary-500'
				:	'border-transparent text-surface-600-400 hover:bg-surface-100-900',
			]}
		>
			{#if editing === index}
				<input
					bind:this={input}
					bind:value={draft}
					class="h-6 w-40 bg-transparent px-2 outline-none text-surface-950-50"
					onblur={finish_rename}
					onkeydown={(e) => {
						if (e.key === 'Enter') finish_rename();
						if (e.key === 'Escape') editing = null;
					}}
				/>
			{:else}
				<button
					class="h-full ps-2.5 pe-1 max-w-48 truncate"
					title={`${map.name} · ${map.solar_systems.length} ${t('systems')} · ${t('Double-click to rename')}`}
					onclick={() => editor().switch_map(index)}
					ondblclick={() => start_rename(index)}
				>
					{map.name}
				</button>
				<span class="font-mono text-[0.6rem] opacity-60 pe-1">
					{map.solar_systems.length}
				</span>
				{#if maps.length > 1}
					<button
						class="size-5 me-0.5 grid place-items-center rounded opacity-0 group-hover:opacity-100 hover:bg-error-500/20 hover:text-error-500 transition-opacity"
						title={t('Delete map')}
						onclick={() => remove(index)}
					>
						<Icons.X class="size-3" />
					</button>
				{/if}
			{/if}
		</div>
	{/each}
	<button
		class="h-7 px-2 flex items-center gap-1 rounded-md text-xs text-surface-600-400 hover:text-primary-500 hover:bg-surface-100-900 shrink-0"
		title={t('Add map')}
		onclick={() => ui.open('map')}
	>
		<Icons.Plus class="size-3.5" />
		<span class={maps.length > 1 ? 'hidden md:inline' : ''}>
			{t('Add map')}
		</span>
	</button>
</div>
