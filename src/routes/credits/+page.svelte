<script lang="ts">
	import SiteNav from '$lib/components/site_nav.svelte';
	import SiteFooter from '$lib/components/site_footer.svelte';
	import { asset } from '$app/paths';
	import { LINKS } from '$lib/links';
	import { Icons } from '$lib/components/icons';
	import { t } from '$lib/i18n/index.svelte';

	const people: { name: string; role: string; url?: string }[] = [
		{
			name: 'Agriche',
			role: 'Owner and founder of Stellar Forge',
			url: LINKS.nexus,
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

<svelte:head>
	<title>Stellar Forge · {t('Credits')}</title>
</svelte:head>

<div class="h-full overflow-y-auto">
	<SiteNav />
	<main class="mx-auto max-w-3xl px-4 pt-12 sf-rise">
		<div class="flex flex-col items-center text-center gap-3 pb-8">
			<img
				src={asset('/logo.svg')}
				alt="Stellar Forge"
				class="size-24 drop-shadow-[0_0_24px_rgba(229,50,45,0.45)]"
			/>
			<h1 class="text-3xl font-extrabold tracking-tight">{t('Credits')}</h1>
			<p class="text-sm text-surface-600-400 max-w-md">
				{t(
					'Free and open source, made by fans for fans. If anyone charges you to use it, it is a scam.',
				)}
			</p>
		</div>
		<div class="sf-tag mb-2">{t('Team')}</div>
		<ul class="flex flex-col gap-2">
			{#each people as person (person.name)}
				<li
					class="sf-panel sf-accent-bar ps-5 pe-3 py-3 flex items-center justify-between gap-3"
				>
					<div>
						<div class="font-semibold">{person.name}</div>
						<div class="text-sm text-surface-500">{t(person.role)}</div>
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
		<a
			class="mt-6 sf-panel p-5 flex items-center gap-4 hover:border-primary-500/60 transition-colors"
			{...{ href: LINKS.nexus }}
			target="_blank"
			rel="noreferrer"
		>
			<Icons.Galaxy class="size-9 text-primary-500 shrink-0" />
			<span class="grow">
				<span class="block font-bold">Agriche Nexus</span>
				<span class="block text-sm text-surface-500">
					{t('More mods and tools by Agriche: WorldBox, RimWorld and more.')}
				</span>
			</span>
			<Icons.ArrowRight class="size-5 text-surface-500" />
		</a>
		<div class="sf-tag mt-8 mb-2">{t('Thanks to')}</div>
		<ul class="grid sm:grid-cols-2 gap-2">
			{#each thanks as item (item.name)}
				<li>
					<a
						class="block h-full sf-panel px-3 py-2.5 hover:border-primary-500/60 transition-colors"
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
		<div class="flex flex-wrap justify-center gap-2 mt-8">
			<a
				class="btn preset-filled-primary-500"
				{...{ href: LINKS.discord }}
				target="_blank"
				rel="noreferrer"
			>
				<Icons.MessageCircle class="size-4" /> Discord
			</a>
			<a
				class="btn preset-tonal"
				{...{ href: LINKS.github }}
				target="_blank"
				rel="noreferrer"
			>
				<Icons.Github class="size-4" /> GitHub
			</a>
			<a
				class="btn preset-tonal"
				{...{ href: LINKS.issues }}
				target="_blank"
				rel="noreferrer"
			>
				<Icons.TriangleAlert class="size-4" />
				{t('Report a bug')}
			</a>
		</div>
		<p class="text-xs text-surface-500 mt-8 leading-relaxed text-center">
			{t(
				'Stellaris is a trademark of Paradox Interactive. Stellar Forge is an independent fan project and is not affiliated with or endorsed by Paradox Interactive.',
			)}
		</p>
	</main>
	<SiteFooter />
</div>
