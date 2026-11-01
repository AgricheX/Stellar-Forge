<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import Brand from '$lib/components/brand.svelte';
	import { Icons } from '$lib/components/icons';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';

	const people: { name: string; role: string; url?: string }[] = [
		{
			name: 'Agriche',
			role: 'Owner and founder of Stellar Forge',
			url: 'https://agrichex.github.io/Nexus/',
		},
		{ name: 'Claude', role: 'Co-creator' },
		{
			name: 'Michael Moore (oatmealproblem)',
			role: 'Creator of Paint a Galaxy, the open source project (MIT) Stellar Forge is built on, and of the Paint a Galaxy mod',
			url: 'https://github.com/oatmealproblem/paint-a-galaxy',
		},
	];

	const thanks: { name: string; detail: string; url: string }[] = [
		{
			name: 'Twemoji',
			detail: 'Emoji graphics, CC-BY 4.0',
			url: 'https://github.com/jdecked/twemoji',
		},
		{ name: 'Lucide', detail: 'Icons, ISC', url: 'https://lucide.dev' },
		{
			name: 'Skeleton',
			detail: 'UI toolkit, MIT',
			url: 'https://www.skeleton.dev',
		},
		{
			name: 'Google Fonts',
			detail:
				'Inter, JetBrains Mono, Orbitron, Bebas Neue, Russo One, Press Start 2P · OFL',
			url: 'https://fonts.google.com',
		},
		{
			name: 'Stellaris Solar System Editor',
			detail: 'Inspiration, by KillyBlame',
			url: 'https://github.com/KillyBlame/Stellaris_Solarsystem_Editor',
		},
		{
			name: 'StellarMaps',
			detail: 'Inspiration for map images, by Michael Moore',
			url: 'https://stellarmaps.app',
		},
	];
</script>

<Modal
	open={ui.panel === 'credits'}
	title={t('Credits')}
	tag="Stellar Forge"
	width="lg"
	on_close={() => ui.close()}
>
	<div class="flex flex-col items-center text-center gap-2 pb-4">
		<img
			src="logo.svg"
			alt="Stellar Forge"
			class="size-20 drop-shadow-[0_0_24px_rgba(229,50,45,0.45)]"
		/>
		<Brand />
		<p class="text-sm text-surface-600-400 max-w-md">
			{t(
				'Free and open source, made by fans for fans. If anyone charges you to use it, it is a scam.',
			)}
		</p>
	</div>
	<ul class="flex flex-col gap-2">
		{#each people as person (person.name)}
			<li
				class="sf-panel sf-accent-bar ps-5 pe-3 py-2.5 flex items-center justify-between gap-3"
			>
				<div>
					<div class="font-semibold">{person.name}</div>
					<div class="text-xs text-surface-500">{t(person.role)}</div>
				</div>
				{#if person.url}
					<a
						class="sf-icon-btn"
						{...{ href: person.url }}
						target="_blank"
						rel="noreferrer"
						aria-label={person.name}
					>
						<Icons.ExternalLink class="size-4" />
					</a>
				{/if}
			</li>
		{/each}
	</ul>
	<div class="sf-tag mt-5 mb-2">{t('Thanks to')}</div>
	<ul class="grid sm:grid-cols-2 gap-2">
		{#each thanks as item (item.name)}
			<li>
				<a
					class="block sf-panel px-3 py-2 hover:border-primary-500/60 transition-colors"
					{...{ href: item.url }}
					target="_blank"
					rel="noreferrer"
				>
					<div class="text-sm font-semibold">{item.name}</div>
					<div class="text-xs text-surface-500">{t(item.detail)}</div>
				</a>
			</li>
		{/each}
	</ul>
	<p class="text-xs text-surface-500 mt-5 leading-relaxed">
		{t(
			'Stellaris is a trademark of Paradox Interactive. Stellar Forge is an independent fan project and is not affiliated with or endorsed by Paradox Interactive.',
		)}
	</p>
	<div class="flex flex-wrap justify-center gap-2 mt-4">
		<a
			class="btn btn-sm preset-filled-primary-500"
			href="https://discord.gg/s3EbgNSsJW"
			target="_blank"
			rel="noreferrer"
		>
			<Icons.MessageCircle class="size-4" /> Discord
		</a>
		<a
			class="btn btn-sm preset-tonal"
			href="https://github.com/AgricheX/Stellar-Forge"
			target="_blank"
			rel="noreferrer"
		>
			<Icons.Github class="size-4" /> GitHub
		</a>
		<a
			class="btn btn-sm preset-tonal"
			href="https://agrichex.github.io/Nexus/"
			target="_blank"
			rel="noreferrer"
		>
			<Icons.Galaxy class="size-4" /> Agriche Nexus
		</a>
	</div>
</Modal>
