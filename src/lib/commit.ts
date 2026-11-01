import type { Editor } from './editor.svelte';
import { placement } from './placement.svelte';
import { generate_all, set_canvas } from './forge';

export async function commit_placement(
	editor: Editor,
	options: { generate?: boolean } = {},
) {
	if (!placement.active || placement.mask == null) return;
	const source = placement.source;
	const blob = await placement.render_result(editor.project.canvas);
	placement.cancel();
	await set_canvas(editor, blob);
	if (options.generate) {
		if (source?.kind === 'galaxy') {
			editor.update_generator_settings({ number_of_systems: source.systems });
		}
		await generate_all(
			editor,
			source?.kind === 'galaxy' ? source.recipe.seed : undefined,
		);
	}
}
