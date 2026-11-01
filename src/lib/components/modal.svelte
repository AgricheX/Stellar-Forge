<script lang="ts">
	import type { Snippet } from 'svelte';
	import { Icons } from './icons';
	import { t } from '$lib/i18n/index.svelte';

	type Props = {
		open: boolean;
		title: string;
		subtitle?: string;
		tag?: string;
		width?: 'sm' | 'md' | 'lg' | 'xl' | 'full';
		flush?: boolean;
		children: Snippet;
		footer?: Snippet;
		on_close: () => void;
	};
	const {
		open,
		title,
		subtitle,
		tag,
		width = 'md',
		flush = false,
		children,
		footer,
		on_close,
	}: Props = $props();

	let dialog = $state<HTMLDialogElement>();

	$effect(() => {
		if (!dialog) return;
		if (open && !dialog.open) dialog.showModal();
		if (!open && dialog.open) dialog.close();
	});

	const max_width = $derived(
		{
			sm: 'max-w-sm',
			md: 'max-w-lg',
			lg: 'max-w-2xl',
			xl: 'max-w-4xl',
			full: 'max-w-[110rem] mt-[2vh]! h-[96vh] max-h-[96vh]!',
		}[width],
	);
</script>

<dialog
	bind:this={dialog}
	class={[
		'sf-modal bg-surface-50-950 text-surface-950-50 w-[calc(100%-2rem)] rounded-container p-0 mx-auto mt-[6vh] max-h-[88vh] overflow-hidden',
		max_width,
	]}
	onclose={() => {
		if (open) on_close();
	}}
	onclick={(e) => {
		if (e.target === dialog) on_close();
	}}
>
	{#if open}
		<div
			class={['flex flex-col', width === 'full' ? 'h-[96vh]' : 'max-h-[88vh]']}
		>
			<header
				class="flex items-start justify-between gap-4 px-5 pt-4 pb-3 border-b border-surface-200-800"
			>
				<div class="min-w-0">
					{#if tag}<div class="sf-tag mb-1">{tag}</div>{/if}
					<h2 class="text-lg font-bold tracking-tight">{title}</h2>
					{#if subtitle}
						<p class="text-sm text-surface-600-400 mt-0.5">{subtitle}</p>
					{/if}
				</div>
				<button
					type="button"
					class="sf-icon-btn shrink-0"
					aria-label={t('Close')}
					onclick={on_close}
				>
					<Icons.X class="size-4" />
				</button>
			</header>
			<div
				class={[
					'grow min-h-0',
					flush ? 'overflow-hidden' : 'overflow-auto px-5 py-4',
				]}
			>
				{@render children()}
			</div>
			{#if footer}
				<footer
					class="flex flex-wrap justify-end gap-2 px-5 py-3 border-t border-surface-200-800 bg-surface-100-900/50"
				>
					{@render footer()}
				</footer>
			{/if}
		</div>
	{/if}
</dialog>
