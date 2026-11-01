<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { tool_pairs } from '$lib/models/tool';
	import { t } from '$lib/i18n/index.svelte';
	import { ui, get_tool_layer } from '$lib/ui.svelte';
	import { generate_all } from '$lib/forge';
	import { Portal, Tooltip } from '@skeletonlabs/skeleton-svelte';

	const editor = get_editor();
	const pairs = $derived(
		tool_pairs.filter((pair) => pair.step === editor().step),
	);
	let generating = $state(false);
</script>

{#snippet tip(label: string, key?: string)}
	<Portal>
		<Tooltip.Positioner class="z-50!">
			<Tooltip.Content
				class="flex items-center gap-2 rounded-md px-2.5 py-1.5 text-xs font-medium bg-surface-950 text-surface-50 shadow-lg border border-surface-800"
			>
				{label}
				{#if key}<span class="sf-kbd">{key}</span>{/if}
			</Tooltip.Content>
		</Tooltip.Positioner>
	</Portal>
{/snippet}

<nav
	class="flex flex-col items-center gap-1 w-14 shrink-0 py-3 border-e border-surface-200-800 bg-surface-50-950"
	aria-label={t('Tools')}
>
	<span
		class="mb-1 h-px w-6 bg-primary-500/60 shadow-[0_0_6px_rgba(229,50,45,0.8)]"
	></span>
	{#each pairs as pair, i (pair.id)}
		{@const Icon = Icons[pair.icon]}
		{@const active =
			editor().primary_tool_id === pair.primary.id ||
			editor().primary_tool_id === pair.secondary.id}
		{@const locked = ui.is_locked(get_tool_layer(pair.primary.id))}
		<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
			<Tooltip.Trigger
				class="sf-icon-btn relative sf-fade-in"
				style="animation-delay: {i * 25}ms"
				aria-pressed={active}
				aria-label={t(pair.name)}
				onclick={() => {
					editor().primary_tool_id = pair.primary.id;
					editor().secondary_tool_id = pair.secondary.id;
				}}
			>
				<Icon class="size-[1.1rem]" />
				{#if locked}
					<Icons.Lock
						class="absolute bottom-0.5 right-0.5 size-2.5 text-warning-500"
					/>
				{/if}
			</Tooltip.Trigger>
			{@render tip(t(pair.name), pair.key)}
		</Tooltip>
	{/each}
	{#if editor().step === 'paint'}
		<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
			<Tooltip.Trigger
				class="sf-icon-btn"
				aria-label={t('Text & Emoji')}
				onclick={() => {
					const input = document.getElementById('sf-text-input');
					input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
					input?.focus();
				}}
			>
				<Icons.Type class="size-[1.1rem]" />
			</Tooltip.Trigger>
			{@render tip(t('Text & Emoji'), 'T')}
		</Tooltip>
	{/if}
	{#if editor().step === 'generate'}
		<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
			<Tooltip.Trigger
				class="sf-icon-btn"
				aria-label={t('Generate All')}
				onclick={async () => {
					generating = true;
					try {
						await generate_all(editor());
					} finally {
						generating = false;
					}
				}}
			>
				<Icons.Sparkles class={['size-[1.1rem]', generating && 'sf-spin']} />
			</Tooltip.Trigger>
			{@render tip(t('Generate All'), 'Ctrl G')}
		</Tooltip>
	{/if}
	<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
		<Tooltip.Trigger
			class="sf-icon-btn"
			aria-label={t('Random Galaxy')}
			onclick={() => ui.open('random')}
		>
			<Icons.Dices class="size-[1.1rem]" />
		</Tooltip.Trigger>
		{@render tip(t('Random Galaxy'))}
	</Tooltip>

	<div class="grow"></div>

	<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
		<Tooltip.Trigger
			class="sf-icon-btn"
			aria-label={t('Undo')}
			disabled={!editor().can_undo}
			onclick={() => editor().undo()}
		>
			<Icons.Undo class="size-[1.1rem]" />
		</Tooltip.Trigger>
		{@render tip(t('Undo'), 'Ctrl Z')}
	</Tooltip>
	<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
		<Tooltip.Trigger
			class="sf-icon-btn"
			aria-label={t('Redo')}
			disabled={!editor().can_redo}
			onclick={() => editor().redo()}
		>
			<Icons.Redo class="size-[1.1rem]" />
		</Tooltip.Trigger>
		{@render tip(t('Redo'), 'Ctrl Y')}
	</Tooltip>
	<div class="w-6 h-px bg-surface-200-800 my-1"></div>
	<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
		<Tooltip.Trigger
			class="sf-icon-btn"
			aria-label={t('Layers')}
			aria-pressed={ui.layers_open}
			onclick={() => ui.toggle_layers_open()}
		>
			<Icons.Layers class="size-[1.1rem]" />
		</Tooltip.Trigger>
		{@render tip(t('Layers'), 'Alt L')}
	</Tooltip>
	<Tooltip positioning={{ placement: 'right' }} openDelay={150}>
		<Tooltip.Trigger
			class="sf-icon-btn"
			aria-label={t('Keyboard Shortcuts')}
			onclick={() => ui.open('shortcuts')}
		>
			<Icons.Keyboard class="size-[1.1rem]" />
		</Tooltip.Trigger>
		{@render tip(t('Keyboard Shortcuts'), '?')}
	</Tooltip>
</nav>
