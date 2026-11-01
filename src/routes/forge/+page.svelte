<script lang="ts">
	import EditorProvider from '$lib/editor_provider.svelte';
	import { Editor } from '$lib/editor.svelte';
	import Brand from '$lib/components/brand.svelte';
	import Header from './header.svelte';
	import NewProjectDialog from './dialogs/new_project_dialog.svelte';
	import DeleteProjectDialog from './dialogs/delete_project_dialog.svelte';
	import RenameProjectDialog from './dialogs/rename_project_dialog.svelte';
	import UploadImageDialog from './dialogs/upload_image_dialog.svelte';
	import CloneProjectDialog from './dialogs/clone_project_dialog.svelte';
	import ConfigureGridDialog from './dialogs/configure_grid_dialog.svelte';
	import ConfigureSymmetryDialog from './dialogs/configure_symmetry_dialog.svelte';
	import ImportProjectDialog from './dialogs/import_project_dialog.svelte';
	import Keyboard from './keyboard.svelte';
	import CommandBar from './panels/command_bar.svelte';
	import ShortcutsDialog from './panels/shortcuts_dialog.svelte';
	import ExportDialog from './panels/export_dialog.svelte';
	import GuideDialog from './panels/guide_dialog.svelte';
	import RandomDialog from './panels/random_dialog.svelte';
	import SystemForge from './panels/system_forge.svelte';
	import SaveImportDialog from './panels/save_import_dialog.svelte';
	import OpenModDialog from './panels/open_mod_dialog.svelte';
	import EditorView from './editor.svelte';
	import UrlActions from './url_actions.svelte';
	import { t } from '$lib/i18n/index.svelte';

	const editor_promise = Editor.load();
</script>

<svelte:head>
	<title>Stellar Forge · {t('Forge')}</title>
</svelte:head>

<div class="w-full h-full flex flex-col overflow-hidden">
	<svelte:boundary>
		{#snippet pending()}
			<div class="grid place-items-center h-full">
				<div class="flex flex-col items-center gap-3 sf-fade-in">
					<Brand />
					<div class="h-0.5 w-40 overflow-hidden rounded bg-surface-200-800">
						<div class="h-full w-1/3 bg-primary-500 sf-loading-bar"></div>
					</div>
				</div>
			</div>
		{/snippet}

		<EditorProvider editor={await editor_promise}>
			<Header />
			<NewProjectDialog />
			<DeleteProjectDialog />
			<RenameProjectDialog />
			<CloneProjectDialog />
			<ImportProjectDialog />
			<UploadImageDialog />
			<ConfigureGridDialog />
			<ConfigureSymmetryDialog />
			<Keyboard />
			<CommandBar />
			<ShortcutsDialog />
			<ExportDialog />
			<GuideDialog />
			<RandomDialog />
			<SystemForge />
			<SaveImportDialog />
			<OpenModDialog />
			<EditorView />
			<UrlActions />
		</EditorProvider>
	</svelte:boundary>
</div>
