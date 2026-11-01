<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { toaster } from '$lib/toaster';
	import { open_mod_zip, type OpenedMod } from '$lib/mod_import';
	import { bump_version, ModInfo } from '$lib/models/mod_info';
	import { Project } from '$lib/models/project';
	import { CUSTOM_COMMAND, ID } from '$lib/constants';

	const editor = get_editor();
	const open = $derived(ui.panel === 'mod');

	let opened = $state<OpenedMod | null>(null);
	let error = $state<string | null>(null);
	let loading = $state(false);
	let name = $state('');
	let replace = $state(true);
	let bump = $state(true);
	let dragging_over = $state(false);
	let creating = $state(false);
	let file_input = $state<HTMLInputElement>();

	const existing = $derived(
		opened != null &&
			editor().projects.some(
				(project) => project.name === opened!.project.name,
			),
	);
	const final_name = $derived(
		existing && replace ? (opened?.project.name ?? '') : name.trim(),
	);
	const duplicate = $derived(
		!(existing && replace) &&
			editor().projects.some((project) => project.name === name.trim()),
	);

	$effect(() => {
		if (!open) {
			opened = null;
			error = null;
		}
	});

	async function load(file: File) {
		opened = null;
		error = null;
		loading = true;
		try {
			opened = await open_mod_zip(file);
			let candidate = opened.project.name;
			let n = 2;
			while (editor().projects.some((project) => project.name === candidate))
				candidate = `${opened.project.name} ${n++}`;
			name = candidate;
			replace = true;
			bump = true;
		} catch (e) {
			error = e instanceof Error ? t(e.message) : String(e);
		} finally {
			loading = false;
		}
	}

	async function create() {
		if (!opened || !final_name || duplicate) return;
		creating = true;
		try {
			const base = opened.project;
			const project = new Project({
				...base,
				name: final_name,
				mod_info:
					bump ?
						ModInfo.make({
							...base.mod_info,
							version: bump_version(base.mod_info.version),
						})
					:	base.mod_info,
			});
			await editor().create_project(final_name, project);
			const event = new Event('command') as Event & { command: string };
			event.command = CUSTOM_COMMAND.reset_zoom;
			document.getElementById(ID.canvas)?.dispatchEvent(event);
			toaster.success({
				title: t('Mod opened'),
				description: t('Edit it and export again to update your mod.'),
			});
			ui.close();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			creating = false;
		}
	}
</script>

<input
	bind:this={file_input}
	type="file"
	accept=".zip"
	class="hidden"
	onchange={(e) => {
		const file = e.currentTarget.files?.[0];
		if (file) void load(file);
		e.currentTarget.value = '';
	}}
/>

<Modal
	{open}
	title={t('Open mod (.zip)')}
	subtitle={t(
		'Open a mod you exported to change the map and release a new version.',
	)}
	tag={t('Update mod')}
	width="lg"
	on_close={() => ui.close()}
