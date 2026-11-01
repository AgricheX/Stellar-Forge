<script lang="ts">
	import { resolve } from '$app/paths';
	import { afterNavigate } from '$app/navigation';
	import { page } from '$app/state';
	import SiteNav from '$lib/components/site_nav.svelte';
	import SiteFooter from '$lib/components/site_footer.svelte';
	import { Icons } from '$lib/components/icons';
	import { i18n, t, tr } from '$lib/i18n/index.svelte';
	import { LINKS, hash_query } from '$lib/links';
	import { FORUM_TOPICS, type ForumLink, type ForumTopic } from '$lib/forum';

	type Text = readonly [string, string];

	const SECTION_ICONS: Record<string, typeof Icons.Sparkles> = {
		'Getting started': Icons.Sparkles,
		Painting: Icons.Brush,
		'Generate and tweak': Icons.Wand,
		'System Forge': Icons.Orbit,
		'Mod, export and saves': Icons.Package,
		Help: Icons.Info,
	};

	const say = (text: Text) => (i18n.locale === 'pt' ? text[1] : text[0]);

	let query = $state('');

	const sections = $derived.by(() => {
		const groups: { name: Text; topics: ForumTopic[] }[] = [];
		for (const topic of FORUM_TOPICS) {
			let group = groups.find((g) => g.name[0] === topic.section[0]);
			if (!group) {
				group = { name: topic.section, topics: [] };
				groups.push(group);
			}
			group.topics.push(topic);
		}
		return groups;
	});

	const current = $derived(
		FORUM_TOPICS.find((topic) => topic.id === hash_query(page.url).get('t')) ??
			null,
	);

	const results = $derived.by(() => {
		const q = query.trim().toLowerCase();
		if (!q) return [];
		return FORUM_TOPICS.filter((topic) =>
			[
				topic.title,
				topic.intro,
				...topic.items.flatMap((item) => [item.title, item.text]),
				...(topic.tips ?? []),
			].some((text) => say(text).toLowerCase().includes(q)),
		);
	});

	const neighbours = $derived.by(() => {
		if (!current) return { prev: null, next: null };
		const index = FORUM_TOPICS.indexOf(current);
		return {
			prev: FORUM_TOPICS[index - 1] ?? null,
			next: FORUM_TOPICS[index + 1] ?? null,
		};
	});

	function topic_href(id: string) {
		return `${resolve('/forum')}?t=${id}`;
	}

	afterNavigate(() => {
		document.getElementById('forum-scroll')?.scrollTo({ top: 0 });
	});

	function link_href(link: ForumLink) {
		if (link.kind === 'url') return link.url;
		const qs = [
			link.panel && `panel=${link.panel}`,
			link.step && `step=${link.step}`,
		]
			.filter(Boolean)
			.join('&');
		return qs ? `${resolve('/forge')}?${qs}` : resolve('/forge');
	}
</script>

<svelte:head>
	<title>Stellar Forge · {t('Forum')}</title>
</svelte:head>

