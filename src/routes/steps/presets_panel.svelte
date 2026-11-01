<script lang="ts">
	import { PRESETS, render_galaxy_mask, type Preset } from '$lib/galaxy';
	import { placement } from '$lib/placement.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { Icons } from '$lib/components/icons';
	import { ui } from '$lib/ui.svelte';
	import { onMount } from 'svelte';

	let thumbnails = $state<Record<string, string>>({});

	onMount(() => {
		let cancelled = false;
		const queue = [...PRESETS];
		const next = () => {
			if (cancelled) return;
			const preset = queue.shift();
			if (!preset) return;
			const mask = render_galaxy_mask({ ...preset.recipe, seed: preset.id });
			const small = document.createElement('canvas');
			small.width = 160;
			small.height = 160;
			const ctx = small.getContext('2d')!;
			ctx.fillStyle = '#0d0d0f';
			ctx.fillRect(0, 0, 160, 160);
			ctx.drawImage(mask, 0, 0, 160, 160);
			ctx.globalCompositeOperation = 'multiply';
			ctx.fillStyle = '#ffd9d6';
			ctx.fillRect(0, 0, 160, 160);
			thumbnails[preset.id] = small.toDataURL();
			setTimeout(next, 16);
		};
		next();
		return () => {
			cancelled = true;
		};
	});

	function apply(preset: Preset) {
		placement.start_galaxy(
			{ ...preset.recipe, seed: preset.id },
			preset.name,
			preset.systems,
		);
	}
</script>

<div class="grid grid-cols-3 gap-2">
	{#each PRESETS as preset, i (preset.id)}
		<button
			type="button"
			class="group relative flex flex-col overflow-hidden rounded-md border border-surface-200-800 bg-surface-100-900 text-left transition-all hover:border-primary-500/70 hover:-translate-y-0.5 hover:shadow-[0_8px_24px_-12px_rgba(229,50,45,0.8)] sf-fade-in"
			style="animation-delay: {i * 30}ms"
			title={t(preset.description)}
			onclick={() => apply(preset)}
		>
			<span class="aspect-square w-full bg-[#0d0d0f] overflow-hidden">
				{#if thumbnails[preset.id]}
					<img
						src={thumbnails[preset.id]}
						alt=""
						class="size-full object-cover transition-transform duration-500 group-hover:scale-110 group-hover:rotate-6"
					/>
				{/if}
			</span>
			<span class="px-1.5 py-1">
				<span class="block text-[0.7rem] font-semibold leading-tight truncate">
					{t(preset.name)}
				</span>
				{#if preset.inspired_by}
					<span
						class="block font-mono text-[0.58rem] text-primary-500 truncate"
					>
						{preset.inspired_by}
					</span>
				{:else}
					<span class="block font-mono text-[0.58rem] text-surface-500">
						{preset.systems}
						{t('systems')}
					</span>
				{/if}
			</span>
		</button>
	{/each}
</div>
<button
	type="button"
	class="btn btn-sm preset-tonal w-full"
	onclick={() => ui.open('random')}
>
	<Icons.Dices class="size-4" />
	{t('Surprise me: random galaxy')}
</button>
<p class="text-xs text-surface-500 leading-relaxed">
	{t(
		'Templates are placed on the map with a transform box: move, resize and rotate them freely, then press Apply.',
	)}
</p>
