<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { download_blob } from '$lib/blob';
	import {
		build_mod_zip,
		DEFAULT_IMAGE_STYLE,
		mod_display_name,
		mod_folder,
		render_map_image,
		slugify,
		type ImageStyle,
	} from '$lib/export';
	import { bump_version, MOD_TAGS } from '$lib/models/mod_info';
	import { generate_stellaris_galaxy } from '$lib/generate_galaxy_txt';
	import { toaster } from '$lib/toaster';

	const editor = get_editor();
	const project = $derived(editor().project);
	const open = $derived(ui.panel === 'export');

	const info = $derived(project.mod_info);
	let icon_input = $state<HTMLInputElement>();
	let auto_icon_url = $state('');
	let image_style = $state<ImageStyle>({ ...DEFAULT_IMAGE_STYLE });
	let preview_url = $state('');
	let busy = $state<string | null>(null);

	const maps = $derived(project.all_maps());
	const map_names = $derived(maps.map((map) => map.name));
	let variant_count = $state(400);
	let variant_name = $state('');
	const variant_default_name = $derived(
		`${project.scenario_name} - ${variant_count} Stars`,
	);
	const variant_final_name = $derived(
		variant_name.trim() || variant_default_name,
	);
	const variant_taken = $derived(map_names.includes(variant_final_name));

	const create_variant = () =>
		run('variant', async () => {
			const name = variant_final_name;
			const variant = await editor().add_map(name, 'variant', variant_count);
			variant_name = '';
			toaster.success({
				title: t('Variant created'),
				description: t(
					'"{name}" has {count} star systems and is a new map in this mod.',
					{
						name,
						count: variant.solar_systems.length,
					},
				),
			});
		});

	const spawns = $derived(
		project.solar_systems.filter((system) => system.is_spawn).length,
	);
	const has_systems = $derived(project.solar_systems.length > 0);
	const any_systems = $derived(
		maps.some((map) => map.solar_systems.length > 0),
	);

	$effect(() => {
		if (!open || info.icon) return;
		const current = project;
		let cancelled = false;
		render_map_image(current, { ...DEFAULT_IMAGE_STYLE, size: 256 }).then(
			(blob) => {
				if (cancelled) return;
				if (auto_icon_url) URL.revokeObjectURL(auto_icon_url);
				auto_icon_url = URL.createObjectURL(blob);
			},
		);
		return () => {
			cancelled = true;
		};
	});

	async function upload_icon(file: File) {
		try {
			const bitmap = await createImageBitmap(file);
			const side = Math.min(bitmap.width, bitmap.height);
			const canvas = document.createElement('canvas');
			canvas.width = 512;
			canvas.height = 512;
			const ctx = canvas.getContext('2d')!;
			ctx.imageSmoothingQuality = 'high';
			ctx.drawImage(
				bitmap,
				(bitmap.width - side) / 2,
				(bitmap.height - side) / 2,
				side,
				side,
				0,
				0,
				512,
				512,
			);
			editor().update_mod_info({ icon: canvas.toDataURL('image/png') });
		} catch {
			toaster.error({ title: t('Could not read this image.') });
		}
	}

	function toggle_tag(tag: string) {
		const tags =
			info.tags.includes(tag) ?
				info.tags.filter((t) => t !== tag)
			:	[...info.tags, tag];
		editor().update_mod_info({ tags });
	}

	$effect(() => {
		if (!open) return;
		const style = { ...image_style, size: 640 };
		const current = project;
		let cancelled = false;
		render_map_image(current, style).then((blob) => {
			if (cancelled) return;
			if (preview_url) URL.revokeObjectURL(preview_url);
			preview_url = URL.createObjectURL(blob);
		});
		return () => {
			cancelled = true;
		};
	});

	async function run(id: string, fn: () => Promise<void>) {
		busy = id;
		try {
			await fn();
		} catch (e) {
			toaster.error({
				title: t('Export failed'),
				description: e instanceof Error ? t(e.message) : String(e),
			});
		} finally {
			busy = null;
		}
	}

	const download_mod = () =>
		run('mod', async () => {
			const blob = await build_mod_zip(project);
			download_blob(blob, `${mod_folder(project)}_v${info.version}.zip`);
			toaster.success({
				title: t('Mod ready'),
				description: t('Extract the zip into your Stellaris mod folder.'),
			});
		});

	const download_txt = () =>
		run('txt', async () => {
			const txt = generate_stellaris_galaxy(project);
			download_blob(
				new Blob([txt], { type: 'text/plain' }),
				`${project.scenario_name}.txt`,
			);
		});

	const download_png = () =>
		run('png', async () => {
			const blob = await render_map_image(project, image_style);
			download_blob(blob, `${slugify(project.scenario_name)}.png`);
		});

	const download_json = () =>
		run('json', async () => {
			const json = JSON.stringify(await project.to_json());
			download_blob(
				new Blob([json], { type: 'application/json' }),
				`${project.name}.json`,
			);
		});
