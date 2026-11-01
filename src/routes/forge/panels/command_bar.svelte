<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { COMMAND_EXAMPLES, run_command } from '$lib/command';
	import {
		clear_canvas,
		forge_random,
		generate_all,
		paint_galaxy,
		paint_path,
	} from '$lib/forge';
	import { placement } from '$lib/placement.svelte';
	import { toaster } from '$lib/toaster';
	import { fly, fade } from 'svelte/transition';

	const editor = get_editor();
	const HISTORY_KEY = 'stellar-forge-command-history';

	let value = $state('');
	let error = $state('');
	let running = $state(false);
	let selected = $state(-1);
	let history = $state<string[]>(
		JSON.parse(localStorage.getItem(HISTORY_KEY) ?? '[]'),
	);
	let input = $state<HTMLInputElement>();

	const suggestions = $derived.by(() => {
		const all = [
			...history,
			...COMMAND_EXAMPLES.filter((c) => !history.includes(c)),
		];
		const q = value.trim().toLowerCase();
		if (q === '') return all.slice(0, 9);
		return all.filter((c) => c.toLowerCase().includes(q)).slice(0, 9);
	});

	$effect(() => {
		if (ui.panel === 'command') {
			error = '';
			selected = -1;
			requestAnimationFrame(() => input?.focus());
		}
	});

	function remember(command: string) {
		history = [command, ...history.filter((h) => h !== command)].slice(0, 12);
		localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
	}

	async function execute(command: string) {
		const result = run_command(command);
		if (result.type === 'error') {
			error = t(result.message, result.params);
			return;
		}
		if (result.type === 'help') {
			ui.open('shortcuts');
			return;
		}
		running = true;
		error = '';
		try {
			if (editor().step !== 'paint' && result.type !== 'generate') {
				editor().set_step('paint');
			}
			if (result.stars != null) {
				editor().update_generator_settings({ number_of_systems: result.stars });
			}
			switch (result.type) {
				case 'galaxy':
					await paint_galaxy(editor(), result.recipe, result.add);
					break;
				case 'preset':
					await paint_galaxy(
						editor(),
						{ ...result.preset.recipe, seed: result.preset.id },
						result.add,
					);
					if (result.stars == null) {
						editor().update_generator_settings({
							number_of_systems: result.preset.systems,
						});
					}
					break;
				case 'random':
					await forge_random(
						editor(),
						result.seed,
						result.stars != null ? { keep_systems: result.stars } : {},
					);
					toaster.success({
						title: t('Random Galaxy'),
						description: `${t('Seed')}: ${result.seed}`,
					});
					break;
				case 'text':
					await placement.start_text({
						text: result.text,
						font: result.font ?? 'Inter',
						bold: result.bold ?? true,
						outline: false,
						outline_width: 18,
						letter_spacing: 0.05,
						line_height: 1.05,
					});
					break;
				case 'shape':
					await paint_path(editor(), result.path, result);
					break;
				case 'clear':
					await clear_canvas(editor());
					break;
				case 'generate':
					break;
			}
			if (
				result.type !== 'random' &&
				(result.generate || result.type === 'generate')
			) {
				await generate_all(editor());
			}
			remember(command.trim());
			value = '';
			ui.close();
		} catch (e) {
			error = e instanceof Error ? e.message : String(e);
		} finally {
			running = false;
		}
	}
</script>

{#if ui.panel === 'command'}
	<div
		class="fixed inset-0 z-50 bg-black/55 backdrop-blur-[3px]"
		transition:fade={{ duration: 120 }}
		onclick={() => ui.close()}
		role="presentation"
	></div>
	<div
		class="fixed z-50 left-1/2 top-[12vh] -translate-x-1/2 w-[min(42rem,calc(100%-2rem))] sf-glass overflow-hidden"
		transition:fly={{ y: -10, duration: 180 }}
		role="dialog"
		aria-label={t('Command Bar')}
	>
		<form
			class="flex items-center gap-3 px-4 border-b border-surface-200-800"
			onsubmit={(e) => {
				e.preventDefault();
				const command =
					selected >= 0 && suggestions[selected] ?
						suggestions[selected]!
					:	value;
				if (command.trim() !== '') execute(command);
			}}
		>
			<Icons.Terminal class="size-5 text-primary-500 shrink-0" />
			<input
				bind:this={input}
				bind:value
				class="grow bg-transparent border-0 focus:ring-0 py-4 font-mono text-[0.95rem] placeholder:text-surface-500"
				placeholder={t(
					'spiral arms=4 stars=900 · text "A" · preset milky way · random',
				)}
				spellcheck="false"
				autocomplete="off"
				onkeydown={(e) => {
					if (e.key === 'Escape') {
						e.preventDefault();
						ui.close();
					} else if (e.key === 'ArrowDown') {
						e.preventDefault();
						selected = Math.min(selected + 1, suggestions.length - 1);
					} else if (e.key === 'ArrowUp') {
						e.preventDefault();
						selected = Math.max(selected - 1, -1);
					} else if (e.key === 'Tab' && suggestions[Math.max(selected, 0)]) {
						e.preventDefault();
						value = suggestions[Math.max(selected, 0)]!;
						selected = -1;
					} else {
						selected = -1;
					}
				}}
			/>
			{#if running}
				<Icons.RotateCcw class="size-4 sf-spin text-surface-500" />
			{:else}
				<span class="sf-kbd">Enter</span>
			{/if}
		</form>
		{#if error}
			<div
				class="px-4 py-2 text-sm text-error-500 bg-error-500/10 border-b border-error-500/20"
			>
				{error}
			</div>
		{/if}
		<ul class="max-h-80 overflow-auto py-1">
			{#each suggestions as suggestion, i (suggestion)}
				<li>
					<button
						type="button"
						class={[
							'w-full flex items-center gap-3 px-4 py-2 text-left font-mono text-sm transition-colors',
							i === selected ?
								'bg-primary-500/15 text-surface-950-50'
							:	'text-surface-700-300 hover:bg-surface-200-800/60',
						]}
						onclick={() => {
							value = suggestion;
							input?.focus();
						}}
						ondblclick={() => execute(suggestion)}
					>
						<Icons.ChevronRight class="size-3.5 text-primary-500 shrink-0" />
						<span class="truncate">{suggestion}</span>
						{#if history.includes(suggestion)}
							<span class="ms-auto sf-tag">{t('recent')}</span>
						{/if}
					</button>
				</li>
			{/each}
		</ul>
		<footer
			class="flex flex-wrap gap-x-4 gap-y-1 px-4 py-2 border-t border-surface-200-800 text-[0.7rem] text-surface-500"
		>
			<span>
				<span class="sf-kbd">↑↓</span>
				{t('choose')}
			</span>
			<span>
				<span class="sf-kbd">Tab</span>
				{t('complete')}
			</span>
			<span>
				<span class="sf-kbd">Enter</span>
				{t('run')}
			</span>
			<span>
				{t(
					'Add stars=N to generate right away. Works in English and Portuguese.',
				)}
			</span>
		</footer>
	</div>
{/if}
