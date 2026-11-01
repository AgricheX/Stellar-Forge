<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { toaster } from '$lib/toaster';
	import { parse_save, type ParsedSave } from '$lib/save_import';
	import { CUSTOM_COMMAND, ID } from '$lib/constants';

	const editor = get_editor();
	const open = $derived(ui.panel === 'save');

	let parsed = $state<ParsedSave | null>(null);
	let progress = $state<string | null>(null);
	let error = $state<string | null>(null);
	let name = $state('');
	let spawns = $state(true);
	let keep_initializers = $state(true);
	let paint = $state(true);
	let dragging_over = $state(false);
	let creating = $state(false);
	let file_input = $state<HTMLInputElement>();

	const duplicate = $derived(
		editor().projects.some((project) => project.name === name.trim()),
	);

	$effect(() => {
		if (!open) {
			parsed = null;
			progress = null;
			error = null;
		}
	});

	async function load(file: File) {
		parsed = null;
		error = null;
		try {
			parsed = await parse_save(file, (step) => (progress = step));
			let candidate = parsed.summary.name || 'Imported Galaxy';
			let n = 2;
			const base = candidate;
			while (editor().projects.some((project) => project.name === candidate))
				candidate = `${base} ${n++}`;
			name = candidate;
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			progress = null;
		}
	}

	async function create() {
		if (!parsed || !name.trim() || duplicate) return;
		creating = true;
		try {
			const project = await parsed.build({
				name: name.trim(),
				spawns,
				keep_initializers,
				paint,
			});
			await editor().create_project(name.trim(), project);
			editor().set_step('tweak');
			const event = new Event('command') as Event & { command: string };
			event.command = CUSTOM_COMMAND.reset_zoom;
			document.getElementById(ID.canvas)?.dispatchEvent(event);
			toaster.success({
				title: t('Galaxy imported'),
				description: t('{n} systems are ready to edit.', {
					n: project.solar_systems.length,
				}),
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
	accept=".sav,.txt"
	class="hidden"
	onchange={(e) => {
		const file = e.currentTarget.files?.[0];
		if (file) void load(file);
		e.currentTarget.value = '';
	}}
/>

<Modal
	{open}
	title={t('Import from Stellaris save')}
	subtitle={t(
		'Turn the galaxy of a campaign you played into an editable project.',
	)}
	tag={t('Save import')}
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
			{#if progress}
				<Icons.RotateCcw class="size-8 text-primary-500 sf-spin" />
				<span class="font-semibold">{t(progress)}...</span>
			{:else}
				<Icons.HardDriveUpload class="size-8 text-primary-500" />
				<span class="font-semibold">
					{t('Drop a .sav file here or click to choose')}
				</span>
				<span class="text-xs text-surface-500">
					{t(
						'Saves are in Documents/Paradox Interactive/Stellaris/save games. Nothing is uploaded: the file is read in your browser.',
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

		{#if parsed}
			{@const summary = parsed.summary}
			<section
				class="sf-panel sf-accent-bar p-4 ps-5 flex flex-col gap-3 sf-fade-in"
			>
				<div>
					<div class="sf-tag">
						{summary.date ? `${summary.date} · ` : ''}{summary.version}
					</div>
					<h3 class="font-bold text-base mt-0.5">{summary.name}</h3>
				</div>
				<dl class="grid grid-cols-5 gap-2">
					{#each [[summary.systems, 'systems'], [summary.hyperlanes, 'hyperlanes'], [summary.wormholes, 'wormholes'], [summary.nebulas, 'nebulas'], [summary.capitals, 'empires']] as [value, label] (label)}
						<div class="rounded-md bg-surface-100-900 px-2 py-1.5">
							<dt class="sf-tag text-[0.6rem]!">{t(String(label))}</dt>
							<dd class="font-mono font-bold">{value}</dd>
						</div>
					{/each}
				</dl>
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
				<div class="flex flex-col gap-1.5 text-sm">
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							class="checkbox size-4"
							bind:checked={spawns}
						/>
						{t('Turn empire capitals into spawn points')}
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							class="checkbox size-4"
							bind:checked={keep_initializers}
						/>
						{t('Keep special systems (Sol, guardians, Fallen Empires...)')}
					</label>
					<label class="flex items-center gap-2 cursor-pointer">
						<input
							type="checkbox"
							class="checkbox size-4"
							bind:checked={paint}
						/>
						{t('Paint the star density so you can regenerate it later')}
					</label>
				</div>
			</section>
		{/if}
	</div>
	{#snippet footer()}
		<button class="btn preset-tonal" onclick={() => ui.close()}>
			{t('Cancel')}
		</button>
		<button
			class="btn preset-filled-primary-500 sf-btn-glow"
			disabled={!parsed || !name.trim() || duplicate || creating}
			onclick={create}
		>
			{#if creating}
				<Icons.RotateCcw class="size-4 sf-spin" />
			{:else}
				<Icons.Check class="size-4" />
			{/if}
			{t('Create project')}
		</button>
	{/snippet}
</Modal>