</script>

<Modal
	{open}
	title={t('Export')}
	subtitle={t(
		'Download a ready-to-use Stellaris mod, the raw map file or a picture of your galaxy.',
	)}
	tag={project.name}
	width="xl"
	on_close={() => ui.close()}
>
	<div class="grid md:grid-cols-[1fr_17rem] gap-6">
		<div class="flex flex-col gap-4">
			{#if !has_systems}
				<div
					class="flex gap-3 rounded-md border border-warning-500/40 bg-warning-500/10 px-3 py-2 text-sm"
				>
					<Icons.TriangleAlert
						class="size-4 text-warning-500 shrink-0 mt-0.5"
					/>
					<span>
						{t('Your galaxy has no star systems yet. Go to Generate first.')}
					</span>
				</div>
			{/if}
			<section class="sf-panel sf-accent-bar p-4 ps-5">
				<div class="flex items-start justify-between gap-3">
					<div>
						<div class="sf-tag">{t('Recommended')}</div>
						<h3 class="font-bold text-base mt-0.5 flex items-center gap-2">
							<Icons.Package class="size-4 text-primary-500" />
							{t('Stellaris Mod (.zip)')}
						</h3>
						<p class="text-sm text-surface-600-400 mt-1">
							{t(
								'Descriptor, map file and thumbnail, already in the right folders. Just extract it into your mod folder.',
							)}
						</p>
					</div>
				</div>
				<div class="grid grid-cols-[6.5rem_1fr] gap-4 mt-4">
					<div class="flex flex-col gap-1.5">
						<button
							class="relative aspect-square rounded-md overflow-hidden border border-surface-200-800 bg-[#0d0d0f] group"
							title={t('Upload image')}
							onclick={() => icon_input?.click()}
						>
							{#if info.icon || auto_icon_url}
								<img
									src={info.icon || auto_icon_url}
									alt=""
									class={[
										'size-full object-cover',
										!info.thumbnail && 'opacity-30',
									]}
								/>
							{/if}
							<span
								class="absolute inset-0 grid place-items-center bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity"
							>
								<Icons.Upload class="size-5 text-white" />
							</span>
						</button>
						<input
							bind:this={icon_input}
							type="file"
							accept="image/*"
							class="hidden"
							onchange={(e) => {
								const file = e.currentTarget.files?.[0];
								if (file) void upload_icon(file);
								e.currentTarget.value = '';
							}}
						/>
						<span
							class="text-[0.65rem] text-surface-500 text-center leading-tight"
						>
							{info.icon ? t('Your image') : t('Map picture')}
						</span>
						{#if info.icon}
							<button
								class="text-[0.65rem] text-primary-500 hover:underline"
								onclick={() => editor().update_mod_info({ icon: '' })}
							>
								{t('Use map picture')}
							</button>
						{/if}
						<label
							class="flex items-center justify-center gap-1.5 text-[0.65rem] cursor-pointer"
						>
							<input
								type="checkbox"
								class="checkbox size-3"
								checked={info.thumbnail}
								onchange={(e) =>
									editor().update_mod_info({
										thumbnail: e.currentTarget.checked,
									})}
							/>
							{t('Thumbnail')}
						</label>
					</div>
					<div class="flex flex-col gap-3 min-w-0">
						<div class="grid grid-cols-[1fr_7.5rem] gap-2">
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Mod name')}</span>
								<input
									class="input bg-surface-100-900 ring-surface-200-800"
									placeholder={project.name}
									value={info.name}
									onchange={(e) =>
										editor().update_mod_info({ name: e.currentTarget.value })}
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Version')}</span>
								<div class="flex">
									<input
										class="input bg-surface-100-900 ring-surface-200-800 rounded-e-none font-mono text-sm"
										value={info.version}
										onchange={(e) =>
											editor().update_mod_info({
												version: e.currentTarget.value.trim() || '1.0.0',
											})}
									/>
									<button
										class="btn-icon preset-tonal rounded-s-none h-auto px-2"
										title={t('Next version')}
										onclick={() =>
											editor().update_mod_info({
												version: bump_version(info.version),
											})}
									>
										<Icons.Plus class="size-3.5" />
									</button>
								</div>
							</label>
						</div>
						<label class="flex flex-col gap-1">
							<span class="label-text text-xs">
								{t('Description')}
								<span class="text-surface-500">
									· {t('goes in the README, copy it to the Workshop page')}
								</span>
							</span>
							<textarea
								class="textarea bg-surface-100-900 ring-surface-200-800 text-sm"
								rows="2"
								value={info.description}
								onchange={(e) =>
									editor().update_mod_info({
										description: e.currentTarget.value,
									})}
							></textarea>
						</label>
						<div class="flex flex-col gap-1">
							<span class="label-text text-xs">{t('Tags')}</span>
							<div class="flex flex-wrap gap-1">
								{#each MOD_TAGS as tag (tag)}
									<button
										class={[
											'px-2 py-0.5 rounded-full border text-[0.7rem] transition-colors',
											info.tags.includes(tag) ?
												'border-primary-500 bg-primary-500/15 text-primary-500'
											:	'border-surface-200-800 text-surface-600-400 hover:border-surface-400-600',
										]}
										onclick={() => toggle_tag(tag)}
									>
										{tag}
									</button>
								{/each}
							</div>
						</div>
						<div class="grid grid-cols-2 gap-2">
							{#if ui.advanced}
								<label class="flex flex-col gap-1">
									<span class="label-text text-xs">{t('Game version')}</span>
									<input
										class="input bg-surface-100-900 ring-surface-200-800 font-mono text-sm"
										value={info.supported_version}
										onchange={(e) =>
											editor().update_mod_info({
												supported_version:
													e.currentTarget.value.trim() || 'v4.*',
											})}
									/>
								</label>
							{/if}
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Workshop ID')}</span>
								<input
									class="input bg-surface-100-900 ring-surface-200-800 font-mono text-sm"
									placeholder={t('optional')}
									title={t(
										'The number in your Workshop link. Updates go to the same Workshop item.',
									)}
									value={info.remote_file_id}
									onchange={(e) =>
										editor().update_mod_info({
											remote_file_id: (
												e.currentTarget.value.match(/id=(\d+)/)?.[1] ??
												e.currentTarget.value
											).replace(/\D/g, ''),
										})}
								/>
							</label>
						</div>
					</div>
				</div>
				<div class="mt-4 rounded-md border border-surface-200-800 p-3">
					<div class="flex items-center justify-between gap-2">
						<span class="font-semibold text-sm flex items-center gap-2">
							<Icons.Layers class="size-4 text-primary-500" />
							{t('Maps in this mod')}
						</span>
						<span class="sf-tag">
							{t('{count} maps in this mod', { count: maps.length })}
						</span>
					</div>
					<p class="text-xs text-surface-500 mt-1">
						{t(
							'Each map shows up as a galaxy size in the game. Add and switch maps with the tabs above the map.',
						)}
					</p>
					<ul class="flex flex-col gap-1 mt-2 max-h-36 overflow-y-auto pe-1">
						{#each maps as map, index (index)}
							<li>
								<button
									class={[
										'w-full flex items-center gap-2 rounded-md px-2 py-1 text-sm text-left transition-colors',
										index === project.active_map_index ?
											'bg-primary-500/15 text-primary-500'
										:	'hover:bg-surface-100-900',
									]}
									onclick={() => editor().switch_map(index)}
								>
									<span class="truncate">{map.name}</span>
									<span
										class="ms-auto font-mono text-[0.65rem] text-surface-500 shrink-0"
									>
										{map.solar_systems.length}
										{t('systems')}
									</span>
								</button>
							</li>
						{/each}
					</ul>
					<div class="grid grid-cols-[1fr_5.5rem_auto] gap-2 mt-3 items-end">
						<label class="flex flex-col gap-1 min-w-0">
							<span class="label-text text-xs">
								{t('New variant with another star count')}
							</span>
							<input
								class="input bg-surface-100-900 ring-surface-200-800 text-sm"
								placeholder={variant_default_name}
								bind:value={variant_name}
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="label-text text-xs">{t('Stars')}</span>
							<input
								type="number"
								min="10"
								max="5000"
								step="50"
								class="input bg-surface-100-900 ring-surface-200-800 font-mono text-sm"
								bind:value={variant_count}
							/>
						</label>
						<button
							class="btn preset-tonal h-[2.6rem]"
							disabled={busy != null || variant_taken || !(variant_count > 0)}
							title={variant_taken ?
								t('A project with this name already exists.')
							:	undefined}
							onclick={create_variant}
						>
							{#if busy === 'variant'}
								<Icons.RotateCcw class="size-4 sf-spin" />
							{:else}
								<Icons.Plus class="size-4" />
							{/if}
							{t('Create')}
						</button>
					</div>
				</div>
				<button
					class="btn preset-filled-primary-500 sf-btn-glow w-full mt-3"
					disabled={!any_systems || busy != null}
					onclick={download_mod}
				>
					{#if busy === 'mod'}
						<Icons.RotateCcw class="size-4 sf-spin" />
					{:else}
						<Icons.Download class="size-4" />
					{/if}
					{t('Download Mod')}
					<span class="font-mono text-xs opacity-80">
						v{info.version}{maps.length > 1 ?
							` · ${maps.length} ${t('maps')}`
						:	''}
					</span>
				</button>
				<p class="text-xs text-surface-500 mt-2 font-mono truncate">
					{mod_folder(project)}.zip · {mod_display_name(project)}
				</p>
				<p class="text-xs text-surface-500 mt-2 flex items-center gap-1.5">
					<Icons.Info class="size-3.5" />
					{t(
						'Requires the Paint a Galaxy mod by Michael Moore on the Steam Workshop.',
					)}
					<button
						class="text-primary-500 hover:underline"
						onclick={() => ui.open('guide')}
					>
						{t('How to install')}
					</button>
				</p>
			</section>

			<div class="grid sm:grid-cols-2 gap-3">
				<button
					class="sf-panel p-3 text-left hover:border-primary-500/60 transition-colors disabled:opacity-50"
					disabled={!has_systems || busy != null}
					onclick={download_txt}
				>
					<div class="flex items-center gap-2 font-semibold text-sm">
						<Icons.FileText class="size-4 text-primary-500" />
						{t('Map file only (.txt)')}
					</div>
					<p class="text-xs text-surface-500 mt-1">
						{t('For map/setup_scenarios in your own mod.')}
					</p>
				</button>
				<button
					class="sf-panel p-3 text-left hover:border-primary-500/60 transition-colors disabled:opacity-50"
					disabled={busy != null}
					onclick={download_json}
				>
					<div class="flex items-center gap-2 font-semibold text-sm">
						<Icons.Copy class="size-4 text-primary-500" />
						{t('Project backup (.json)')}
					</div>
					<p class="text-xs text-surface-500 mt-1">
						{t('Open it later with Project → Import.')}
					</p>
				</button>
			</div>

			<dl class="grid grid-cols-4 gap-2">
				{#each [[project.solar_systems.length, 'systems'], [project.hyperlanes.length, 'hyperlanes'], [spawns, 'spawns'], [project.nebulas.length, 'nebulas']] as [value, label] (label)}
					<div class="sf-panel px-3 py-2">
						<dt class="sf-tag">{t(String(label))}</dt>
						<dd class="font-mono text-lg font-bold">{value}</dd>
					</div>
				{/each}
			</dl>
		</div>

		<aside class="flex flex-col gap-3">
			<div class="sf-tag">{t('Map image (.png)')}</div>
			<div
				class="aspect-square rounded-md overflow-hidden border border-surface-200-800 bg-[#0d0d0f]"
			>
				{#if preview_url}
					<img src={preview_url} alt="" class="size-full sf-fade-in" />
				{/if}
			</div>
			<div class="grid grid-cols-2 gap-x-3 gap-y-1.5 text-xs">
				<label class="flex items-center gap-1.5">
					<input
						type="checkbox"
						class="checkbox size-3.5"
						bind:checked={image_style.show_hyperlanes}
					/>
					{t('Hyperlanes')}
				</label>
				<label class="flex items-center gap-1.5">
					<input
						type="checkbox"
						class="checkbox size-3.5"
						bind:checked={image_style.show_spawns}
					/>
					{t('Spawns')}
				</label>
				<label class="flex items-center gap-1.5">
					<input
						type="checkbox"
						class="checkbox size-3.5"
						bind:checked={image_style.show_nebulas}
					/>
					{t('Nebulas')}
				</label>
				<label class="flex items-center gap-1.5">
					<input
						type="checkbox"
						class="checkbox size-3.5"
						bind:checked={image_style.show_paint}
					/>
					{t('Painting')}
				</label>
				<label class="flex items-center gap-1.5">
					<input
						type="checkbox"
						class="checkbox size-3.5"
						bind:checked={image_style.show_title}
					/>
					{t('Title')}
				</label>
				<label class="flex items-center gap-1.5">
					<input
						type="color"
						class="size-4 rounded"
						bind:value={image_style.accent}
					/>
					{t('Accent')}
				</label>
			</div>
			<div class="flex gap-2">
				<select
					class="select bg-surface-100-900 ring-surface-200-800 text-xs h-9"
					bind:value={image_style.background}
				>
					<option value="space">{t('Space')}</option>
					<option value="black">{t('Black')}</option>
					<option value="transparent">{t('Transparent')}</option>
				</select>
				<select
					class="select bg-surface-100-900 ring-surface-200-800 text-xs h-9"
					bind:value={image_style.size}
				>
					<option value={1024}>1024 px</option>
					<option value={2048}>2048 px</option>
					<option value={4096}>4096 px</option>
				</select>
			</div>
			<button
				class="btn preset-tonal w-full"
				disabled={busy != null}
				onclick={download_png}
			>
				{#if busy === 'png'}
					<Icons.RotateCcw class="size-4 sf-spin" />
				{:else}
					<Icons.Image class="size-4" />
				{/if}
				{t('Download Image')}
			</button>
		</aside>
	</div>
</Modal>
