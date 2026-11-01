<script lang="ts">
	import { t } from '$lib/i18n/index.svelte';
	import Dialog from '$lib/components/dialog.svelte';
	import { ID } from '$lib/constants';
	import { get_editor } from '$lib/editor.svelte';
	import type { EventHandler } from 'svelte/elements';

	const editor = get_editor();
	const id = ID.delete_project_dialog;
	let dialog: Dialog;

	const onsubmit: EventHandler<SubmitEvent, HTMLFormElement> = (e) => {
		e.preventDefault();
		editor().delete_project();
		dialog.close();
	};
</script>

<Dialog {id} title={t('Delete Project')} bind:this={dialog}>
	<form class="flex flex-col gap-4" {onsubmit}>
		<p>{t('Are you sure? This cannot be undone.')}</p>
		{#if editor().projects.length === 1}
			<p>
				{t(
					'This is your only project. A new blank project will automatically be created.',
				)}
			</p>
		{/if}
		<div class="flex justify-end gap-2">
			<button
				class="btn preset-outlined-primary-500 w-auto"
				type="button"
				command="close"
				commandfor={id}
			>
				{t('Cancel')}
			</button>
			<button class="btn preset-filled-error-500 w-auto" type="submit">
				{t('Delete')}
			</button>
		</div>
	</form>
</Dialog>
