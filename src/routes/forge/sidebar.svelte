<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import type { Step } from '$lib/models/step';
	import type { Component } from 'svelte';
	import Generate from './steps/generate.svelte';
	import Paint from './steps/paint.svelte';
	import Tweak from './steps/tweak.svelte';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';

	const steps: {
		id: Step;
		name: string;
		description: string;
		content: Component;
	}[] = [
		{
			id: 'paint',
			name: 'Paint',
			content: Paint,
			description:
				'Paint where you want stars. The brighter you paint, the more stars spawn there. Use shapes, templates, text or emoji.',
		},
		{
			id: 'generate',
			name: 'Generate',
			content: Generate,
			description:
				'Turn your painting into star systems, hyperlanes, spawns and nebulas. Tweak the settings and generate again until you like it.',
		},
		{
			id: 'tweak',
			name: 'Tweak',
			content: Tweak,
			description:
				'Fine-tune by hand with the tools on the left, or right-click the map for more. When you are done, export your mod.',
		},
	];

	const editor = get_editor();
	const index = $derived(steps.findIndex((step) => step.id === editor().step));
	const current = $derived(steps[index] ?? steps[0]!);
	let scroller = $state<HTMLDivElement>();
	$effect(() => {
		void current.id;
		scroller?.scrollTo({ top: 0 });
	});
</script>

<aside
	class={[
		'md:w-[23rem] shrink-0 flex flex-col border-t md:border-t-0 md:border-s border-surface-200-800 bg-surface-50-950 min-h-0',
		ui.sheet_open && 'max-md:h-[42dvh]',
	]}
>
	<header
		class="px-4 md:px-5 pt-2.5 md:pt-4 pb-2.5 md:pb-3 border-b border-surface-200-800"
	>
		<button
			type="button"
			class="md:hidden w-full flex items-center gap-3 text-left"
			aria-expanded={ui.sheet_open}
			onclick={() => (ui.sheet_open = !ui.sheet_open)}
		>
			<span class="sf-tag shrink-0">{index + 1} / {steps.length}</span>
			<span class="font-bold grow truncate">{t(current.name)}</span>
			<Icons.ChevronUp
				class={[
					'size-5 text-surface-500 transition-transform',
					ui.sheet_open && 'rotate-180',
				]}
			/>
		</button>
		<div class="hidden md:block sf-tag">
			{t('Step')}
			{index + 1} / {steps.length}
		</div>
		{#key current.id}
			<h1
				class="hidden md:block text-xl font-bold tracking-tight mt-1 sf-fade-in"
			>
				{t(current.name)}
			</h1>
			<p
				class={[
					'text-sm text-surface-600-400 mt-1 leading-relaxed sf-fade-in',
					!ui.sheet_open && 'max-md:hidden',
				]}
			>
				{t(current.description)}
			</p>
		{/key}
		<div class="flex gap-1 mt-3">
			{#each steps as step, i (step.id)}
				<span
					class={[
						'h-1 grow rounded-full transition-all duration-500',
						i <= index ?
							'bg-primary-500 shadow-[0_0_8px_rgba(229,50,45,0.6)]'
						:	'bg-surface-200-800',
					]}
				></span>
			{/each}
		</div>
	</header>
	<div
		bind:this={scroller}
		class={[
			'grow overflow-auto px-4 md:px-5 py-4 flex flex-col gap-4 min-h-0',
			!ui.sheet_open && 'max-md:hidden',
		]}
	>
		{#key current.id}
			<div class="flex flex-col gap-4 sf-rise">
				<current.content />
			</div>
		{/key}
	</div>
	<footer
		class="flex justify-between gap-2 px-4 md:px-5 py-2 md:py-3 border-t border-surface-200-800 bg-surface-100-900/40"
	>
		<button
			class="btn preset-outlined-surface-500 ps-3"
			disabled={index === 0}
			onclick={() => {
				const step = steps[index - 1];
				if (step) editor().set_step(step.id);
			}}
		>
			<Icons.ArrowLeft size={18} />
			{t('Back')}
		</button>
		{#if index === steps.length - 1}
			<button
				class="btn preset-filled-primary-500 sf-btn-glow"
				onclick={() => ui.open('export')}
			>
				<Icons.Package size={18} />
				{t('Export Mod')}
			</button>
		{:else}
			<button
				class="btn preset-filled-primary-500 sf-btn-glow pe-3"
				onclick={() => {
					const step = steps[index + 1];
					if (step) editor().set_step(step.id);
				}}
			>
				{t('Next')}
				<Icons.ArrowRight size={18} />
			</button>
		{/if}
	</footer>
</aside>
