<script lang="ts">
	import { get_editor } from '$lib/editor.svelte';
	import { tool_pairs, type ToolSettingId } from '$lib/models/tool';
	import { ui, LAYERS } from '$lib/ui.svelte';
	import { placement } from '$lib/placement.svelte';
	import { commit_placement } from '$lib/commit';
	import { generate_all } from '$lib/forge';
	import { toaster } from '$lib/toaster';
	import { t } from '$lib/i18n/index.svelte';
	import type { Step } from '$lib/models/step';

	const editor = get_editor();

	function is_typing() {
		const element = document.activeElement;
		if (element == null) return false;
		if (element instanceof HTMLElement && element.isContentEditable)
			return true;
		return (
			'selectionStart' in element &&
			(element as HTMLInputElement).selectionStart != null
		);
	}

	function select_pair(index: number) {
		const pairs = tool_pairs.filter((pair) => pair.step === editor().step);
		const pair = pairs[index];
		if (!pair) return;
		editor().primary_tool_id = pair.primary.id;
		editor().secondary_tool_id = pair.secondary.id;
	}

	function adjust_size(delta: number) {
		const tool = editor().primary_tool;
		const setting: ToolSettingId | null =
			'size' in tool.default_settings ? 'size'
			: 'bulk_brush_size' in tool.default_settings ? 'bulk_brush_size'
			: null;
		if (setting == null) return;
		const settings = editor().tool_settings[tool.id];
		const value = Math.min(Math.max(settings[setting] + delta, 1), 500);
		editor().update_tool_settings(tool.id, { ...settings, [setting]: value });
		toaster.create({
			type: 'info',
			title: t(tool.size_label ?? 'Size'),
			description: String(value),
			duration: 900,
		});
	}

	function onkeydown(e: KeyboardEvent) {
		if (e.key === ' ' && !is_typing()) {
			ui.space_held = true;
			if (e.target === document.body) e.preventDefault();
		}
		const ctrl = e.ctrlKey || e.metaKey;
		if (ctrl && (e.key === 'k' || e.key === 'K')) {
			e.preventDefault();
			ui.open(ui.panel === 'command' ? 'none' : 'command');
			return;
		}
		if (e.key === 'Escape') {
			if (placement.active) {
				placement.cancel();
				e.preventDefault();
			}
			return;
		}
		if (ui.panel !== 'none') return;
		if (is_typing()) return;
		const key = e.key;
		if (ctrl) {
			if ((key === 'z' || key === 'я') && !e.shiftKey && editor().can_undo) {
				e.preventDefault();
				editor().undo();
			} else if (
				((key === 'Z' || key === 'Я') && e.shiftKey) ||
				key === 'y' ||
				key === 'н'
			) {
				if (editor().can_redo) {
					e.preventDefault();
					editor().redo();
				}
			} else if (key === 'e' || key === 'E') {
				e.preventDefault();
				ui.open('export');
			} else if (key === 'g' || key === 'G') {
				e.preventDefault();
				generate_all(editor());
			}
			return;
		}
		if (e.altKey) {
			const steps: Step[] = ['paint', 'generate', 'tweak'];
			const step_index = ['Digit1', 'Digit2', 'Digit3'].indexOf(e.code);
			if (step_index >= 0) {
				e.preventDefault();
				editor().set_step(steps[step_index]!);
			}
			if (e.code === 'KeyL') {
				e.preventDefault();
				ui.toggle_layers_open();
			}
			if (e.code === 'KeyS') {
				e.preventDefault();
				ui.open('system');
			}
			return;
		}
		if (e.shiftKey && /^Digit[1-8]$/.test(e.code)) {
			const layer = LAYERS[Number(e.code.slice(5)) - 1];
			if (layer) {
				e.preventDefault();
				ui.toggle_visible(layer.id);
			}
			return;
		}
		if (placement.active && key === 'Enter') {
			e.preventDefault();
			commit_placement(editor());
			return;
		}
		if (key === '?') {
			ui.open('shortcuts');
			return;
		}
		if (key === '/') {
			e.preventDefault();
			ui.open('command');
			return;
		}
		if (/^[1-9]$/.test(key)) {
			select_pair(Number(key) - 1);
			return;
		}
		if (key === '[') return adjust_size(-10);
		if (key === ']') return adjust_size(10);
		if (key === '0') return ui.camera.reset();
		if (key === '+' || key === '=') return ui.camera.scale_by(1.25);
		if (key === '-' || key === '_') return ui.camera.scale_by(0.8);
		if (key === 'x' || key === 'X') {
			const primary = editor().secondary_tool_id;
			editor().secondary_tool_id = editor().primary_tool_id;
			editor().primary_tool_id = primary;
			return;
		}
		if (key === 'T' || key === 't') {
			if (editor().step !== 'paint') editor().set_step('paint');
			requestAnimationFrame(() => {
				const input = document.getElementById('sf-text-input');
				input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
				input?.focus();
			});
			e.preventDefault();
			return;
		}
		const pair = tool_pairs.find(
			(pair) =>
				pair.step === editor().step &&
				pair.key.toLowerCase() === key.toLowerCase(),
		);
		if (pair && !['w', 'a', 's', 'd'].includes(key.toLowerCase())) {
			editor().primary_tool_id = pair.primary.id;
			editor().secondary_tool_id = pair.secondary.id;
		}
	}

	function onkeyup(e: KeyboardEvent) {
		if (e.key === ' ') ui.space_held = false;
	}
</script>

<svelte:window
	{onkeydown}
	{onkeyup}
	onblur={() => {
		ui.space_held = false;
	}}
/>
