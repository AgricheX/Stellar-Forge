<script lang="ts">
	import EditorProvider from '$lib/editor_provider.svelte';
	import { Editor } from '$lib/editor.svelte';
	import { Toast } from '@skeletonlabs/skeleton-svelte';
	import { toaster } from '$lib/toaster';
	import Header from './header.svelte';
	import './layout.css';
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
	import CreditsDialog from './panels/credits_dialog.svelte';
	import RandomDialog from './panels/random_dialog.svelte';
	import Brand from '$lib/components/brand.svelte';
	import { t } from '$lib/i18n/index.svelte';

	let { children } = $props();

	const editor_promise = Editor.load();

	function on_error(event: Event) {
		const error_event = event as ErrorEvent;
		toaster.error({
			title: t('Unexpected Error'),
			description: error_event.error?.message ?? error_event.message,
		});
	}

	function on_unhandledrejection(event: PromiseRejectionEvent) {
		toaster.error({
			title: t('Unexpected Error'),
			description:
				event.reason instanceof Error ?
					event.reason.message
				:	String(event.reason),
		});
	}
</script>

<svelte:head>
	<title>Stellar Forge · {t('Stellaris galaxy maker')}</title>
</svelte:head>

<svelte:window
	onerror={on_error}
	onunhandledrejection={on_unhandledrejection}
/>

<div class="w-full h-full flex flex-col overflow-hidden">
	<svelte:boundary>
		{#snippet pending()}
			<div class="grid place-items-center h-full">
				<div class="flex flex-col items-center gap-3 sf-fade-in">
					<Brand />
					<div class="h-0.5 w-40 overflow-hidden rounded bg-surface-200-800">
						<div class="h-full w-1/3 bg-primary-500 loading-bar"></div>
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
			<CreditsDialog />
			<RandomDialog />
			<Toast.Group {toaster}>
				{#snippet children(toast)}
					<Toast {toast}>
						<Toast.Message>
							<Toast.Title>{toast.title}</Toast.Title>
							<Toast.Description>{toast.description}</Toast.Description>
						</Toast.Message>
						<Toast.CloseTrigger />
					</Toast>
				{/snippet}
			</Toast.Group>
			{@render children()}
		</EditorProvider>
	</svelte:boundary>
</div>

<style>
	.loading-bar {
		animation: loading 1.1s ease-in-out infinite;
	}
	@keyframes loading {
		from {
			transform: translateX(-100%);
		}
		to {
			transform: translateX(300%);
		}
	}
</style>
