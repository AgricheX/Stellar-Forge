<script lang="ts">
	import { PRESETS, render_galaxy_mask } from '$lib/galaxy';
	import { make_rng } from '$lib/random';

	let canvas = $state<HTMLCanvasElement>();

	$effect(() => {
		if (!canvas) return;
		const preset = PRESETS.find((p) => p.id === 'milky_way') ?? PRESETS[0]!;
		const mask = render_galaxy_mask({
			...preset.recipe,
			seed: 'stellar-forge',
		});
		const size = mask.width;
		canvas.width = size;
		canvas.height = size;
		const ctx = canvas.getContext('2d');
		if (!ctx) return;
		ctx.drawImage(mask, 0, 0);
		ctx.globalCompositeOperation = 'source-in';
		const tint = ctx.createRadialGradient(
			size / 2,
			size / 2,
			0,
			size / 2,
			size / 2,
			size / 2,
		);
		tint.addColorStop(0, 'rgba(255,240,225,0.95)');
		tint.addColorStop(0.18, 'rgba(255,170,140,0.75)');
		tint.addColorStop(0.5, 'rgba(229,50,45,0.45)');
		tint.addColorStop(1, 'rgba(120,40,140,0.25)');
		ctx.fillStyle = tint;
		ctx.fillRect(0, 0, size, size);
		ctx.globalCompositeOperation = 'source-over';
		const data = mask.getContext('2d')?.getImageData(0, 0, size, size).data;
		if (!data) return;
		const rng = make_rng('hero');
		let placed = 0;
		for (let attempt = 0; attempt < 60000 && placed < 1400; attempt++) {
			const x = Math.floor(rng() * size);
			const y = Math.floor(rng() * size);
			const alpha = (data[(y * size + x) * 4 + 3] ?? 0) / 255;
			if (rng() > alpha * 1.4) continue;
			placed++;
			const r = rng() < 0.06 ? 2.2 : 1.1;
			ctx.fillStyle = rng() < 0.12 ? '#ffd2b8' : '#ffffff';
			ctx.globalAlpha = 0.55 + rng() * 0.45;
			ctx.beginPath();
			ctx.arc(x, y, r, 0, Math.PI * 2);
			ctx.fill();
		}
		ctx.globalAlpha = 1;
	});
</script>

<div class="relative aspect-square w-full">
	<div
		class="absolute inset-[12%] rounded-full bg-primary-500/20 blur-3xl"
	></div>
	<canvas bind:this={canvas} class="relative size-full sf-hero-spin"></canvas>
</div>

<style>
	.sf-hero-spin {
		animation: sf-hero-spin 240s linear infinite;
		mask-image: radial-gradient(circle, #000 55%, transparent 72%);
	}
	@keyframes sf-hero-spin {
		to {
			transform: rotate(-360deg);
		}
	}
	@media (prefers-reduced-motion: reduce) {
		.sf-hero-spin {
			animation: none;
		}
	}
</style>
