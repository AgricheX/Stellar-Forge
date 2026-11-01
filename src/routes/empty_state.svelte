<script lang="ts">
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { placement } from '$lib/placement.svelte';
	import { PRESETS } from '$lib/galaxy';
	import { fade } from 'svelte/transition';

	const editor = get_editor();
	let blank = $state(false);
	let dismissed = $state(false);

	$effect(() => {
		const blob = editor().project.canvas;
		let cancelled = false;
		createImageBitmap(blob).then((bitmap) => {
			const canvas = new OffscreenCanvas(40, 40);
			const ctx = canvas.getContext('2d')!;
			ctx.drawImage(bitmap, 0, 0, 40, 40);
			const data = ctx.getImageData(0, 0, 40, 40).data;
			let total = 0;
			for (let i = 0; i < data.length; i += 4)
				total += data[i]! * (data[i + 3]! / 255);
			if (!cancelled) blank = total / (data.length / 4) < 2;
		});
		return () => {
			cancelled = true;
		};
	});

	const visible = $derived(
		blank &&
			!dismissed &&
			!placement.active &&
			editor().step === 'paint' &&
			editor().project.solar_systems.length === 0,
	);

	const milky_way = PRESETS[0]!;
</script>

{#if visible}
	<div
		class="absolute inset-0 z-[5] grid place-items-center pointer-events-none"
		transition:fade={{ duration: 200 }}
	>
		<div
			class="relative sf-glass pointer-events-auto max-w-md mx-4 p-6 text-center sf-rise"
		>
			<button
				class="sf-icon-btn absolute top-2 right-2 size-8!"
				aria-label={t('Close')}
				title={t('I will paint it myself')}
				onclick={() => (dismissed = true)}
			>
				<Icons.X class="size-4" />
			</button>
			<img
				src="logo.svg"
				alt=""
				class="size-16 mx-auto drop-shadow-[0_0_24px_rgba(229,50,45,0.5)]"
			/>
			<h2 class="text-xl font-bold mt-3">{t('Forge your galaxy')}</h2>
			<p class="text-sm text-surface-600-400 mt-1">
				{t(
					'Paint with the tools on the left, start from a template, type a command or let chance decide.',
				)}
			</p>
			<div class="grid grid-cols-2 gap-2 mt-5">
				<button
					class="btn preset-filled-primary-500 sf-btn-glow"
					onclick={() =>
						placement.start_galaxy(
							{ ...milky_way.recipe, seed: milky_way.id },
							milky_way.name,
							milky_way.systems,
						)}
				>
					<Icons.Galaxy class="size-4" />
					{t('Milky Way')}
				</button>
				<button class="btn preset-tonal" onclick={() => ui.open('random')}>
					<Icons.Dices class="size-4" />
					{t('Random Galaxy')}
				</button>
				<button class="btn preset-tonal" onclick={() => ui.open('command')}>
					<Icons.Terminal class="size-4" />
					{t('Command')}
				</button>
				<button
					class="btn preset-tonal"
					onclick={() => {
						const input = document.getElementById('sf-text-input');
						input?.scrollIntoView({ behavior: 'smooth', block: 'center' });
						input?.focus();
					}}
				>
					<Icons.Type class="size-4" />
					{t('Text & Emoji')}
				</button>
			</div>
			<p class="text-xs text-surface-500 mt-4">
				{t('Tip: press ? to see every keyboard shortcut.')}
			</p>
		</div>
	</div>
{/if}
