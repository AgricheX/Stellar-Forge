<script lang="ts">
	import { version } from '../../../package.json';

	const { compact = false }: { compact?: boolean } = $props();
</script>

<div class="flex items-center gap-2.5 select-none">
	<span class="brand-mark relative grid place-items-center size-8 rounded-md">
		<svg viewBox="0 0 64 64" class="size-6" aria-hidden="true">
			<path
				d="M32 4 C33.6 20 37 23.5 52 25 C37 26.5 33.6 30 32 46 C30.4 30 27 26.5 12 25 C27 23.5 30.4 20 32 4 Z"
				fill="currentColor"
			/>
			<ellipse
				cx="32"
				cy="25.5"
				rx="25"
				ry="8"
				transform="rotate(-16 32 25.5)"
				fill="none"
				stroke="#e5322d"
				stroke-width="3"
			/>
			<path
				d="M8 47 H40 C46 47 51 46 55 43.5 C54 49 49.5 51.5 43 52 H42 V54.5 C42 55.6 43 56.3 44.4 56.8 L47 57.6 V60 H14 V57.6 L16.6 56.8 C18 56.3 19 55.6 19 54.5 V52 H17 C12 51.7 8.4 50 8 47 Z"
				fill="currentColor"
				fill-opacity="0.8"
			/>
		</svg>
	</span>
	{#if !compact}
		<span class="flex flex-col leading-none">
			<span class="font-extrabold tracking-[0.18em] text-[0.8rem]">
				STELLAR
				<span class="text-primary-500">FORGE</span>
			</span>
			<span class="sf-tag mt-1">v{version} · Stellaris</span>
		</span>
	{/if}
</div>

<style>
	.brand-mark {
		background:
			radial-gradient(
				circle at 50% 35%,
				rgba(229, 50, 45, 0.35),
				transparent 70%
			),
			#141417;
		border: 1px solid rgba(229, 50, 45, 0.35);
		color: #f2f2f2;
		box-shadow: 0 0 18px -6px rgba(229, 50, 45, 0.8);
		transition: box-shadow 0.3s ease;
	}
	.brand-mark:hover {
		box-shadow: 0 0 24px -4px rgba(229, 50, 45, 0.95);
	}
</style>