<div id="forum-scroll" class="h-full overflow-y-auto">
	<SiteNav />
	<div class="mx-auto max-w-6xl px-4 pt-10 grid lg:grid-cols-[17rem_1fr] gap-8">
		<aside class="flex flex-col gap-5 lg:sticky lg:top-24 lg:self-start">
			<label class="relative block">
				<Icons.Search
					class="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-surface-500"
				/>
				<input
					class="input ps-9"
					type="search"
					placeholder={tr('Search the guides', 'Buscar nos guias')}
					bind:value={query}
				/>
			</label>
			<nav class="hidden lg:flex flex-col gap-4">
				{#each sections as section (section.name[0])}
					{@const Icon = SECTION_ICONS[section.name[0]] ?? Icons.BookOpen}
					<div class="flex flex-col gap-1">
						<span class="sf-tag flex items-center gap-2 mb-1">
							<Icon class="size-3.5 text-primary-500" />
							{say(section.name)}
						</span>
						{#each section.topics as topic (topic.id)}
							<a
								class={[
									'text-start text-sm px-3 py-1.5 rounded-md transition-colors',
									current?.id === topic.id ?
										'bg-primary-500/10 text-primary-500'
									:	'text-surface-700-300 hover:bg-surface-200-800/60',
								]}
								{...{ href: topic_href(topic.id) }}
								onclick={() => (query = '')}
							>
								{say(topic.title)}
							</a>
						{/each}
					</div>
				{/each}
			</nav>
		</aside>

		<main class="min-w-0">
			{#if query.trim()}
				<div class="flex flex-col gap-3 sf-rise">
					<h1 class="text-2xl font-bold">
						{tr('Results', 'Resultados')}
						<span class="text-surface-500 font-normal text-base">
							({results.length})
						</span>
					</h1>
					{#each results as topic (topic.id)}
						<a
							class="sf-panel p-4 text-start hover:border-primary-500/60 transition-colors"
							{...{ href: topic_href(topic.id) }}
							onclick={() => (query = '')}
						>
							<span class="sf-tag">{say(topic.section)}</span>
							<span class="block font-semibold mt-1">{say(topic.title)}</span>
							<span class="block text-sm text-surface-600-400 line-clamp-2">
								{say(topic.intro)}
							</span>
						</a>
					{:else}
						<p class="text-surface-500">
							{tr(
								'Nothing found. Try other words or ask on the Discord.',
								'Nada encontrado. Tente outras palavras ou pergunte no Discord.',
							)}
						</p>
					{/each}
				</div>
			{:else if current}
				{#key current.id}
					<article class="flex flex-col gap-6 sf-rise">
						<div class="flex flex-col gap-2">
							<a
								class="text-sm text-surface-500 hover:text-primary-500 flex items-center gap-1"
								href={resolve('/forum')}
							>
								<Icons.ArrowLeft class="size-4" />
								{t('Forum')} · {say(current.section)}
							</a>
							<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">
								{say(current.title)}
							</h1>
							<p class="text-lg text-surface-700-300 leading-relaxed max-w-3xl">
								{say(current.intro)}
							</p>
						</div>

						<div class="flex flex-col gap-3">
							{#each current.items as item, i (item.title[0])}
								<div class="sf-panel p-5 flex gap-4">
									<span
										class="grid place-items-center size-8 shrink-0 rounded-full border border-primary-500/60 text-primary-500 font-mono text-sm"
									>
										{i + 1}
									</span>
									<div>
										<h2 class="font-semibold">{say(item.title)}</h2>
										<p class="text-surface-600-400 mt-1 leading-relaxed">
											{say(item.text)}
										</p>
									</div>
								</div>
							{/each}
						</div>

						{#if current.tips?.length}
							<div class="sf-panel sf-accent-bar p-5 ps-6 flex flex-col gap-2">
								<span class="font-semibold flex items-center gap-2">
									<Icons.Sparkles class="size-4 text-primary-500" />
									{tr('Tips', 'Dicas')}
								</span>
								<ul
									class="list-disc ps-5 text-surface-600-400 flex flex-col gap-1"
								>
									{#each current.tips as tip (tip[0])}
										<li>{say(tip)}</li>
									{/each}
								</ul>
							</div>
						{/if}

						{#if current.link}
							{@const external = current.link.to.kind === 'url'}
							<div>
								<a
									class="btn preset-filled-primary-500 sf-btn-glow"
									{...{ href: link_href(current.link.to) }}
									target={external ? '_blank' : undefined}
									rel={external ? 'noreferrer' : undefined}
								>
									{#if external}
										<Icons.ExternalLink class="size-4" />
									{:else}
										<Icons.Sparkles class="size-4" />
									{/if}
									{say(current.link.label)}
								</a>
							</div>
						{/if}

						<div class="grid sm:grid-cols-2 gap-3 mt-4">
							{#if neighbours.prev}
								<a
									class="sf-panel p-4 text-start hover:border-primary-500/60 transition-colors"
									{...{ href: topic_href(neighbours.prev!.id) }}
									onclick={() => (query = '')}
								>
									<span class="text-xs text-surface-500">
										{tr('Previous', 'Anterior')}
									</span>
									<span class="block font-semibold">
										{say(neighbours.prev.title)}
									</span>
								</a>
							{:else}
								<span></span>
							{/if}
							{#if neighbours.next}
								<a
									class="sf-panel p-4 text-end hover:border-primary-500/60 transition-colors"
									{...{ href: topic_href(neighbours.next!.id) }}
									onclick={() => (query = '')}
								>
									<span class="text-xs text-surface-500">
										{tr('Next', 'Próximo')}
									</span>
									<span class="block font-semibold">
										{say(neighbours.next.title)}
									</span>
								</a>
							{/if}
						</div>
					</article>
				{/key}
			{:else}
				<div class="flex flex-col gap-8 sf-rise">
					<div class="flex flex-col gap-2">
						<span class="sf-tag flex items-center gap-2">
							<span class="h-4 w-1 bg-primary-500"></span>
							{t('Forum')}
						</span>
						<h1 class="text-3xl md:text-4xl font-extrabold tracking-tight">
							{tr('Guides and tutorials', 'Guias e tutoriais')}
						</h1>
						<p class="text-surface-600-400 max-w-2xl">
							{tr(
								'Everything about Stellar Forge, step by step. Pick a category or search above.',
								'Tudo sobre o Stellar Forge, passo a passo. Escolha uma categoria ou busque acima.',
							)}
						</p>
					</div>

					<div class="grid md:grid-cols-2 gap-4">
						{#each sections as section (section.name[0])}
							{@const Icon = SECTION_ICONS[section.name[0]] ?? Icons.BookOpen}
							<div class="sf-panel p-5 flex flex-col gap-3">
								<div class="flex items-center gap-3">
									<span
										class="grid place-items-center size-9 rounded-md bg-primary-500/10 text-primary-500"
									>
										<Icon class="size-5" />
									</span>
									<span>
										<span class="block font-bold">{say(section.name)}</span>
										<span class="block text-xs text-surface-500">
											{section.topics.length}
											{tr('topics', 'tópicos')}
										</span>
									</span>
								</div>
								<div class="flex flex-col">
									{#each section.topics as topic (topic.id)}
										<a
											class="flex items-center justify-between gap-2 text-start text-sm px-2 py-2 rounded-md text-surface-700-300 hover:bg-surface-200-800/60 hover:text-primary-500 transition-colors"
											{...{ href: topic_href(topic.id) }}
											onclick={() => (query = '')}
										>
											{say(topic.title)}
											<Icons.ChevronRight class="size-4 shrink-0 opacity-60" />
										</a>
									{/each}
								</div>
							</div>
						{/each}
					</div>

					<div
						class="sf-panel sf-accent-bar p-5 ps-6 flex flex-col sm:flex-row gap-4 sm:items-center justify-between"
					>
						<div>
							<span class="font-semibold">
								{tr('Still stuck?', 'Ainda com dúvida?')}
							</span>
							<p class="text-sm text-surface-600-400">
								{tr(
									'Ask on the Discord or open an issue on GitHub.',
									'Pergunte no Discord ou abra uma issue no GitHub.',
								)}
							</p>
						</div>
						<div class="flex gap-2">
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
								{...{ href: LINKS.issues }}
								target="_blank"
								rel="noreferrer"
							>
								<Icons.Github class="size-4" />
								{tr('Report a bug', 'Reportar bug')}
							</a>
						</div>
					</div>
				</div>
			{/if}
		</main>
	</div>
	<SiteFooter />
</div>
