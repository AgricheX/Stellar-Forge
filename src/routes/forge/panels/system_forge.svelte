<script lang="ts">
	import Modal from '$lib/components/modal.svelte';
	import { Icons } from '$lib/components/icons';
	import { get_editor } from '$lib/editor.svelte';
	import { t } from '$lib/i18n/index.svelte';
	import { ui } from '$lib/ui.svelte';
	import { toaster } from '$lib/toaster';
	import { download_blob } from '$lib/blob';
	import { Action } from '$lib/models/action';
	import { SolarSystem, SolarSystemId } from '$lib/models/solar_system';
	import type { CustomSystem } from '$lib/models/custom_system';
	import {
		BELT_TYPES,
		IDEAL_CLASS,
		PLANET_CLASSES,
		STAR_BODY_CLASSES,
		STAR_CLASSES,
		planet_info,
		star_info,
	} from '$lib/system/data';
	import {
		blank_system,
		clone_system,
		home_system,
		make_body,
		make_moon,
		random_system,
		uid,
	} from '$lib/system/templates';
	import {
		has_home_planet,
		initializers_file,
		make_system_key,
		system_code,
	} from '$lib/system/initializers';
	import { import_initializers } from '$lib/system/import';
	import { Option } from 'effect';

	type Draft = {
		key: string;
		name: string;
		star_class: string;
		star_size: number;
		bodies: {
			id: string;
			kind: 'star' | 'planet';
			name: string;
			class: string;
			orbit: number;
			angle: number;
			size: number;
			ring: boolean;
			home: boolean;
			moons: {
				id: string;
				name: string;
				class: string;
				orbit: number;
				angle: number;
				size: number;
			}[];
		}[];
		belts: { id: string; type: string; radius: number }[];
	};

	const editor = get_editor();
	const project = $derived(editor().project);
	const open = $derived(ui.panel === 'system');

	let systems = $state<Draft[]>([]);
	let current_key = $state<string | null>(null);
	let selected = $state<{ kind: 'body' | 'belt'; id: string } | null>(null);
	let view_zoom = $state(1);
	let show_code = $state(false);
	let dragging = $state<{ kind: 'body' | 'belt'; id: string } | null>(null);
	let svg = $state<SVGSVGElement>();
	let file_input = $state<HTMLInputElement>();
	let commit_timer: ReturnType<typeof setTimeout> | null = null;
	let was_open = false;
	let last_committed = '[]';

	const current = $derived(
		systems.find((system) => system.key === current_key) ?? systems[0],
	);
	const selected_body = $derived(
		selected?.kind === 'body' ?
			current?.bodies.find((body) => body.id === selected?.id)
		:	undefined,
	);
	const selected_belt = $derived(
		selected?.kind === 'belt' ?
			current?.belts.find((belt) => belt.id === selected?.id)
		:	undefined,
	);
	const assign_target = $derived(
		ui.system_assign == null ?
			Option.none()
		:	project.get_solar_system(SolarSystemId.make(ui.system_assign)),
	);

	function to_draft(system: CustomSystem): Draft {
		return clone_system(system) as Draft;
	}

	$effect(() => {
		if (open && !was_open) {
			systems = project.custom_systems.map(to_draft);
			last_committed = JSON.stringify(project.custom_systems);
			current_key =
				ui.system_focus && systems.some((s) => s.key === ui.system_focus) ?
					ui.system_focus
				:	(systems[0]?.key ?? null);
			selected = null;
			show_code = false;
		}
		if (!open && was_open) flush();
		was_open = open;
	});

	function usage_count(key: string): number {
		return project.solar_systems.filter((system) =>
			system.initializer.pipe(Option.contains(key)),
		).length;
	}

	function schedule_commit() {
		if (commit_timer) clearTimeout(commit_timer);
		commit_timer = setTimeout(flush, 400);
	}

	function flush(extra: Action[] = []) {
		if (commit_timer) {
			clearTimeout(commit_timer);
			commit_timer = null;
		}
		const new_value = $state.snapshot(systems) as CustomSystem[];
		const serialized = JSON.stringify(new_value);
		if (serialized === last_committed && extra.length === 0) return;
		const old_value = JSON.parse(last_committed) as CustomSystem[];
		last_committed = serialized;
		void editor().apply_actions([
			new Action.SetCustomSystemsAction({ old_value, new_value }),
			...extra,
		]);
	}

	function update_assignments(
		old_key: string,
		new_key: string | null,
	): Action[] {
		return editor()
			.project.solar_systems.filter((system) =>
				system.initializer.pipe(Option.contains(old_key)),
			)
			.map(
				(system) =>
					new Action.UpdateSolarSystemAction({
						old_value: system,
						new_value: new SolarSystem({
							...system,
							locked: false,
							initializer:
								new_key == null ? Option.none() : Option.some(new_key),
						}),
					}),
			);
	}

	function add_system(kind: 'blank' | 'home' | 'random') {
		const name =
			kind === 'home' ? t('Home System')
			: kind === 'random' ? t('Random System')
			: t('New System');
		const key = make_system_key(
			`${name} ${systems.length + 1}`,
			systems.map((s) => s.key),
		);
		const system =
			kind === 'home' ? home_system(name, key)
			: kind === 'random' ? random_system(name, key)
			: blank_system(name, key);
		systems.push(to_draft(system));
		current_key = key;
		selected = null;
		schedule_commit();
	}

	function duplicate_system() {
		if (!current) return;
		const copy = to_draft(current as CustomSystem);
		copy.name = `${current.name} 2`;
		copy.key = make_system_key(
			copy.name,
			systems.map((s) => s.key),
		);
		for (const body of copy.bodies) body.id = uid();
		for (const belt of copy.belts) belt.id = uid();
		systems.push(copy);
		current_key = copy.key;
		schedule_commit();
	}

	function delete_system() {
		if (!current) return;
		const key = current.key;
		const used = usage_count(key);
		if (
			used > 0 &&
			!confirm(
				t('{n} systems on the map use this design. Delete it anyway?', {
					n: used,
				}),
			)
		)
			return;
		systems = systems.filter((s) => s.key !== key);
		current_key = systems[0]?.key ?? null;
		selected = null;
		flush(update_assignments(key, null));
	}

	function reroll() {
		if (!current) return;
		const fresh = to_draft(random_system(current.name, current.key));
		current.star_class = fresh.star_class;
		current.star_size = fresh.star_size;
		current.bodies = fresh.bodies;
		current.belts = fresh.belts;
		selected = null;
		schedule_commit();
	}

	function rename_key(value: string) {
		if (!current) return;
		const old_key = current.key;
		const cleaned = value
			.toLowerCase()
			.replace(/[^a-z0-9_]+/g, '_')
			.replace(/^_+|_+$/g, '');
		if (!cleaned || cleaned === old_key) return;
		const new_key = make_system_key(
			cleaned.replace(/^sf_/, ''),
			systems.filter((s) => s !== current).map((s) => s.key),
		);
		current.key = new_key;
		current_key = new_key;
		flush(update_assignments(old_key, new_key));
	}

	function add_body(kind: 'star' | 'planet') {
		if (!current) return;
		const outer = Math.max(
			current.star_size + 10,
			...current.bodies.map((b) => b.orbit),
			...current.belts.map((b) => b.radius),
		);
		const body = make_body(
			kind === 'star' ?
				{
					kind,
					class: 'pc_m_star',
					size: 14,
					orbit: Math.round(outer + 30),
					angle: 180,
				}
			:	{
					orbit: Math.round(outer + 25),
					angle: Math.round(Math.random() * 360),
				},
		);
		current.bodies.push(body as Draft['bodies'][number]);
		selected = { kind: 'body', id: body.id };
		schedule_commit();
	}

	function add_belt() {
		if (!current) return;
		const belt = { id: uid(), type: 'rocky_asteroid_belt', radius: 90 };
		current.belts.push(belt);
		selected = { kind: 'belt', id: belt.id };
		schedule_commit();
	}

	function remove_selected() {
		if (!current || !selected) return;
		const id = selected.id;
		if (selected.kind === 'body')
			current.bodies = current.bodies.filter((b) => b.id !== id);
		else current.belts = current.belts.filter((b) => b.id !== id);
		selected = null;
		schedule_commit();
	}

	function set_home(body: Draft['bodies'][number], value: boolean) {
		if (!current) return;
		for (const other of current.bodies) other.home = false;
		body.home = value;
		if (value && body.kind === 'planet') {
			body.class = IDEAL_CLASS;
			body.size = Math.max(body.size, 20);
		}
		schedule_commit();
	}

	function pointer_to_polar(e: PointerEvent) {
		if (!svg) return { orbit: 0, angle: 0 };
		const point = svg.createSVGPoint();
		point.x = e.clientX;
		point.y = e.clientY;
		const matrix = svg.getScreenCTM();
		if (!matrix) return { orbit: 0, angle: 0 };
		const local = point.matrixTransform(matrix.inverse());
		const orbit = Math.hypot(local.x, local.y);
		let angle = (Math.atan2(local.y, local.x) * 180) / Math.PI;
		if (angle < 0) angle += 360;
		return { orbit, angle };
	}

	function on_pointer_move(e: PointerEvent) {
		if (!dragging || !current) return;
		const { orbit, angle } = pointer_to_polar(e);
		const snap = e.shiftKey ? 5 : 1;
		if (dragging.kind === 'body') {
			const body = current.bodies.find((b) => b.id === dragging?.id);
			if (!body) return;
			body.orbit = Math.max(5, Math.round(orbit / snap) * snap);
			body.angle =
				Math.round(angle / (e.shiftKey ? 15 : 1)) * (e.shiftKey ? 15 : 1);
		} else {
			const belt = current.belts.find((b) => b.id === dragging?.id);
			if (belt) belt.radius = Math.max(10, Math.round(orbit / snap) * snap);
		}
	}

	function on_pointer_up() {
		if (dragging) schedule_commit();
		dragging = null;
	}

	function polar(orbit: number, angle: number) {
		const radians = (angle * Math.PI) / 180;
		return { x: Math.cos(radians) * orbit, y: Math.sin(radians) * orbit };
	}

	const view_radius = $derived(
		Math.max(
			120,
			...(current?.bodies.map((b) => b.orbit + b.size / 2 + 20) ?? []),
			...(current?.belts.map((b) => b.radius + 20) ?? []),
		) / view_zoom,
	);

	function body_radius(size: number) {
		return Math.max(2.5, size * 0.32);
	}

	function moon_position(
		body: Draft['bodies'][number],
		moon: Draft['bodies'][number]['moons'][number],
	) {
		const center = polar(body.orbit, body.angle);
		const offset = polar(body_radius(body.size) + moon.orbit * 0.9, moon.angle);
		return { x: center.x + offset.x, y: center.y + offset.y };
	}

	function download_txt() {
		if (systems.length === 0) return;
		flush();
		const txt = initializers_file(
			$state.snapshot(systems) as CustomSystem[],
			`${project.name} · custom systems made with Stellar Forge`,
		);
		download_blob(
			new Blob([txt], { type: 'text/plain' }),
			'stellar_forge_systems.txt',
		);
	}

	async function copy_code() {
		if (!current) return;
		await navigator.clipboard.writeText(
			system_code($state.snapshot(current) as CustomSystem),
		);
		toaster.success({ title: t('Copied') });
	}

	async function import_file(file: File) {
		try {
			const imported = import_initializers(await file.text());
			if (imported.length === 0) {
				toaster.error({ title: t('No star systems found in this file.') });
				return;
			}
			for (const system of imported) {
				const draft = to_draft(system);
				const taken = systems.map((s) => s.key);
				draft.key =
					/^[a-z0-9_]+$/i.test(system.key) && !taken.includes(system.key) ?
						system.key
					:	make_system_key(system.key.replace(/^sf_/, ''), taken);
				systems.push(draft);
			}
			current_key = systems.at(-1)?.key ?? null;
			selected = null;
			schedule_commit();
			toaster.success({
				title: t('Imported {n} systems', { n: imported.length }),
			});
		} catch (e) {
			toaster.error({
				title: t('Import failed'),
				description: e instanceof Error ? e.message : String(e),
			});
		}
	}

	function assign_to_target() {
		if (!current || Option.isNone(assign_target)) return;
		const target = assign_target.value;
		flush([
			new Action.UpdateSolarSystemAction({
				old_value: target,
				new_value: new SolarSystem({
					...target,
					locked: false,
					initializer: Option.some(current.key),
				}),
			}),
		]);
		toaster.success({
			title: t('System design applied'),
			description: `${current.name} → #${target.id}`,
		});
		ui.system_assign = null;
		ui.close();
	}

	function on_wheel(e: WheelEvent) {
		e.preventDefault();
		view_zoom = Math.min(
			Math.max(view_zoom * (e.deltaY < 0 ? 1.12 : 1 / 1.12), 0.4),
			6,
		);
	}

	function on_key(e: KeyboardEvent) {
		if (!open) return;
		const target = e.target as HTMLElement | null;
		if (
			target &&
			(target.tagName === 'INPUT' ||
				target.tagName === 'SELECT' ||
				target.tagName === 'TEXTAREA')
		)
			return;
		if ((e.key === 'Delete' || e.key === 'Backspace') && selected) {
			e.preventDefault();
			remove_selected();
		}
		if (e.key === 'p' || e.key === 'P') add_body('planet');
		if (e.key === 'b' || e.key === 'B') add_belt();
		if (e.key === 'r' || e.key === 'R') reroll();
	}
