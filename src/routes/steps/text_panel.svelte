<script lang="ts">
	import { FONTS, type TextStyle } from '$lib/text_mask';
	import { placement } from '$lib/placement.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { Icons } from '$lib/components/icons';

	const EMOJIS = [
		'💜',
		'⭐',
		'🚀',
		'🌙',
		'❤️',
		'👽',
		'🐉',
		'💀',
		'🪐',
		'🔥',
		'👑',
		'☯️',
	];

	let text = $state('A');
	let font = $state<string>('Inter');
	let bold = $state(true);
	let outline = $state(false);
	let outline_width = $state(18);
	let letter_spacing = $state(0.05);
	let line_height = $state(1.05);

	const style = $derived<TextStyle>({
		text,
		font,
		bold,
		outline,
		outline_width,
		letter_spacing,
		line_height,
	});

	const is_live = $derived(
		placement.active && placement.source?.kind === 'text',
	);

	let timer: ReturnType<typeof setTimeout> | undefined;
	$effect(() => {
		const current = style;
		if (!is_live) return;
		clearTimeout(timer);
		timer = setTimeout(() => {
			if (current.text.trim() !== '') placement.start_text(current);
		}, 200);
		return () => clearTimeout(timer);
	});

	function place() {
		if (text.trim() === '') return;
		placement.start_text(style);
	}
</script>

<label class="flex flex-col gap-1">
	<span class="label-text flex items-center justify-between">
		{t('Text, letters, numbers or emoji')}
		<span class="sf-kbd">T</span>
	</span>
	<textarea
		id="sf-text-input"
		class="textarea bg-surface-100-900 ring-surface-200-800 font-semibold text-lg leading-tight min-h-16 resize-y"
		rows="2"
		bind:value={text}
		placeholder="A, 0, STELLAR, 💜"
		onkeydown={(e) => {
			if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) {
				e.preventDefault();
				place();
			}
		}}
	></textarea>
</label>
<div class="flex flex-wrap gap-1">
	{#each EMOJIS as emoji (emoji)}
		<button
			type="button"
			class="size-8 rounded-md border border-surface-200-800 bg-surface-100-900 text-lg leading-none hover:border-primary-500/70 hover:scale-110 transition-transform"
			onclick={() => {
				text = emoji;
				if (!is_live) place();
			}}
		>
			{emoji}
		</button>
	{/each}
</div>
<div class="grid grid-cols-2 gap-2">
	<label class="flex flex-col gap-1">
		<span class="label-text">{t('Font')}</span>
		<select
			class="select bg-surface-100-900 ring-surface-200-800 text-sm"
			bind:value={font}
			style:font-family={font}
		>
			{#each FONTS as option (option.id)}
				<option value={option.id} style:font-family={option.id}>
					{option.label}
				</option>
			{/each}
		</select>
	</label>
	<div class="flex flex-col gap-1">
		<span class="label-text">{t('Style')}</span>
		<div class="flex gap-1">
			<button
				type="button"
				class="sf-icon-btn border border-surface-200-800 font-extrabold"
				aria-pressed={bold}
				title={t('Bold')}
				onclick={() => (bold = !bold)}
			>
				B
			</button>
			<button
				type="button"
				class="sf-icon-btn border border-surface-200-800 grow w-auto! px-2 text-xs"
				aria-pressed={outline}
				onclick={() => (outline = !outline)}
			>
				{outline ? t('Outline') : t('Filled')}
			</button>
		</div>
	</div>
</div>
{#if outline}
	<label class="flex flex-col gap-1">
		<span class="label-text flex justify-between">
			{t('Outline Width')}
			<span class="font-mono">{outline_width}</span>
		</span>
		<input
			type="range"
			min="4"
			max="60"
			step="1"
			class="accent-primary-500"
			bind:value={outline_width}
		/>
	</label>
{/if}
<div class="grid grid-cols-2 gap-3">
	<label class="flex flex-col gap-1">
		<span class="label-text flex justify-between text-xs">
			{t('Letter Spacing')}
			<span class="font-mono">{Math.round(letter_spacing * 100)}</span>
		</span>
		<input
			type="range"
			min="-0.2"
			max="0.8"
			step="0.01"
			class="accent-primary-500"
			bind:value={letter_spacing}
		/>
	</label>
	<label class="flex flex-col gap-1">
		<span class="label-text flex justify-between text-xs">
			{t('Line Height')}
			<span class="font-mono">{line_height.toFixed(2)}</span>
		</span>
		<input
			type="range"
			min="0.7"
			max="2"
			step="0.05"
			class="accent-primary-500"
			bind:value={line_height}
		/>
	</label>
</div>
<button
	type="button"
	class="btn preset-filled-primary-500 sf-btn-glow w-full"
	disabled={text.trim() === '' || placement.busy}
	onclick={place}
>
	{#if is_live}
		<Icons.RotateCcw class="size-4" />
		{t('Update on map')}
	{:else}
		<Icons.Type class="size-4" />
		{t('Place on map')}
	{/if}
</button>
<p class="text-xs text-surface-500 leading-relaxed">
	{t(
		'Drag the box to move it, the corners to resize (Shift keeps the proportion, Alt resizes from the center), the round handle to rotate (Shift snaps to 15°). Enter applies, Esc cancels.',
	)}
</p>
