<script lang="ts">
	import { resolve } from '$app/paths';
	import { page } from '$app/state';
	import Brand from './brand.svelte';
	import { Icons } from './icons';
	import { i18n, set_locale, t } from '$lib/i18n/index.svelte';
	import { LINKS } from '$lib/links';

	const links = [
		{ href: resolve('/'), id: '/', label: 'Home page' },
		{ href: resolve('/forum'), id: '/forum', label: 'Forum' },
		{ href: resolve('/credits'), id: '/credits', label: 'Credits' },
	];
</script>

<header
	class="sticky top-0 z-30 border-b border-surface-200-800 bg-surface-50-950/85 backdrop-blur"
>
	<div class="mx-auto max-w-6xl flex items-center gap-2 h-16 px-4">
		<a href={resolve('/')} class="me-3" aria-label="Stellar Forge">
			<Brand />
		</a>
		<nav class="hidden sm:flex items-center gap-1">
			{#each links as link (link.id)}
				<a
					{...{ href: link.href }}
					class={[
						'px-3 py-1.5 rounded-md text-sm font-medium transition-colors',
						page.route.id === link.id ?
							'text-primary-500 bg-primary-500/10'
						:	'text-surface-700-300 hover:text-surface-950-50 hover:bg-surface-200-800/60',
					]}
				>
					{t(link.label)}
				</a>
			{/each}
		</nav>
		<span class="grow"></span>
		<div
			class="flex rounded-md border border-surface-200-800 overflow-hidden text-xs font-mono"
		>
			{#each ['en', 'pt'] as const as locale (locale)}
				<button
					class={[
						'px-2 py-1',
						i18n.locale === locale ?
							'bg-primary-500 text-white'
						:	'text-surface-500 hover:text-surface-950-50',
					]}
					onclick={() => set_locale(locale)}
				>
					{locale.toUpperCase()}
				</button>
			{/each}
		</div>
		<a
			class="sf-icon-btn"
			{...{ href: LINKS.discord }}
			target="_blank"
			rel="noreferrer"
			title="Discord"
		>
			<Icons.MessageCircle class="size-4" />
		</a>
		<a
			class="sf-icon-btn"
			{...{ href: LINKS.github }}
			target="_blank"
			rel="noreferrer"
			title="GitHub"
		>
			<Icons.Github class="size-4" />
		</a>
		<a
			href={resolve('/forge')}
			class="btn btn-sm preset-filled-primary-500 sf-btn-glow ms-1"
		>
			<Icons.Sparkles class="size-4" />
			<span class="hidden sm:inline">{t('Open the Forge')}</span>
		</a>
	</div>
	<nav class="sm:hidden flex justify-center gap-1 pb-2">
		{#each links as link (link.id)}
			<a
				{...{ href: link.href }}
				class={[
					'px-3 py-1 rounded-md text-sm',
					page.route.id === link.id ?
						'text-primary-500 bg-primary-500/10'
					:	'text-surface-600-400',
				]}
			>
				{t(link.label)}
			</a>
		{/each}
	</nav>
</header>
