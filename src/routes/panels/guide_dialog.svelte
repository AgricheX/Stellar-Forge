<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { Icons } from '$lib/components/icons';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { PAINT_A_GALAXY_WORKSHOP_URL } from '$lib/export';

	const steps: { title: string; body: string; code?: string[] }[] = [
		{
			title: 'Subscribe to Paint a Galaxy',
			body: 'Stellar Forge maps run on top of the Paint a Galaxy mod by Michael Moore. Subscribe to it on the Steam Workshop and keep it enabled.',
		},
		{
			title: 'Export your mod',
			body: 'Click Export and then Download Mod. You get a zip with everything in the right place.',
		},
		{
			title: 'Extract it into the Stellaris mod folder',
			body: 'You should see a .mod file and a folder with the same name side by side.',
			code: [
				'Windows: Documents\\Paradox Interactive\\Stellaris\\mod',
				'Linux: ~/.local/share/Paradox Interactive/Stellaris/mod',
				'macOS: ~/Documents/Paradox Interactive/Stellaris/mod',
			],
		},
		{
			title: 'Enable both mods in the launcher',
			body: 'Add Paint a Galaxy and your new mod to your playset. Paint a Galaxy must be enabled too.',
		},
		{
			title: 'Start a new game',
			body: 'In galaxy settings choose the Elliptical shape and pick your galaxy by its name in the size list.',
		},
	];

	const tips = [
		'Maps with more than 1700 stars need a star names mod such as Just Star Names.',
		'If you use modded galaxy shapes, still pick a vanilla shape like Elliptical.',
		'Want to share it? Upload your mod to the Workshop and mark Paint a Galaxy as a required item.',
	];
</script>

<Modal
	open={ui.panel === 'guide'}
	title={t('How to Install')}
	subtitle={t('From the browser to your Stellaris galaxy in five steps.')}
	tag="Stellar Forge"
	width="lg"
	on_close={() => ui.close()}
>
	<ol class="relative flex flex-col gap-4 ms-3 border-s border-surface-200-800">
		{#each steps as step, i (step.title)}
			<li class="ps-6 relative sf-rise" style="animation-delay: {i * 60}ms">
				<span
					class="absolute -left-3.5 top-0 grid place-items-center size-7 rounded-full bg-primary-500 text-white text-xs font-mono font-bold shadow-[0_0_12px_rgba(229,50,45,0.7)]"
				>
					{i + 1}
				</span>
				<h3 class="font-semibold">{t(step.title)}</h3>
				<p class="text-sm text-surface-600-400 mt-0.5">{t(step.body)}</p>
				{#if i === 0}
					<a
						class="btn btn-sm preset-outlined-primary-500 mt-2"
						{...{ href: PAINT_A_GALAXY_WORKSHOP_URL }}
						target="_blank"
						rel="noreferrer"
					>
						<Icons.ExternalLink class="size-3.5" />
						Paint a Galaxy · Steam Workshop
					</a>
				{/if}
				{#if i === 1}
					<button
						class="btn btn-sm preset-filled-primary-500 mt-2"
						onclick={() => ui.open('export')}
					>
						<Icons.Package class="size-3.5" />
						{t('Export')}
					</button>
				{/if}
				{#if step.code}
					<div
						class="mt-2 rounded-md bg-surface-100-900 border border-surface-200-800 p-2 font-mono text-xs flex flex-col gap-1"
					>
						{#each step.code as line (line)}
							<span>{line}</span>
						{/each}
					</div>
				{/if}
			</li>
		{/each}
	</ol>
	<div class="mt-6 sf-panel p-3">
		<div class="sf-tag mb-2">{t('Tips')}</div>
		<ul class="flex flex-col gap-1.5 text-sm text-surface-600-400">
			{#each tips as tip (tip)}
				<li class="flex gap-2">
					<span class="text-primary-500">▸</span>
					{t(tip)}
				</li>
			{/each}
		</ul>
	</div>
</Modal>
