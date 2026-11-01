<script lang="ts">
	import { resolve, asset } from '$app/paths';
	import SiteNav from '$lib/components/site_nav.svelte';
	import SiteFooter from '$lib/components/site_footer.svelte';
	import HeroGalaxy from '$lib/components/hero_galaxy.svelte';
	import { Icons } from '$lib/components/icons';
	import { t, tr } from '$lib/i18n/index.svelte';
	import { LINKS } from '$lib/links';

	const features = $derived([
		{
			icon: Icons.Brush,
			title: tr('Paint your galaxy', 'Pinte sua galáxia'),
			text: tr(
				'Brushes and shapes: circles, polygons, stars, rings and spirals. The brighter you paint, the more stars.',
				'Pincéis e formas: círculos, polígonos, estrelas, anéis e espirais. Quanto mais forte a pintura, mais estrelas.',
			),
			image: 'editor',
		},
		{
			icon: Icons.Type,
			title: tr('Type it into shape', 'Digite e vira galáxia'),
			text: tr(
				'Letters, words, numbers or emoji become a galaxy. Move, resize and rotate it freely.',
				'Letras, palavras, números ou emoji viram uma galáxia. Mova, redimensione e gire à vontade.',
			),
			image: 'transform',
		},
		{
			icon: Icons.Orbit,
			title: 'System Forge',
			text: tr(
				'Design star systems planet by planet and drop them anywhere on your map.',
				'Monte sistemas estelares planeta por planeta e coloque onde quiser no mapa.',
			),
			image: 'system_forge',
		},
		{
			icon: Icons.Package,
			title: tr('A ready mod', 'Mod pronto'),
			text: tr(
				'One click gives you a zip with everything in place: map, systems, icon and description.',
				'Um clique e você tem um zip com tudo no lugar: mapa, sistemas, ícone e descrição.',
			),
			image: 'export',
		},
	]);

	const extras = $derived([
		{
			icon: Icons.Galaxy,
			title: tr('Famous galaxies', 'Galáxias famosas'),
			text: tr(
				'Milky Way, Andromeda and maps inspired by Star Wars, Star Trek, 40k, Mass Effect and more.',
				'Via Láctea, Andrômeda e mapas inspirados em Star Wars, Star Trek, 40k, Mass Effect e mais.',
			),
		},
		{
			icon: Icons.Dices,
			title: tr('100% random', '100% aleatória'),
			text: tr(
				'Roll a whole galaxy from a seed and share the seed with friends.',
				'Sorteie uma galáxia inteira a partir de uma semente e compartilhe com os amigos.',
			),
		},
		{
			icon: Icons.HardDriveUpload,
			title: tr('From your saves', 'Dos seus saves'),
			text: tr(
				'Loved the map of a campaign? Import the save and make it yours.',
				'Gostou do mapa de uma campanha? Importe o save e deixe do seu jeito.',
			),
		},
		{
			icon: Icons.Layers,
			title: tr('Layers and shortcuts', 'Camadas e atalhos'),
			text: tr(
				'Lock and hide what you are not editing. Almost everything has a key.',
				'Trave e esconda o que você não está editando. Quase tudo tem um atalho.',
			),
		},
	]);

	const steps = $derived([
		[
			tr('Paint', 'Pinte'),
			tr(
				'Draw, type or pick a template.',
				'Desenhe, digite ou escolha um modelo.',
			),
		],
		[
			tr('Generate', 'Gere'),
			tr(
				'Stars, hyperlanes, spawns and nebulas.',
				'Estrelas, hiperpistas, spawns e nebulosas.',
			),
		],
		[
			tr('Tweak', 'Ajuste'),
			tr(
				'Fine-tune by hand and add your systems.',
				'Ajuste à mão e adicione seus sistemas.',
			),
		],
		[
			tr('Play', 'Jogue'),
			tr(
				'Export the mod and pick your galaxy in game.',
				'Exporte o mod e escolha sua galáxia no jogo.',
			),
		],
	]);
</script>

