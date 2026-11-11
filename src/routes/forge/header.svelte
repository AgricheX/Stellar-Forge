<script lang="ts">
	import { resolve } from '$app/paths';
	import { goto } from '$app/navigation';
	import { LINKS } from '$lib/links';
	import { Menu, Portal } from '@skeletonlabs/skeleton-svelte';
	import { get_editor } from '$lib/editor.svelte';
	import { Match } from 'effect';
	import { CUSTOM_COMMAND, ID } from '$lib/constants';
	import { make_blank_image } from '$lib/canvas';
	import { Action } from '$lib/models/action';
	import { Project } from '$lib/models/project';
	import { GridConfig } from '$lib/models/grid_config';
	import { SymmetryConfig } from '$lib/models/symmetry_config';
	import { download_blob } from '$lib/blob';
	import ModeToggle from './mode_toggle.svelte';
	import { Icons } from '$lib/components/icons';
	import Brand from '$lib/components/brand.svelte';
	import { t, i18n, set_locale } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import type { Step } from '$lib/models/step';

	type RecordUnknown = Record<string, unknown>;
	type Command =
		| 'show-modal'
		| 'close'
		| 'request-close'
		| 'show-popover'
		| 'hide-popover'
		| 'toggle-popover'
		| (typeof CUSTOM_COMMAND)[keyof typeof CUSTOM_COMMAND];

	const editor = get_editor();

	function on_edit_menu_select(details: { value: string }) {
		Match.value(details.value).pipe(
			Match.when('undo', () => editor().undo()),
			Match.when('redo', () => editor().redo()),
			Match.when('clear', async () =>
				editor().apply_actions([
					Action.SetCanvasAction.make({
						old_value: editor().project.canvas,
						new_value: await make_blank_image(),
					}),
				]),
			),
		);
	}

	const steps: { id: Step; name: string }[] = [
		{ id: 'paint', name: 'Paint' },
		{ id: 'generate', name: 'Generate' },
		{ id: 'tweak', name: 'Tweak' },
	];
	const step_index = $derived(
		steps.findIndex((step) => step.id === editor().step),
	);
</script>

