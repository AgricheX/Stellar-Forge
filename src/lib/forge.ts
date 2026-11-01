import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import type { Editor } from './editor.svelte';
import {
	random_recipe,
	render_galaxy_mask,
	type GalaxyRecipe,
	type RandomKind,
} from './galaxy';
import { Action } from './models/action';
import { with_seeded_random } from './random';
import { make_blank_image } from './canvas';

async function base_canvas(editor: Editor, replace: boolean) {
	const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
	const ctx = canvas.getContext('2d')!;
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	if (!replace) {
		ctx.filter = 'grayscale(1)';
		ctx.drawImage(
			await createImageBitmap(editor.project.canvas),
			0,
			0,
			CANVAS_WIDTH,
			CANVAS_HEIGHT,
		);
		ctx.filter = 'none';
	}
	return { canvas, ctx };
}

export async function set_canvas(editor: Editor, blob: Blob) {
	await editor.apply_actions([
		Action.SetCanvasAction.make({
			old_value: editor.project.canvas,
			new_value: blob,
		}),
	]);
}

export async function paint_galaxy(
	editor: Editor,
	recipe: GalaxyRecipe,
	add = false,
) {
	const { canvas, ctx } = await base_canvas(editor, !add);
	ctx.drawImage(render_galaxy_mask(recipe), 0, 0);
	await set_canvas(
		editor,
		await canvas.convertToBlob({ type: 'image/jpeg', quality: 1 }),
	);
}

export async function paint_path(
	editor: Editor,
	path: string,
	options: { erase: boolean; strength: number; blur: number },
) {
	const { canvas, ctx } = await base_canvas(editor, false);
	ctx.globalAlpha = options.strength;
	if (options.blur > 0) ctx.filter = `blur(${options.blur}px)`;
	ctx.fillStyle = options.erase ? '#000000' : '#ffffff';
	ctx.fill(new Path2D(path));
	await set_canvas(
		editor,
		await canvas.convertToBlob({ type: 'image/jpeg', quality: 1 }),
	);
}

export async function clear_canvas(editor: Editor) {
	await set_canvas(editor, await make_blank_image());
}

export async function generate_all(editor: Editor, seed?: string) {
	const run = () =>
		editor.generate({
			solar_systems: true,
			hyperlanes: true,
			spawns: true,
			nebulas: true,
		});
	if (seed) await with_seeded_random(seed, run);
	else await run();
	if (editor.step === 'paint') editor.set_step('generate');
}

export async function forge_random(
	editor: Editor,
	seed: string,
	options: { keep_systems?: number; kind?: RandomKind } = {},
) {
	const { recipe, systems } = random_recipe(seed, options.kind);
	await paint_galaxy(editor, recipe);
	editor.update_generator_settings({
		number_of_systems: options.keep_systems ?? systems,
	});
	await generate_all(editor, seed);
	return { recipe, systems: options.keep_systems ?? systems };
}