<div class="h-full overflow-y-auto">
	<SiteNav />

	<section class="relative overflow-hidden">
		<div
			class="absolute inset-0 opacity-40 pointer-events-none"
			style="background-image: linear-gradient(rgba(255,255,255,.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,.03) 1px, transparent 1px); background-size: 40px 40px;"
		></div>
		<div
			class="relative mx-auto max-w-6xl px-4 pt-14 pb-10 grid md:grid-cols-[1.05fr_1fr] gap-10 items-center"
		>
			<div class="flex flex-col gap-5 sf-rise">
				<div class="flex items-center gap-3 sf-tag">
					<span
						class="h-5 w-1 bg-primary-500 shadow-[0_0_12px_rgba(229,50,45,0.9)]"
					></span>
					{tr(
						'Stellaris · galaxy map maker',
						'Stellaris · criador de mapas de galáxia',
					)}
				</div>
				<h1
					class="text-5xl md:text-7xl font-extrabold tracking-tight leading-[0.95]"
				>
					Stellar
					<br />
					<span
						class="text-primary-500 drop-shadow-[0_0_30px_rgba(229,50,45,0.35)]"
					>
						Forge
					</span>
				</h1>
				<p class="text-lg text-surface-700-300 max-w-xl leading-relaxed">
					{tr(
						'Paint, type or roll a galaxy, design your own star systems and export a ready-to-play Stellaris mod. Free, right in your browser.',
						'Pinte, digite ou sorteie uma galáxia, monte seus próprios sistemas estelares e exporte um mod de Stellaris pronto pra jogar. Grátis, direto no navegador.',
					)}
				</p>
				<div class="flex flex-wrap gap-3 mt-1">
					<a
						href={resolve('/forge')}
						class="btn btn-lg preset-filled-primary-500 sf-btn-glow"
					>
						<Icons.Sparkles class="size-5" />
						{t('Open the Forge')}
					</a>
					<a
						href={resolve('/forum')}
						class="btn btn-lg preset-outlined-surface-500"
					>
						<Icons.BookOpen class="size-5" />
						{tr('Guides and tutorials', 'Guias e tutoriais')}
					</a>
				</div>
				<p class="text-xs text-surface-500 flex items-center gap-2">
					<Icons.Info class="size-3.5" />
					{tr(
						'Maps need the free Paint a Galaxy mod on the Steam Workshop.',
						'Os mapas precisam do mod gratuito Paint a Galaxy da Oficina da Steam.',
					)}
				</p>
			</div>
			<div class="max-w-[30rem] w-full mx-auto">
				<HeroGalaxy />
			</div>
		</div>
	</section>

	<section class="mx-auto max-w-6xl px-4">
		<ol class="grid grid-cols-2 md:grid-cols-4 gap-3">
			{#each steps as [title, text], i (title)}
				<li class="sf-panel p-4 flex gap-3 items-start">
					<span
						class="grid place-items-center size-8 shrink-0 rounded-full border border-primary-500/60 text-primary-500 font-mono text-sm"
					>
						{i + 1}
					</span>
					<span>
						<span class="block font-semibold">{title}</span>
						<span class="block text-sm text-surface-600-400">{text}</span>
					</span>
				</li>
			{/each}
		</ol>
	</section>

	<section class="mx-auto max-w-6xl px-4 mt-16 flex flex-col gap-14">
		{#each features as feature, i (feature.image)}
			<article
				class={[
					'grid md:grid-cols-2 gap-8 items-center',
					i % 2 === 1 && 'md:[&>*:first-child]:order-2',
				]}
			>
				<div class="flex flex-col gap-3">
					<feature.icon class="size-7 text-primary-500" />
					<h2 class="text-2xl font-bold tracking-tight">{feature.title}</h2>
					<p class="text-surface-600-400 leading-relaxed">{feature.text}</p>
				</div>
				<img
					src={asset(`/preview/${feature.image}.jpg`)}
					alt={feature.title}
					loading="lazy"
					class="rounded-container border border-surface-200-800 shadow-2xl shadow-black/50"
				/>
			</article>
		{/each}
	</section>

	<section class="mx-auto max-w-6xl px-4 mt-16">
		<div class="grid sm:grid-cols-2 lg:grid-cols-4 gap-3">
			{#each extras as extra (extra.title)}
				<div class="sf-panel p-4 flex flex-col gap-2">
					<extra.icon class="size-5 text-primary-500" />
					<h3 class="font-semibold">{extra.title}</h3>
					<p class="text-sm text-surface-600-400">{extra.text}</p>
				</div>
			{/each}
		</div>
	</section>

	<section class="mx-auto max-w-6xl px-4 mt-16">
		<div
			class="sf-panel sf-accent-bar p-6 ps-7 flex flex-col md:flex-row gap-5 md:items-center justify-between"
		>
			<div>
				<h2 class="text-xl font-bold">
					{tr('Join the community', 'Entre na comunidade')}
				</h2>
				<p class="text-sm text-surface-600-400 mt-1 max-w-xl">
					{tr(
						'Show your galaxies, report bugs and ask for help on the Discord. Stellar Forge is free and made by fans for fans.',
						'Mostre suas galáxias, reporte bugs e tire dúvidas no Discord. O Stellar Forge é grátis e feito de fã pra fã.',
					)}
				</p>
			</div>
			<div class="flex flex-wrap gap-2">
				<a
					class="btn preset-filled-primary-500"
					{...{ href: LINKS.discord }}
					target="_blank"
					rel="noreferrer"
				>
					<Icons.MessageCircle class="size-4" />
					Discord
				</a>
				<a
					class="btn preset-tonal"
					{...{ href: LINKS.github }}
					target="_blank"
					rel="noreferrer"
				>
					<Icons.Github class="size-4" />
					GitHub
				</a>
				<a
					class="btn preset-tonal"
					{...{ href: LINKS.workshop }}
					target="_blank"
					rel="noreferrer"
				>
					<Icons.ExternalLink class="size-4" />
					Paint a Galaxy
				</a>
			</div>
		</div>
	</section>

	<SiteFooter />
</div>