{#snippet menu_item_command(
	value: string,
	text: string,
	command: Command,
	commandfor: (typeof ID)[keyof typeof ID],
)}
	<Menu.Item {value} class="w-full">
		{#snippet element(attributes: RecordUnknown)}
			<button {...attributes} {command} {commandfor}>
				<Menu.ItemText>{t(text)}</Menu.ItemText>
			</button>
		{/snippet}
	</Menu.Item>
{/snippet}

{#snippet menu_item_link(value: string, text: string, url: string)}
	<Menu.Item {value}>
		{#snippet element(attributes: RecordUnknown)}
			<!-- eslint-disable-next-line svelte/no-navigation-without-resolve -->
			<a href={url} target="_blank" rel="noreferrer" {...attributes}>
				<Menu.ItemText>{t(text)}</Menu.ItemText>
			</a>
		{/snippet}
	</Menu.Item>
{/snippet}

{#snippet menu_item_canvas_opacity(value: number)}
	<Menu.OptionItem
		type="radio"
		value="canvas-opacity-{value}"
		checked={editor().current_step_canvas_opacity === value}
		onCheckedChange={(checked) => {
			if (checked) {
				const setting = `canvas_opacity_${editor().step}_step` as const;
				editor().update_view_settings({ [setting]: value });
			}
		}}
	>
		<Menu.ItemText>{value * 100}%</Menu.ItemText>
		<Menu.ItemIndicator class="hidden data-[state=checked]:block ms-2">
			<Icons.Check class="size-4" />
		</Menu.ItemIndicator>
	</Menu.OptionItem>
{/snippet}

<header
	class="relative z-20 flex items-center gap-0.5 md:gap-1 h-12 md:h-14 px-2 md:px-3 border-b border-surface-200-800 bg-surface-50-950/90 backdrop-blur"
>
	<a href={resolve('/')} class="me-1 md:me-2" title={t('Home page')}>
		<span class="md:hidden"><Brand compact /></span>
		<span class="hidden md:block"><Brand /></span>
	</a>
	<div class="hidden md:block h-6 w-px bg-surface-200-800 mx-1"></div>
	<Menu
		onSelect={async (details) => {
			if (details.value === 'export_json') {
				const json = JSON.stringify(await editor().project.to_json());
				const blob = new Blob([json], { type: 'application/json' });
				download_blob(blob, `${editor().project.name}.json`);
			}
			if (details.value === 'import_save') ui.open('save');
			if (details.value === 'open_mod') ui.open('mod');
			if (details.value === 'system_forge') ui.open('system');
		}}
	>
		<Menu.Trigger
			class="btn btn-sm text-sm font-medium px-1.5 md:px-2.5 hover:preset-tonal"
		>
			{t('Project')}
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner class="z-10!">
				<Menu.Content
					class="bg-surface-50-950 border-surface-200-800 shadow-xl"
				>
					{@render menu_item_command(
						'new',
						'New...',
						'show-modal',
						ID.new_project_dialog,
					)}
					<Menu
						onSelect={(details) => {
							const listing = editor().projects.find(
								(listing) => listing.name === details.value,
							);
							if (!listing)
								throw new Error('menu selection is missing in projects');
							editor().open_project(listing);
						}}
						positioning={{ offset: { mainAxis: 8, crossAxis: -8 } }}
					>
						<Menu.TriggerItem value="open">
							<Menu.ItemText>{t('Open')}</Menu.ItemText>
							<Menu.ItemIndicator>
								<Icons.ChevronRight class="size-4" />
							</Menu.ItemIndicator>
							<Portal>
								<Menu.Positioner class="z-10!">
									<Menu.Content
										class="bg-surface-50-950 border-surface-200-800 shadow-xl"
									>
										{#each editor().projects as project (project.name)}
											<Menu.Item value={project.name}>
												<Menu.ItemText>{project.name}</Menu.ItemText>
											</Menu.Item>
										{/each}
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.TriggerItem>
					</Menu>
					<Menu.Separator class="border-surface-300-700" />
					{@render menu_item_command(
						'import',
						'Import...',
						'show-modal',
						ID.import_project_dialog,
					)}
					<Menu.Item value="open_mod">
						<Menu.ItemText>{t('Open mod (.zip)...')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="import_save">
						<Menu.ItemText>{t('Import from Stellaris save...')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="system_forge">
						<Menu.ItemText>{t('System Forge...')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="export_json">
						<Menu.ItemText>{t('Export JSON')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Separator class="border-surface-300-700" />
					<Menu.ItemGroup>
						<Menu.ItemGroupLabel class="text-surface-800-200">
							{editor().project.name}
						</Menu.ItemGroupLabel>
						{@render menu_item_command(
							'clone',
							'Clone...',
							'show-modal',
							ID.clone_project_dialog,
						)}
						{@render menu_item_command(
							'rename',
							'Rename...',
							'show-modal',
							ID.rename_project_dialog,
						)}
						{@render menu_item_command(
							'delete',
							'Delete...',
							'show-modal',
							ID.delete_project_dialog,
						)}
					</Menu.ItemGroup>
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu>
	<Menu onSelect={on_edit_menu_select}>
		<Menu.Trigger
			class="btn btn-sm text-sm font-medium px-1.5 md:px-2.5 hover:preset-tonal"
		>
			{t('Edit')}
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner class="z-10!">
				<Menu.Content
					class="bg-surface-50-950 border-surface-200-800 shadow-xl"
				>
					<Menu.Item
						value="undo"
						closeOnSelect={false}
						disabled={!editor().can_undo}
					>
						<Menu.ItemText>{t('Undo')}</Menu.ItemText>
						<kbd class="bg-surface-200-800 rounded-base p-1">ctrl+z</kbd>
					</Menu.Item>
					<Menu.Item
						value="redo"
						closeOnSelect={false}
						disabled={!editor().can_redo}
					>
						<Menu.ItemText>{t('Redo')}</Menu.ItemText>
						<kbd class="bg-surface-200-800 rounded-base p-1">ctrl+y</kbd>
					</Menu.Item>
					<Menu.Separator class="border-surface-300-700" />
					{@render menu_item_command(
						'upload',
						'Upload Image...',
						'show-modal',
						ID.upload_image_dialog,
					)}
					<Menu.Item value="clear">
						<Menu.ItemText>{t('Clear Canvas')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Separator class="border-surface-300-700" />
					<Menu.OptionItem
						type="checkbox"
						value="snap_to_grid"
						closeOnSelect={false}
						checked={editor().project.grid_config.snap}
						onCheckedChange={(checked) => {
							editor().project = new Project({
								...editor().project,
								grid_config: new GridConfig({
									...editor().project.grid_config,
									snap: checked,
								}),
							});
						}}
					>
						<Menu.ItemText>{t('Snap to Grid')}</Menu.ItemText>
						<Menu.ItemIndicator class="hidden data-[state=checked]:block ms-2">
							<Icons.Check class="size-4" />
						</Menu.ItemIndicator>
					</Menu.OptionItem>
					{@render menu_item_command(
						'configure_grid',
						'Configure Grid...',
						'show-modal',
						ID.configure_grid_dialog,
					)}
					<Menu.Separator class="border-surface-300-700" />
					<Menu.OptionItem
						type="checkbox"
						value="symmetry"
						closeOnSelect={false}
						checked={editor().project.symmetry_config.enabled}
						onCheckedChange={(checked) => {
							editor().project = new Project({
								...editor().project,
								symmetry_config: new SymmetryConfig({
									...editor().project.symmetry_config,
									enabled: checked,
								}),
							});
						}}
					>
						<Menu.ItemText>{t('Symmetry')}</Menu.ItemText>
						<Menu.ItemIndicator class="hidden data-[state=checked]:block ms-2">
							<Icons.Check class="size-4" />
						</Menu.ItemIndicator>
					</Menu.OptionItem>
					{@render menu_item_command(
						'configure_symmetry',
						'Configure Symmetry...',
						'show-modal',
						ID.configure_symmetry_dialog,
					)}
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu>
	<Menu>
		<Menu.Trigger
			class="btn btn-sm text-sm font-medium px-1.5 md:px-2.5 hover:preset-tonal"
		>
			{t('View')}
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner class="z-10!">
				<Menu.Content
					class="bg-surface-50-950 border-surface-200-800 shadow-xl"
				>
					<Menu.OptionItem
						type="checkbox"
						value="advanced_mode"
						closeOnSelect={false}
						checked={ui.advanced}
						onCheckedChange={() => ui.toggle_advanced()}
					>
						<Menu.ItemText>{t('Advanced mode')}</Menu.ItemText>
						<Menu.ItemIndicator class="hidden data-[state=checked]:block ms-2">
							<Icons.Check class="size-4" />
						</Menu.ItemIndicator>
					</Menu.OptionItem>
					<Menu.Separator class="border-surface-300-700" />
					{@render menu_item_command(
						'reset',
						'Reset Camera',
						CUSTOM_COMMAND.reset_zoom,
						ID.canvas,
					)}
					<Menu positioning={{ offset: { mainAxis: 8, crossAxis: -8 } }}>
						<Menu.TriggerItem value="set_zoom">
							<Menu.ItemText>{t('Set Zoom')}</Menu.ItemText>
							<Menu.ItemIndicator>
								<Icons.ChevronRight class="size-4" />
							</Menu.ItemIndicator>
							<Portal>
								<Menu.Positioner class="z-10!">
									<Menu.Content
										class="bg-surface-50-950 border-surface-200-800 shadow-xl"
									>
										{@render menu_item_command(
											'50%',
											'50%',
											CUSTOM_COMMAND.set_zoom_050,
											ID.canvas,
										)}
										{@render menu_item_command(
											'75%',
											'75%',
											CUSTOM_COMMAND.set_zoom_075,
											ID.canvas,
										)}
										{@render menu_item_command(
											'100%',
											'100%',
											CUSTOM_COMMAND.set_zoom_100,
											ID.canvas,
										)}
										{@render menu_item_command(
											'150%',
											'150%',
											CUSTOM_COMMAND.set_zoom_150,
											ID.canvas,
										)}
										{@render menu_item_command(
											'200%',
											'200%',
											CUSTOM_COMMAND.set_zoom_200,
											ID.canvas,
										)}
										{@render menu_item_command(
											'400%',
											'400%',
											CUSTOM_COMMAND.set_zoom_400,
											ID.canvas,
										)}
										{@render menu_item_command(
											'800%',
											'800%',
											CUSTOM_COMMAND.set_zoom_800,
											ID.canvas,
										)}
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.TriggerItem>
					</Menu>
					<Menu.Separator class="border-surface-300-700" />
					<Menu positioning={{ offset: { mainAxis: 8, crossAxis: -8 } }}>
						<Menu.TriggerItem value="set_canvas_opacity">
							<Menu.ItemText>
								{t('Canvas Opacity')}: {editor().current_step_canvas_opacity *
									100}%
							</Menu.ItemText>
							<Menu.ItemIndicator>
								<Icons.ChevronRight class="size-4" />
							</Menu.ItemIndicator>
							<Portal>
								<Menu.Positioner class="z-10!">
									<Menu.Content
										class="bg-surface-50-950 border-surface-200-800 shadow-xl"
									>
										{@render menu_item_canvas_opacity(0)}
										{@render menu_item_canvas_opacity(0.1)}
										{@render menu_item_canvas_opacity(0.2)}
										{@render menu_item_canvas_opacity(0.3)}
										{@render menu_item_canvas_opacity(0.4)}
										{@render menu_item_canvas_opacity(0.5)}
										{@render menu_item_canvas_opacity(0.6)}
										{@render menu_item_canvas_opacity(0.7)}
										{@render menu_item_canvas_opacity(0.8)}
										{@render menu_item_canvas_opacity(0.9)}
										{@render menu_item_canvas_opacity(1.0)}
									</Menu.Content>
								</Menu.Positioner>
							</Portal>
						</Menu.TriggerItem>
					</Menu>
					<Menu.Separator class="border-surface-300-700" />
					<Menu.OptionItem
						type="checkbox"
						value="show_center_mark"
						closeOnSelect={false}
						checked={editor().view_settings.show_center_mark}
						onCheckedChange={(checked) => {
							editor().update_view_settings({ show_center_mark: checked });
						}}
					>
						<Menu.ItemText>{t('Show Center Mark')}</Menu.ItemText>
						<Menu.ItemIndicator class="hidden data-[state=checked]:block ms-2">
							<Icons.Check class="size-4" />
						</Menu.ItemIndicator>
					</Menu.OptionItem>
					<Menu.OptionItem
						type="checkbox"
						value="show_map_limit"
						closeOnSelect={false}
						checked={editor().view_settings.show_map_limit}
						onCheckedChange={(checked) => {
							editor().update_view_settings({ show_map_limit: checked });
						}}
					>
						<Menu.ItemText>{t('Show Map Limit')}</Menu.ItemText>
						<Menu.ItemIndicator class="hidden data-[state=checked]:block ms-2">
							<Icons.Check class="size-4" />
						</Menu.ItemIndicator>
					</Menu.OptionItem>
					<Menu.OptionItem
						type="checkbox"
						value="show_l_cluster"
						closeOnSelect={false}
						checked={editor().view_settings.show_l_cluster}
						onCheckedChange={(checked) => {
							editor().update_view_settings({ show_l_cluster: checked });
						}}
					>
						<Menu.ItemText>{t('Show L-Cluster')}</Menu.ItemText>
						<Menu.ItemIndicator class="hidden data-[state=checked]:block ms-2">
							<Icons.Check class="size-4" />
						</Menu.ItemIndicator>
					</Menu.OptionItem>
					<Menu.Separator class="border-surface-300-700" />
					<Menu.ItemGroup>
						<Menu.ItemGroupLabel class="text-surface-800-200">
							{t('Gigastructural Engineering')}
						</Menu.ItemGroupLabel>
						<Menu.OptionItem
							type="checkbox"
							value="show_giga_core"
							closeOnSelect={false}
							checked={editor().view_settings.show_giga_core}
							onCheckedChange={(checked) => {
								editor().update_view_settings({ show_giga_core: checked });
							}}
						>
							<Menu.ItemText>{t('Show Random Core')}</Menu.ItemText>
							<Menu.ItemIndicator
								class="hidden data-[state=checked]:block ms-2"
							>
								<Icons.Check class="size-4" />
							</Menu.ItemIndicator>
						</Menu.OptionItem>
						<Menu.OptionItem
							type="checkbox"
							value="show_giga_aeternum"
							closeOnSelect={false}
							checked={editor().view_settings.show_giga_aeternum}
							onCheckedChange={(checked) => {
								editor().update_view_settings({ show_giga_aeternum: checked });
							}}
						>
							<Menu.ItemText>{t('Show Aeternum')}</Menu.ItemText>
							<Menu.ItemIndicator
								class="hidden data-[state=checked]:block ms-2"
							>
								<Icons.Check class="size-4" />
							</Menu.ItemIndicator>
						</Menu.OptionItem>
					</Menu.ItemGroup>
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu>
	<div class="grow flex justify-center">
		<nav
			class="hidden md:flex items-center gap-1 p-1 rounded-lg bg-surface-100-900 border border-surface-200-800"
			aria-label={t('Steps')}
		>
			{#each steps as step, i (step.id)}
				{#if i > 0}
					<span
						class={[
							'w-5 h-px transition-colors duration-500',
							i <= step_index ? 'bg-primary-500' : 'bg-surface-300-700',
						]}
					></span>
				{/if}
				<button
					type="button"
					class={[
						'flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-medium transition-all duration-200',
						step.id === editor().step ?
							'bg-primary-500 text-white shadow-[0_0_18px_-4px_rgba(229,50,45,0.9)]'
						: i < step_index ? 'text-surface-950-50 hover:bg-surface-200-800'
						: 'text-surface-600-400 hover:bg-surface-200-800',
					]}
					onclick={() => editor().set_step(step.id)}
				>
					<span
						class={[
							'grid place-items-center size-5 rounded-full text-[0.65rem] font-mono border',
							step.id === editor().step ? 'border-white/60'
							: i < step_index ? 'border-primary-500 text-primary-500'
							: 'border-surface-400-600',
						]}
					>
						{#if i < step_index}<Icons.Check class="size-3" />{:else}{i +
								1}{/if}
					</span>
					{t(step.name)}
				</button>
			{/each}
		</nav>
	</div>
	<button
		type="button"
		class={[
			'items-center gap-2 h-9 ps-3 pe-2 rounded-md border border-surface-200-800 bg-surface-100-900 text-sm text-surface-600-400 hover:border-primary-500/60 hover:text-surface-950-50 transition-colors',
			ui.advanced ? 'hidden lg:flex' : 'hidden',
		]}
		onclick={() => ui.open('command')}
	>
		<Icons.Terminal class="size-4" />
		{t('Type a command')}
		<span class="sf-kbd ms-3">Ctrl K</span>
	</button>
	<button
		type="button"
		class={['sf-icon-btn max-md:hidden!', ui.advanced && 'lg:hidden']}
		title="{t('Command Bar')} (Ctrl K)"
		onclick={() => ui.open('command')}
	>
		<Icons.Terminal class="size-4" />
	</button>
	<button
		type="button"
		class="btn btn-sm preset-filled-primary-500 sf-btn-glow ms-1"
		onclick={() => ui.open('export')}
	>
		<Icons.Package class="size-4" />
		<span class="hidden sm:inline">{t('Export')}</span>
	</button>
	<div class="hidden md:block h-6 w-px bg-surface-200-800 mx-1"></div>
	<div
		class="flex items-center rounded-md border border-surface-200-800 overflow-hidden text-xs font-mono"
		role="group"
		aria-label={t('Language')}
	>
		<button
			type="button"
			class={[
				'px-2 py-1.5 transition-colors',
				i18n.locale === 'en' ?
					'bg-primary-500 text-white'
				:	'text-surface-600-400 hover:bg-surface-200-800',
			]}
			onclick={() => set_locale('en')}
		>
			EN
		</button>
		<button
			type="button"
			class={[
				'px-2 py-1.5 transition-colors',
				i18n.locale === 'pt' ?
					'bg-primary-500 text-white'
				:	'text-surface-600-400 hover:bg-surface-200-800',
			]}
			onclick={() => set_locale('pt')}
		>
			PT
		</button>
	</div>
	<span class="hidden md:contents"><ModeToggle /></span>
	<Menu
		onSelect={(details) => {
			if (details.value === 'shortcuts') ui.open('shortcuts');
			if (details.value === 'guide') ui.open('guide');
			if (details.value === 'credits') void goto(resolve('/credits'));
			if (details.value === 'forum') void goto(resolve('/forum'));
			if (details.value === 'home') void goto(resolve('/'));
		}}
	>
		<Menu.Trigger class="sf-icon-btn" aria-label={t('Help')}>
			<Icons.CircleHelp class="size-4" />
		</Menu.Trigger>
		<Portal>
			<Menu.Positioner class="z-30!">
				<Menu.Content
					class="bg-surface-50-950 border-surface-200-800 shadow-xl min-w-56"
				>
					<Menu.Item value="forum">
						<Icons.BookOpen class="size-4" />
						<Menu.ItemText>{t('Guides and tutorials')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="guide">
						<Icons.Download class="size-4" />
						<Menu.ItemText>{t('How to Install')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="shortcuts">
						<Icons.Keyboard class="size-4" />
						<Menu.ItemText>{t('Keyboard Shortcuts')}</Menu.ItemText>
						<span class="sf-kbd">?</span>
					</Menu.Item>
					<Menu.Item value="credits">
						<Icons.Heart class="size-4" />
						<Menu.ItemText>{t('Credits')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Item value="home">
						<Icons.House class="size-4" />
						<Menu.ItemText>{t('Home page')}</Menu.ItemText>
					</Menu.Item>
					<Menu.Separator class="border-surface-200-800" />
					<Menu.ItemGroup>
						<Menu.ItemGroupLabel class="sf-tag">
							{t('Community')}
						</Menu.ItemGroupLabel>
						{@render menu_item_link(
							'discord',
							'Discord: Agriche Community',
							LINKS.discord,
						)}
						{@render menu_item_link(
							'stellar_forge_steam',
							'Stellar Forge (Steam Workshop)',
							LINKS.steam,
						)}
						{@render menu_item_link('github', 'GitHub', LINKS.github)}
						{@render menu_item_link('nexus', 'Agriche Nexus', LINKS.nexus)}
						{@render menu_item_link(
							'steam',
							'Paint a Galaxy (Steam Workshop)',
							LINKS.workshop,
						)}
					</Menu.ItemGroup>
				</Menu.Content>
			</Menu.Positioner>
		</Portal>
	</Menu>
</header>
