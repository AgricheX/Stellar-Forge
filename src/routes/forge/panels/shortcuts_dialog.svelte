<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { tool_pairs } from '$lib/models/tool';

	const groups: { title: string; items: [string, string][] }[] = [
		{
			title: 'General',
			items: [
				['Ctrl K  /', 'Command bar'],
				['?', 'This list'],
				['Ctrl Z', 'Undo'],
				['Ctrl Y  Ctrl Shift Z', 'Redo'],
				['Ctrl G', 'Generate all'],
				['Ctrl E', 'Export'],
				['Alt 1 · 2 · 3', 'Go to Paint, Generate or Tweak'],
				['Alt S', 'System Forge'],
			],
		},
		{
			title: 'Camera',
			items: [
				['W A S D  ←↑↓→', 'Move the camera'],
				['Space + drag', 'Pan with the mouse'],
				['Mouse wheel', 'Zoom'],
				['+  −', 'Zoom in and out'],
				['0', 'Reset camera'],
			],
		},
		{
			title: 'Tools',
			items: [
				['1 – 9', 'Pick a tool from the current step'],
				['Shift + click', 'Use the secondary tool (erase, delete...)'],
				['X', 'Swap primary and secondary tool'],
				['[  ]', 'Smaller or bigger brush'],
				['T', 'Text and emoji'],
			],
		},
		{
			title: 'Layers',
			items: [
				['Alt L', 'Show or hide the layers panel'],
				['Shift 1 – 8', 'Show or hide a layer'],
				['Alt + click eye', 'Solo a layer'],
			],
		},
		{
			title: 'Transform box',
			items: [
				['Drag', 'Move'],
				['Corners', 'Resize'],
				['Shift', 'Keep proportion · snap rotation to 15°'],
				['Alt', 'Resize from the center'],
				['Enter', 'Apply'],
				['Esc', 'Cancel'],
			],
		},
	];

	const commands: [string, string][] = [
		[
			'spiral · espiral',
			'arms twist width core bar radius rotation tilt squash seed',
		],
		['barred · barrada', 'same as spiral, with a bar'],
		['elliptical · eliptica', 'radius squash tilt core clumps'],
		['ring · anel', 'radius thickness core squash tilt'],
		['clusters · aglomerados', 'count size radius lanes'],
		['irregular', 'blobs radius'],
		[
			'preset · modelo <name>',
			'milky way, andromeda, star wars, star trek, 40k...',
		],
		['random · aleatoria', 'seed'],
		['text · texto "..."', 'font bold'],
		[
			'circle polygon star rect donut arms',
			'x y radius sides points inner width height rotation strength blur erase',
		],
		['clear · limpar', ''],
		['generate · gerar', ''],
	];
</script>

<Modal
	open={ui.panel === 'shortcuts'}
	title={t('Keyboard Shortcuts')}
	tag="Stellar Forge"
	width="xl"
	on_close={() => ui.close()}
>
	<div class="grid md:grid-cols-2 gap-x-8 gap-y-5">
		{#each groups as group (group.title)}
			<section>
				<h3 class="sf-tag text-primary-500! mb-2">{t(group.title)}</h3>
				<ul class="flex flex-col gap-1.5">
					{#each group.items as [keys, label] (keys)}
						<li class="flex items-center justify-between gap-3 text-sm">
							<span class="text-surface-700-300">{t(label)}</span>
							<span class="flex flex-wrap justify-end gap-1">
								{#each keys.split('  ') as key (key)}
									<span class="sf-kbd">{t(key)}</span>
								{/each}
							</span>
						</li>
					{/each}
				</ul>
			</section>
		{/each}
		<section>
			<h3 class="sf-tag text-primary-500! mb-2">{t('Tool keys')}</h3>
			<ul class="grid grid-cols-2 gap-x-4 gap-y-1.5">
				{#each tool_pairs as pair (pair.id)}
					<li class="flex items-center justify-between gap-2 text-sm">
						<span class="text-surface-700-300 truncate">{t(pair.name)}</span>
						<span class="sf-kbd">{pair.key}</span>
					</li>
				{/each}
			</ul>
		</section>
	</div>
	<section class="mt-6">
		<h3 class="sf-tag text-primary-500! mb-2">{t('Commands')} (Ctrl K)</h3>
		<div class="rounded-md border border-surface-200-800 overflow-hidden">
			{#each commands as [command, params] (command)}
				<div
					class="grid grid-cols-[minmax(0,14rem)_1fr] gap-3 px-3 py-1.5 text-xs font-mono border-b border-surface-200-800 last:border-b-0 odd:bg-surface-100-900/40"
				>
					<span class="text-surface-950-50">{command}</span>
					<span class="text-surface-500">{t(params)}</span>
				</div>
			{/each}
		</div>
		<p class="text-xs text-surface-500 mt-2">
			{t(
				'Values: key=value. Percentages work too (core=15%). x and y are measured from the center of the map. Add stars=N to generate right away.',
			)}
		</p>
	</section>
</Modal>