</script>

<svelte:window
	onkeydown={on_key}
	onpointermove={on_pointer_move}
	onpointerup={on_pointer_up}
/>

<input
	bind:this={file_input}
	type="file"
	accept=".txt"
	class="hidden"
	onchange={(e) => {
		const file = e.currentTarget.files?.[0];
		if (file) void import_file(file);
		e.currentTarget.value = '';
	}}
/>

<Modal
	{open}
	title={t('System Forge')}
	subtitle={t(
		'Design star systems planet by planet and use them anywhere on your map.',
	)}
	tag={t('System mode')}
	width="full"
	flush
	on_close={() => {
		flush();
		ui.system_assign = null;
		ui.close();
	}}
>
	<div class="grid grid-cols-[16.5rem_1fr_23rem] h-full min-h-0">
		<aside
			class="flex flex-col min-h-0 border-e border-surface-200-800 bg-surface-100-900/40"
		>
			<div class="grid grid-cols-3 gap-1 p-2 border-b border-surface-200-800">
				<button
					class="btn btn-sm preset-filled-primary-500 px-1 text-xs"
					onclick={() => add_system('blank')}
				>
					<Icons.Plus class="size-3.5 shrink-0" />{t('New')}
				</button>
				<button
					class="btn btn-sm preset-tonal px-1 text-xs"
					title={t('Home system template')}
					onclick={() => add_system('home')}
				>
					<Icons.House class="size-3.5 shrink-0" />{t('Home')}
				</button>
				<button
					class="btn btn-sm preset-tonal px-1 text-xs"
					onclick={() => add_system('random')}
				>
					<Icons.Dices class="size-3.5 shrink-0" />{t('Random')}
				</button>
			</div>
			<ul class="grow overflow-auto p-1.5 flex flex-col gap-1">
				{#each systems as system (system.key)}
					{@const star = star_info(system.star_class)}
					{@const used = usage_count(system.key)}
					<li>
						<button
							class={[
								'w-full text-left rounded-md px-2.5 py-2 flex items-center gap-2.5 border transition-colors',
								system.key === current?.key ?
									'border-primary-500/70 bg-primary-500/10'
								:	'border-transparent hover:bg-surface-200-800/60',
							]}
							onclick={() => {
								current_key = system.key;
								selected = null;
							}}
						>
							<span
								class="size-3.5 rounded-full shrink-0"
								style:background={star.color}
								style:box-shadow="0 0 10px {star.color}"
							></span>
							<span class="min-w-0 grow">
								<span class="block text-sm font-semibold truncate">
									{system.name || system.key}
								</span>
								<span
									class="block font-mono text-[0.65rem] text-surface-500 truncate"
								>
									{system.bodies.length}
									{t('bodies')}{used ? ` · ${used} ${t('on map')}` : ''}
								</span>
							</span>
							{#if has_home_planet(system as CustomSystem)}
								<Icons.House class="size-3.5 text-primary-500 shrink-0" />
							{/if}
						</button>
					</li>
				{:else}
					<li class="text-sm text-surface-500 p-3 leading-relaxed">
						{t(
							'No systems yet. Create one, pick the home template or roll a random one.',
						)}
					</li>
				{/each}
			</ul>
			<div class="p-2 border-t border-surface-200-800 flex flex-col gap-1">
				<button
					class="btn btn-sm preset-tonal text-xs justify-start"
					onclick={() => file_input?.click()}
				>
					<Icons.FolderOpen class="size-3.5 shrink-0" />{t(
						'Import .txt (Solar System Editor)',
					)}
				</button>
				<button
					class="btn btn-sm preset-tonal text-xs justify-start"
					disabled={systems.length === 0}
					onclick={download_txt}
				>
					<Icons.Download class="size-3.5 shrink-0" />{t('Download all (.txt)')}
				</button>
			</div>
		</aside>

		<section class="relative min-h-0 min-w-0 flex flex-col bg-[#08080a]">
			{#if current}
				<div
					class="absolute top-3 left-3 right-3 z-10 flex flex-wrap items-center gap-1.5"
				>
					<button
						class="btn btn-sm preset-tonal sf-glass"
						title="P"
						onclick={() => add_body('planet')}
					>
						<Icons.Globe class="size-4" />{t('Planet')}
					</button>
					<button
						class="btn btn-sm preset-tonal sf-glass"
						onclick={() => add_body('star')}
					>
						<Icons.Sun class="size-4" />{t('Companion star')}
					</button>
					<button
						class="btn btn-sm preset-tonal sf-glass"
						title="B"
						onclick={add_belt}
					>
						<Icons.CircleDot class="size-4" />{t('Asteroid belt')}
					</button>
					<button
						class="btn btn-sm preset-tonal sf-glass"
						title="R"
						onclick={reroll}
					>
						<Icons.Dices class="size-4" />{t('Reroll')}
					</button>
					<span class="grow"></span>
					<button
						class="sf-icon-btn sf-glass"
						title={t('Zoom out')}
						onclick={() => (view_zoom = Math.max(view_zoom / 1.25, 0.4))}
					>
						<Icons.Minus class="size-4" />
					</button>
					<span class="font-mono text-xs w-12 text-center">
						{Math.round(view_zoom * 100)}%
					</span>
					<button
						class="sf-icon-btn sf-glass"
						title={t('Zoom in')}
						onclick={() => (view_zoom = Math.min(view_zoom * 1.25, 6))}
					>
						<Icons.Plus class="size-4" />
					</button>
					<button
						class="sf-icon-btn sf-glass"
						aria-pressed={show_code}
						title={t('Show code')}
						onclick={() => (show_code = !show_code)}
					>
						<Icons.FileText class="size-4" />
					</button>
				</div>
				{@const star = star_info(current.star_class)}
				<svg
					bind:this={svg}
					class="grow w-full h-full select-none touch-none"
					viewBox="{-view_radius} {-view_radius} {view_radius *
						2} {view_radius * 2}"
					role="application"
					onwheel={on_wheel}
					onpointerdown={(e) => {
						if (e.target === svg) selected = null;
					}}
				>
					<defs>
						<radialGradient id="sf-star-glow">
							<stop offset="0" stop-color={star.color} stop-opacity="0.9" />
							<stop offset="0.35" stop-color={star.color} stop-opacity="0.25" />
							<stop offset="1" stop-color={star.color} stop-opacity="0" />
						</radialGradient>
						<pattern
							id="sf-grid"
							width="20"
							height="20"
							patternUnits="userSpaceOnUse"
						>
							<path
								d="M 20 0 L 0 0 0 20"
								fill="none"
								stroke="rgba(255,255,255,0.035)"
								stroke-width="0.4"
							/>
						</pattern>
					</defs>
					<rect
						x={-view_radius}
						y={-view_radius}
						width={view_radius * 2}
						height={view_radius * 2}
						fill="url(#sf-grid)"
						pointer-events="none"
					/>
					{#each current.belts as belt (belt.id)}
						{@const type =
							BELT_TYPES.find((b) => b.id === belt.type) ?? BELT_TYPES[0]}
						{@const active =
							selected?.kind === 'belt' && selected.id === belt.id}
						<circle
							r={belt.radius}
							fill="none"
							stroke={type.color}
							stroke-opacity={active ? 0.8 : 0.45}
							stroke-width="6"
							stroke-dasharray="1 2.5"
							class="cursor-grab outline-none"
							role="button"
							tabindex="-1"
							onpointerdown={(e) => {
								e.stopPropagation();
								selected = { kind: 'belt', id: belt.id };
								dragging = { kind: 'belt', id: belt.id };
							}}
						/>
						{#if active}
							<circle
								r={belt.radius}
								fill="none"
								stroke="#e5322d"
								stroke-width="0.6"
								stroke-dasharray="3 3"
								pointer-events="none"
							/>
						{/if}
					{/each}
					{#each current.bodies as body (body.id)}
						<circle
							r={body.orbit}
							fill="none"
							stroke="rgba(255,255,255,0.12)"
							stroke-width="0.5"
							pointer-events="none"
						/>
					{/each}
					<circle
						r={current.star_size * 1.8}
						fill="url(#sf-star-glow)"
						pointer-events="none"
					/>
					<circle
						r={current.star_size * 0.42}
						fill={star.color}
						stroke={current.star_class === 'sc_black_hole' ? '#ff8a3a' : 'none'}
						stroke-width="1.2"
						pointer-events="none"
					/>
					{#each current.bodies as body (body.id)}
						{@const position = polar(body.orbit, body.angle)}
						{@const info = planet_info(
							body.kind === 'star' ? body.class : body.class,
						)}
						{@const r = body_radius(body.size)}
						{@const active =
							selected?.kind === 'body' && selected.id === body.id}
						<g
							transform="translate({position.x} {position.y})"
							class="cursor-grab outline-none"
							role="button"
							tabindex="-1"
							onpointerdown={(e) => {
								e.stopPropagation();
								selected = { kind: 'body', id: body.id };
								dragging = { kind: 'body', id: body.id };
							}}
						>
							{#if body.kind === 'star'}
								<circle r={r * 3} fill={info.color} opacity="0.18" />
							{/if}
							{#if body.ring}
								<ellipse
									rx={r * 1.9}
									ry={r * 0.55}
									fill="none"
									stroke="#d8c8a8"
									stroke-opacity="0.7"
									stroke-width={Math.max(0.6, r * 0.18)}
								/>
							{/if}
							<circle
								{r}
								fill={info.color}
								stroke={active ? '#e5322d' : 'rgba(0,0,0,0.4)'}
								stroke-width={active ? 1.4 : 0.5}
							/>
							{#if body.home}
								<circle
									r={r + 3}
									fill="none"
									stroke="#e5322d"
									stroke-width="0.8"
									stroke-dasharray="2 1.5"
								/>
							{/if}
							{#if active}
								<circle
									r={r + 6}
									fill="none"
									stroke="#e5322d"
									stroke-opacity="0.5"
									stroke-width="0.5"
								/>
							{/if}
						</g>
						{#each body.moons as moon (moon.id)}
							{@const m = moon_position(body, moon)}
							<circle
								cx={m.x}
								cy={m.y}
								r={Math.max(1.2, moon.size * 0.22)}
								fill={planet_info(moon.class).color}
								pointer-events="none"
							/>
						{/each}
						{#if view_zoom > 0.7}
							<text
								x={position.x}
								y={position.y + r + 7}
								text-anchor="middle"
								font-size={5.5 / Math.sqrt(view_zoom)}
								fill={active ? '#ffffff' : 'rgba(255,255,255,0.6)'}
								font-family="Inter"
								pointer-events="none"
							>
								{body.name || (body.home ? t('Home world') : t(info.name))}
							</text>
						{/if}
					{/each}
				</svg>
				<p
					class="absolute bottom-3 left-3 text-[0.7rem] text-surface-500 sf-glass px-2 py-1 pointer-events-none"
				>
					{t(
						'Drag planets to change their orbit and angle. Shift snaps. Wheel zooms. Delete removes.',
					)}
				</p>
				{#if show_code}
					<pre
						class="absolute top-14 right-3 bottom-3 w-[26rem] max-w-[60%] overflow-auto sf-glass p-3 text-[0.7rem] font-mono leading-relaxed sf-fade-in">{system_code(
							$state.snapshot(current) as CustomSystem,
						)}</pre>
				{/if}
			{:else}
				<div class="grow grid place-items-center p-8 text-center">
					<div class="max-w-sm flex flex-col items-center gap-3">
						<Icons.Orbit class="size-14 text-primary-500" />
						<h3 class="text-lg font-bold">
							{t('Forge your first star system')}
						</h3>
						<p class="text-sm text-surface-500">
							{t(
								'Pick a star, place planets and moons, add asteroid belts and mark a home world. Then use the design on any system of your map.',
							)}
						</p>
						<div class="flex gap-2 mt-2">
							<button
								class="btn preset-filled-primary-500 sf-btn-glow"
								onclick={() => add_system('home')}
							>
								<Icons.House class="size-4" />{t('Home system')}
							</button>
							<button
								class="btn preset-tonal"
								onclick={() => add_system('random')}
							>
								<Icons.Dices class="size-4" />{t('Random')}
							</button>
						</div>
					</div>
				</div>
			{/if}
		</section>

		<aside
			class="min-h-0 overflow-auto border-s border-surface-200-800 p-4 flex flex-col gap-4"
		>
			{#if current}
				<section class="flex flex-col gap-2.5">
					<div class="sf-tag">{t('System')}</div>
					<label class="flex flex-col gap-1">
						<span class="label-text text-xs">{t('Name')}</span>
						<input
							class="input bg-surface-100-900 ring-surface-200-800"
							bind:value={current.name}
							oninput={schedule_commit}
						/>
					</label>
					<label class="flex flex-col gap-1">
						<span class="label-text text-xs">{t('Initializer ID')}</span>
						<input
							class="input bg-surface-100-900 ring-surface-200-800 font-mono text-xs"
							value={current.key}
							onchange={(e) => rename_key(e.currentTarget.value)}
						/>
					</label>
					<div class="grid grid-cols-[1fr_6rem] gap-2">
						<label class="flex flex-col gap-1">
							<span class="label-text text-xs">{t('Star')}</span>
							<select
								class="select bg-surface-100-900 ring-surface-200-800 text-sm"
								bind:value={current.star_class}
								onchange={schedule_commit}
							>
								{#each STAR_CLASSES as option (option.id)}
									<option value={option.id}>{t(option.name)}</option>
								{/each}
							</select>
						</label>
						<label class="flex flex-col gap-1">
							<span class="label-text text-xs">{t('Size')}</span>
							<input
								type="number"
								min="5"
								max="60"
								class="input bg-surface-100-900 ring-surface-200-800"
								bind:value={current.star_size}
								onchange={schedule_commit}
							/>
						</label>
					</div>
					<div class="flex gap-1.5">
						<button
							class="btn btn-sm preset-tonal grow text-xs"
							onclick={duplicate_system}
						>
							<Icons.Copy class="size-3.5 shrink-0" />{t('Duplicate')}
						</button>
						<button
							class="btn btn-sm preset-tonal grow text-xs"
							onclick={copy_code}
						>
							<Icons.FileText class="size-3.5 shrink-0" />{t('Copy code')}
						</button>
						<button
							class="btn btn-sm preset-tonal text-xs hover:text-error-500"
							title={t('Delete')}
							onclick={delete_system}
						>
							<Icons.Trash class="size-3.5 shrink-0" />
						</button>
					</div>
				</section>

				{#if selected_body}
					{@const body = selected_body}
					{@const classes =
						body.kind === 'star' ? STAR_BODY_CLASSES : PLANET_CLASSES}
					<section
						class="flex flex-col gap-2.5 sf-panel sf-accent-bar p-3 ps-4 sf-fade-in"
					>
						<div class="flex items-center justify-between">
							<div class="sf-tag">
								{body.kind === 'star' ? t('Companion star') : t('Planet')}
							</div>
							<button
								class="sf-icon-btn size-7! hover:text-error-500"
								title={t('Delete')}
								onclick={remove_selected}
							>
								<Icons.Trash class="size-3.5 shrink-0" />
							</button>
						</div>
						<label class="flex flex-col gap-1">
							<span class="label-text text-xs">{t('Name')}</span>
							<input
								class="input bg-surface-100-900 ring-surface-200-800"
								placeholder={t('Automatic')}
								bind:value={body.name}
								oninput={schedule_commit}
							/>
						</label>
						<label class="flex flex-col gap-1">
							<span class="label-text text-xs">{t('Class')}</span>
							<select
								class="select bg-surface-100-900 ring-surface-200-800 text-sm"
								bind:value={body.class}
								onchange={schedule_commit}
							>
								{#if body.kind === 'planet'}
									<option value={IDEAL_CLASS}>
										{t('Species ideal class')}
									</option>
								{/if}
								{#each classes as option (option.id)}
									<option value={option.id}>{t(option.name)}</option>
								{/each}
								{#if !classes.some((c) => c.id === body.class) && body.class !== IDEAL_CLASS}
									<option value={body.class}>{body.class}</option>
								{/if}
							</select>
						</label>
						<div class="grid grid-cols-3 gap-2">
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Orbit')}</span>
								<input
									type="number"
									min="5"
									class="input bg-surface-100-900 ring-surface-200-800 px-2"
									bind:value={body.orbit}
									onchange={schedule_commit}
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Angle')}</span>
								<input
									type="number"
									class="input bg-surface-100-900 ring-surface-200-800 px-2"
									bind:value={body.angle}
									onchange={schedule_commit}
								/>
							</label>
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Size')}</span>
								<input
									type="number"
									min="1"
									max="60"
									class="input bg-surface-100-900 ring-surface-200-800 px-2"
									bind:value={body.size}
									onchange={schedule_commit}
								/>
							</label>
						</div>
						<div class="flex flex-wrap gap-x-4 gap-y-1.5 text-sm">
							<label class="flex items-center gap-2 cursor-pointer">
								<input
									type="checkbox"
									class="checkbox size-4"
									bind:checked={body.ring}
									onchange={schedule_commit}
								/>
								{t('Ring')}
							</label>
							{#if body.kind === 'planet'}
								<label class="flex items-center gap-2 cursor-pointer">
									<input
										type="checkbox"
										class="checkbox size-4"
										checked={body.home}
										onchange={(e) => set_home(body, e.currentTarget.checked)}
									/>
									{t('Home world')}
								</label>
							{/if}
						</div>
						{#if body.home}
							<p class="text-xs text-surface-500">
								{t(
									'The empire that spawns here starts on this planet. Put the system on a spawn point of your map.',
								)}
							</p>
						{/if}
						{#if body.kind === 'planet'}
							<div class="flex items-center justify-between mt-1">
								<span class="sf-tag">{t('Moons')} ({body.moons.length})</span>
								<button
									class="btn btn-sm preset-tonal h-7 text-xs"
									onclick={() => {
										const last = body.moons.at(-1);
										body.moons.push(
											make_moon({
												orbit: (last?.orbit ?? 2) + 4,
												angle: Math.round(Math.random() * 360),
											}),
										);
										schedule_commit();
									}}
								>
									<Icons.Plus class="size-3.5 shrink-0" />{t('Moon')}
								</button>
							</div>
							{#each body.moons as moon, i (moon.id)}
								<div
									class="grid grid-cols-[1fr_3.2rem_3.2rem_1.75rem] gap-1 items-end"
								>
									<label class="flex flex-col gap-0.5">
										{#if i === 0}<span class="label-text text-[0.65rem]">
												{t('Class')}
											</span>{/if}
										<select
											class="select h-8 py-0 bg-surface-100-900 ring-surface-200-800 text-xs"
											bind:value={moon.class}
											onchange={schedule_commit}
										>
											{#each PLANET_CLASSES as option (option.id)}
												<option value={option.id}>{t(option.name)}</option>
											{/each}
										</select>
									</label>
									<label class="flex flex-col gap-0.5">
										{#if i === 0}<span class="label-text text-[0.65rem]">
												{t('Size')}
											</span>{/if}
										<input
											type="number"
											min="1"
											class="input h-8 px-1.5 bg-surface-100-900 ring-surface-200-800 text-xs"
											bind:value={moon.size}
											onchange={schedule_commit}
										/>
									</label>
									<label class="flex flex-col gap-0.5">
										{#if i === 0}<span class="label-text text-[0.65rem]">
												{t('Orbit')}
											</span>{/if}
										<input
											type="number"
											min="1"
											class="input h-8 px-1.5 bg-surface-100-900 ring-surface-200-800 text-xs"
											bind:value={moon.orbit}
											onchange={schedule_commit}
										/>
									</label>
									<button
										class="sf-icon-btn size-7! hover:text-error-500"
										title={t('Delete')}
										onclick={() => {
											body.moons = body.moons.filter((m) => m.id !== moon.id);
											schedule_commit();
										}}
									>
										<Icons.X class="size-3.5 shrink-0" />
									</button>
								</div>
							{/each}
						{/if}
					</section>
				{:else if selected_belt}
					{@const belt = selected_belt}
					<section
						class="flex flex-col gap-2.5 sf-panel sf-accent-bar p-3 ps-4 sf-fade-in"
					>
						<div class="flex items-center justify-between">
							<div class="sf-tag">{t('Asteroid belt')}</div>
							<button
								class="sf-icon-btn size-7! hover:text-error-500"
								title={t('Delete')}
								onclick={remove_selected}
							>
								<Icons.Trash class="size-3.5 shrink-0" />
							</button>
						</div>
						<div class="grid grid-cols-2 gap-2">
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Type')}</span>
								<select
									class="select bg-surface-100-900 ring-surface-200-800 text-sm"
									bind:value={belt.type}
									onchange={schedule_commit}
								>
									{#each BELT_TYPES as option (option.id)}
										<option value={option.id}>{t(option.name)}</option>
									{/each}
								</select>
							</label>
							<label class="flex flex-col gap-1">
								<span class="label-text text-xs">{t('Radius')}</span>
								<input
									type="number"
									min="10"
									class="input bg-surface-100-900 ring-surface-200-800"
									bind:value={belt.radius}
									onchange={schedule_commit}
								/>
							</label>
						</div>
					</section>
				{:else}
					<section class="flex flex-col gap-1.5">
						<div class="sf-tag">{t('Bodies')}</div>
						{#each current.bodies.toSorted((a, b) => a.orbit - b.orbit) as body (body.id)}
							{@const info = planet_info(body.class)}
							<button
								class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-surface-200-800/60"
								onclick={() => (selected = { kind: 'body', id: body.id })}
							>
								<span
									class="size-3 rounded-full shrink-0"
									style:background={info.color}
								></span>
								<span class="text-sm grow truncate">
									{body.name || (body.home ? t('Home world') : t(info.name))}
								</span>
								{#if body.home}<Icons.House
										class="size-3.5 text-primary-500"
									/>{/if}
								{#if body.moons.length}<span
										class="font-mono text-[0.65rem] text-surface-500"
									>
										{body.moons.length} ☾
									</span>{/if}
								<span
									class="font-mono text-[0.65rem] text-surface-500 w-8 text-right"
								>
									{body.orbit}
								</span>
							</button>
						{/each}
						{#each current.belts as belt (belt.id)}
							<button
								class="flex items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-surface-200-800/60"
								onclick={() => (selected = { kind: 'belt', id: belt.id })}
							>
								<Icons.CircleDot class="size-3 shrink-0 text-surface-500" />
								<span class="text-sm grow">{t('Asteroid belt')}</span>
								<span
									class="font-mono text-[0.65rem] text-surface-500 w-8 text-right"
								>
									{belt.radius}
								</span>
							</button>
						{/each}
						<p class="text-xs text-surface-500 mt-1">
							{t('Click a planet on the left to edit it.')}
						</p>
					</section>
				{/if}

				<section
					class="mt-auto flex flex-col gap-2 pt-3 border-t border-surface-200-800"
				>
					{#if Option.isSome(assign_target)}
						<button
							class="btn preset-filled-primary-500 sf-btn-glow"
							onclick={assign_to_target}
						>
							<Icons.Check class="size-4" />
							{t('Use on system #{id}', { id: assign_target.value.id })}
						</button>
					{/if}
					<p class="text-xs text-surface-500 leading-relaxed">
						{t(
							'To use a design, right-click a system in the Tweak step and choose Design in System Forge, or pick it under Custom system in its details. Designs are saved with the project and go into the exported mod.',
						)}
					</p>
				</section>
			{/if}
		</aside>
	</div>
</Modal>
