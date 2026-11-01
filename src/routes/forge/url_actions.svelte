<script lang="ts">
	import { page } from '$app/state';
	import { goto } from '$app/navigation';
	import { resolve } from '$app/paths';
	import { untrack } from 'svelte';
	import { get_editor } from '$lib/editor.svelte';
	import { ui } from '$lib/ui.svelte';
	import { hash_query } from '$lib/links';

	const editor = get_editor();
	const PANELS = [
		'shortcuts',
		'command',
		'export',
		'guide',
		'random',
		'system',
		'save',
		'mod',
	] as const;
	const STEPS = ['paint', 'generate', 'tweak'] as const;

	$effect(() => {
		const params = hash_query(page.url);
		const panel = params.get('panel');
		const step = params.get('step');
		if (!panel && !step) return;
		untrack(() => {
			const found_step = STEPS.find((s) => s === step);
			if (found_step) editor().set_step(found_step);
			const found_panel = PANELS.find((p) => p === panel);
			if (found_panel) ui.open(found_panel);
			void goto(resolve('/forge'), {
				replaceState: true,
				keepFocus: true,
				noScroll: true,
			});
		});
	});
</script>
