<script lang="ts">
	import { resolve } from '$app/paths';
	import { t } from '$lib/i18n/index.svelte';
	import { LINKS } from '$lib/links';
	import { version } from '../../../package.json';
</script>

<footer class="border-t border-surface-200-800 mt-16">
	<div
		class="mx-auto max-w-6xl px-4 py-8 flex flex-col md:flex-row gap-6 md:items-center justify-between text-sm"
	>
		<div class="flex flex-col gap-1">
			<span class="font-semibold">
				Stellar <span class="text-primary-500">Forge</span>
				<span class="font-mono text-xs text-surface-500 ms-1">v{version}</span>
			</span>
			<span class="text-xs text-surface-500 max-w-md">
				{t(
					'Stellaris is a trademark of Paradox Interactive. Stellar Forge is an independent fan project and is not affiliated with or endorsed by Paradox Interactive.',
				)}
			</span>
		</div>
		<nav class="flex flex-wrap gap-x-5 gap-y-2 text-surface-600-400">
			<a class="hover:text-primary-500" href={resolve('/forge')}>
				{t('Forge')}
			</a>
			<a class="hover:text-primary-500" href={resolve('/forum')}>
				{t('Forum')}
			</a>
			<a class="hover:text-primary-500" href={resolve('/credits')}>
				{t('Credits')}
			</a>
			<a
				class="hover:text-primary-500"
				{...{ href: LINKS.discord }}
				target="_blank"
				rel="noreferrer"
			>
				Discord
			</a>
			<a
				class="hover:text-primary-500"
				{...{ href: LINKS.github }}
				target="_blank"
				rel="noreferrer"
			>
				GitHub
			</a>
			<a
				class="hover:text-primary-500"
				{...{ href: LINKS.nexus }}
				target="_blank"
				rel="noreferrer"
			>
				Agriche Nexus
			</a>
			<a
				class="hover:text-primary-500"
				{...{ href: LINKS.neo_mod_maker }}
				target="_blank"
				rel="noreferrer"
			>
				Neo Mod Maker
			</a>
		</nav>
	</div>
</footer>