>
	<div class="flex flex-col gap-4">
		<button
			class={[
				'rounded-container border-2 border-dashed p-6 flex flex-col items-center gap-2 text-center transition-colors',
				dragging_over ?
					'border-primary-500 bg-primary-500/10'
				:	'border-surface-300-700 hover:border-primary-500/60',
			]}
			ondragover={(e) => {
				e.preventDefault();
				dragging_over = true;
			}}
			ondragleave={() => (dragging_over = false)}
			ondrop={(e) => {
				e.preventDefault();
				dragging_over = false;
				const file = e.dataTransfer?.files[0];
				if (file) void load(file);
			}}
			onclick={() => file_input?.click()}
		>
			{#if loading}
				<Icons.RotateCcw class="size-8 text-primary-500 sf-spin" />
				<span class="font-semibold">{t('Reading the mod')}...</span>
			{:else}
				<Icons.FolderOpen class="size-8 text-primary-500" />
				<span class="font-semibold">
					{t('Drop the mod .zip here or click to choose')}
				</span>
				<span class="text-xs text-surface-500">
					{t(
						'Works best with zips made by Stellar Forge. Other galaxy mods are rebuilt from their map file.',
					)}
				</span>
			{/if}
		</button>

		{#if error}
			<div
				class="flex gap-3 rounded-md border border-error-500/40 bg-error-500/10 px-3 py-2 text-sm"
			>
				<Icons.TriangleAlert class="size-4 text-error-500 shrink-0 mt-0.5" />
				<span>{error}</span>
			</div>
		{/if}

		{#if opened}
			{@const project = opened.project}
			{@const info = project.mod_info}
			<section
				class="sf-panel sf-accent-bar p-4 ps-5 flex flex-col gap-3 sf-fade-in"
			>
				<div class="flex gap-3 items-center">
					{#if info.icon}
						<img
							src={info.icon}
							alt=""
							class="size-14 rounded-md border border-surface-200-800 object-cover"
						/>
					{/if}
					<div class="min-w-0">
						<div class="sf-tag">
							v{info.version} · {opened.source === 'project' ?
								t('Full project')
							:	t('Rebuilt from the map file')}
						</div>
						<h3 class="font-bold text-base mt-0.5 truncate">
							{info.name || project.name}
						</h3>
						<p class="text-xs text-surface-500 truncate">
							{opened.file_name}
						</p>
					</div>
				</div>
				<dl class="grid grid-cols-4 gap-2">
					{#each [[project.solar_systems.length, 'systems'], [project.hyperlanes.length, 'hyperlanes'], [project.solar_systems.filter((system) => system.is_spawn).length, 'spawns'], [project.custom_systems.length, 'designs']] as [value, label] (label)}
						<div class="rounded-md bg-surface-100-900 px-2 py-1.5">
							<dt class="sf-tag text-[0.6rem]!">{t(String(label))}</dt>
							<dd class="font-mono font-bold">{value}</dd>
						</div>
					{/each}
				</dl>
				{#if project.map_count > 1}
					<div class="flex flex-col gap-1.5">
						<span class="sf-tag">
							{t('{count} maps in this mod', { count: project.map_count })}
						</span>
						<ul
							class="flex flex-col gap-1 max-h-40 overflow-y-auto text-sm pe-1"
						>
							{#each project.all_maps() as map, index (index)}
								<li
									class="flex items-center justify-between gap-2 rounded-md bg-surface-100-900 px-2 py-1"
								>
									<span class="truncate">{map.name}</span>
									<span class="font-mono text-xs text-surface-500 shrink-0">
										{map.solar_systems.length}
										{t('systems')}
									</span>
								</li>
							{/each}
						</ul>
						<p class="text-xs text-surface-500">
							{t(
								'All maps open in one project. Switch between them with the tabs above the map.',
							)}
						</p>
					</div>
				{/if}
				{#if opened.source === 'rebuilt'}
					<p class="text-xs text-surface-500 flex gap-1.5">
						<Icons.Info class="size-3.5 shrink-0 mt-0.5" />
						{t(
							'This zip has no Stellar Forge project inside, so the painting is blank. Systems, hyperlanes, spawns and designs were kept.',
						)}
					</p>
				{/if}
				{#if existing}
					<div class="flex flex-col gap-1.5 text-sm">
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								class="radio size-4"
								bind:group={replace}
								value={true}
							/>
							{t('Replace the project "{name}" in this browser', {
								name: project.name,
							})}
						</label>
						<label class="flex items-center gap-2 cursor-pointer">
							<input
								type="radio"
								class="radio size-4"
								bind:group={replace}
								value={false}
							/>
							{t('Open as a new project')}
						</label>
					</div>
				{/if}
				{#if !existing || !replace}
					<label class="flex flex-col gap-1">
						<span class="label-text text-xs">{t('Project name')}</span>
						<input
							class="input bg-surface-100-900 ring-surface-200-800"
							bind:value={name}
						/>
						{#if duplicate}
							<span class="text-xs text-error-500">
								{t('A project with this name already exists.')}
							</span>
						{/if}
					</label>
				{/if}
				<label class="flex items-center gap-2 cursor-pointer text-sm">
					<input type="checkbox" class="checkbox size-4" bind:checked={bump} />
					{t('Get the next version ready ({from} → {to})', {
						from: info.version,
						to: bump_version(info.version),
					})}
				</label>
			</section>
		{/if}
	</div>
	{#snippet footer()}
		<button class="btn preset-tonal" onclick={() => ui.close()}>
			{t('Cancel')}
		</button>
		<button
			class="btn preset-filled-primary-500 sf-btn-glow"
			disabled={!opened || !final_name || duplicate || creating}
			onclick={create}
		>
			{#if creating}
				<Icons.RotateCcw class="size-4 sf-spin" />
			{:else}
				<Icons.Check class="size-4" />
			{/if}
			{t('Open mod')}
		</button>
	{/snippet}
</Modal>
