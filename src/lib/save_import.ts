import { unzipSync } from 'fflate';
import { Option } from 'effect';
import { Project } from './models/project';
import { SolarSystem, SolarSystemId } from './models/solar_system';
import { Connection } from './models/connection';
import { Nebula } from './models/nebula';
import { Coordinate } from './models/coordinate';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { initializer_metadata } from './data/initializer_metadata';

type Node = string | Entries;
type Entries = [string | null, Node][];

const OPEN = 123;
const CLOSE = 125;
const EQUALS = 61;
const QUOTE = 34;
const HASH = 35;
const NEWLINE = 10;

function is_space(code: number) {
	return code === 32 || code === 9 || code === 10 || code === 13;
}

function parse_block(text: string, start: number, end: number): Entries {
	const root: Entries = [];
	const stack: Entries[] = [root];
	let pending_key: string | null = null;
	let has_equals = false;
	let i = start;
	const push = (value: Node) => {
		const current = stack[stack.length - 1]!;
		if (has_equals) {
			current.push([pending_key, value]);
		} else {
			if (pending_key != null) current.push([null, pending_key]);
			current.push([null, value]);
		}
		pending_key = null;
		has_equals = false;
	};
	while (i < end) {
		const code = text.charCodeAt(i);
		if (is_space(code)) {
			i++;
			continue;
		}
		if (code === HASH) {
			while (i < end && text.charCodeAt(i) !== NEWLINE) i++;
			continue;
		}
		if (code === EQUALS) {
			has_equals = true;
			i++;
			continue;
		}
		if (code === OPEN) {
			const child: Entries = [];
			push(child);
			stack.push(child);
			i++;
			continue;
		}
		if (code === CLOSE) {
			if (pending_key != null) {
				stack[stack.length - 1]!.push([null, pending_key]);
				pending_key = null;
			}
			if (stack.length > 1) stack.pop();
			i++;
			continue;
		}
		let token: string;
		if (code === QUOTE) {
			let j = i + 1;
			while (j < end) {
				const c = text.charCodeAt(j);
				if (c === QUOTE && text.charCodeAt(j - 1) !== 92) break;
				j++;
			}
			token = text.slice(i + 1, j);
			i = j + 1;
		} else {
			let j = i;
			while (j < end) {
				const c = text.charCodeAt(j);
				if (is_space(c) || c === EQUALS || c === OPEN || c === CLOSE) break;
				j++;
			}
			token = text.slice(i, j);
			i = j;
		}
		if (has_equals) {
			push(token);
		} else {
			if (pending_key != null)
				stack[stack.length - 1]!.push([null, pending_key]);
			pending_key = token;
		}
	}
	if (pending_key != null) root.push([null, pending_key]);
	return root;
}

function block_end(text: string, open_index: number): number {
	let depth = 0;
	let in_quote = false;
	for (let i = open_index; i < text.length; i++) {
		const code = text.charCodeAt(i);
		if (in_quote) {
			if (code === QUOTE && text.charCodeAt(i - 1) !== 92) in_quote = false;
			continue;
		}
		if (code === QUOTE) in_quote = true;
		else if (code === OPEN) depth++;
		else if (code === CLOSE) {
			depth--;
			if (depth === 0) return i;
		}
	}
	return text.length;
}

function find_top_level_blocks(
	text: string,
	key: string,
	limit = Infinity,
): [number, number][] {
	const blocks: [number, number][] = [];
	const needle = `\n${key}=`;
	let from = 0;
	while (blocks.length < limit) {
		const index = text.indexOf(needle, from);
		if (index < 0) break;
		let j = index + needle.length;
		while (j < text.length && is_space(text.charCodeAt(j))) j++;
		if (text.charCodeAt(j) === OPEN) {
			const end = block_end(text, j);
			blocks.push([j + 1, end]);
			from = end;
		} else {
			from = j;
		}
	}
	return blocks;
}

function get(entries: Entries, key: string): Node | undefined {
	for (const entry of entries) if (entry[0] === key) return entry[1];
	return undefined;
}

function get_all(entries: Entries, key: string): Node[] {
	return entries.filter((entry) => entry[0] === key).map((entry) => entry[1]);
}

function as_entries(node: Node | undefined): Entries {
	return Array.isArray(node) ? node : [];
}

function as_number(node: Node | undefined, fallback = 0): number {
	if (typeof node !== 'string') return fallback;
	const value = Number.parseFloat(node);
	return Number.isNaN(value) ? fallback : value;
}

function as_text(node: Node | undefined): string {
	return typeof node === 'string' ? node : '';
}

function read_name(node: Node | undefined): string | null {
	if (typeof node === 'string') return node || null;
	const key = as_text(get(as_entries(node), 'key'));
	if (!key || key.includes('%') || key.includes('$')) return null;
	if (key.startsWith('NAME_')) return key.slice(5).replaceAll('_', ' ');
	return key;
}

export type SaveSummary = {
	name: string;
	date: string;
	version: string;
	systems: number;
	hyperlanes: number;
	wormholes: number;
	nebulas: number;
	capitals: number;
};

export type ParsedSave = {
	summary: SaveSummary;
	build: (options: SaveBuildOptions) => Promise<Project>;
};

export type SaveBuildOptions = {
	name: string;
	spawns: boolean;
	keep_initializers: boolean;
	paint: boolean;
};

type RawSystem = {
	id: number;
	x: number;
	y: number;
	name: string | null;
	initializer: string | null;
	lanes: number[];
	planets: number[];
	bypasses: number[];
};

async function read_gamestate(
	file: File,
): Promise<{ gamestate: string; meta: string }> {
	const bytes = new Uint8Array(await file.arrayBuffer());
	const decoder = new TextDecoder('utf-8');
	if (bytes[0] === 0x50 && bytes[1] === 0x4b) {
		const files = unzipSync(bytes, {
			filter: (entry) => entry.name === 'gamestate' || entry.name === 'meta',
		});
		const gamestate = files['gamestate'];
		if (!gamestate) throw new Error('This save has no gamestate file.');
		return {
			gamestate: decoder.decode(gamestate),
			meta: files['meta'] ? decoder.decode(files['meta']) : '',
		};
	}
	const text = decoder.decode(bytes);
	return { gamestate: text, meta: text.slice(0, 4000) };
}

function meta_value(meta: string, key: string): string {
	return (
		meta.match(new RegExp(`(?:^|\\n)${key}="?([^"\\n]*)"?`))?.[1]?.trim() ?? ''
	);
}

const WORMHOLE_TYPES = new Set([
	'wormhole',
	'strange_wormhole',
	'starlit_wormhole',
]);

const tick = () => new Promise((resolve) => setTimeout(resolve, 0));

export async function parse_save(
	file: File,
	on_progress: (step: string) => void = () => {},
): Promise<ParsedSave> {
	on_progress('Unpacking');
	await tick();
	const { gamestate, meta } = await read_gamestate(file);
	const text = gamestate.startsWith('\n') ? gamestate : `\n${gamestate}`;

	on_progress('Reading systems');
	await tick();
	const galactic_block = find_top_level_blocks(text, 'galactic_object', 1)[0];
	if (!galactic_block) throw new Error('No galaxy found in this save.');
	const galactic = parse_block(text, galactic_block[0], galactic_block[1]);
	const systems: RawSystem[] = [];
	for (const [key, value] of galactic) {
		if (key == null || !Array.isArray(value)) continue;
		const id = Number.parseInt(key);
		if (Number.isNaN(id)) continue;
		const type = as_text(get(value, 'type'));
		if (type && type !== 'star') continue;
		const coordinate = as_entries(get(value, 'coordinate'));
		const lanes = as_entries(get(value, 'hyperlane'))
			.map(([, lane]) => as_number(get(as_entries(lane), 'to'), -1))
			.filter((to) => to >= 0);
		const bypass_node = get(value, 'bypasses');
		const bypasses = as_entries(bypass_node)
			.map(([, b]) => as_number(b, -1))
			.filter((b) => b >= 0);
		systems.push({
			id,
			x: as_number(get(coordinate, 'x')),
			y: as_number(get(coordinate, 'y')),
			name: read_name(get(value, 'name')),
			initializer: as_text(get(value, 'initializer')) || null,
			lanes,
			planets: get_all(value, 'planet')
				.map((planet) => as_number(planet, -1))
				.filter((planet) => planet >= 0),
			bypasses,
		});
	}
	if (systems.length === 0)
		throw new Error('No solar systems found in this save.');
	const system_ids = new Set(systems.map((system) => system.id));
	const system_by_id = new Map(systems.map((system) => [system.id, system]));

	const lane_keys = new Set<string>();
	const lanes: [number, number][] = [];
	for (const system of systems) {
		for (const to of system.lanes) {
			if (!system_ids.has(to) || to === system.id) continue;
			const key = system.id < to ? `${system.id},${to}` : `${to},${system.id}`;
			if (lane_keys.has(key)) continue;
			lane_keys.add(key);
			lanes.push([system.id, to]);
		}
	}

	on_progress('Reading wormholes and nebulas');
	await tick();
	const wormholes: [number, number][] = [];
	const bypass_block = find_top_level_blocks(text, 'bypasses', 1)[0];
	if (bypass_block) {
		const bypass_owner = new Map<number, number>();
		for (const system of systems)
			for (const b of system.bypasses) bypass_owner.set(b, system.id);
		const bypasses = parse_block(text, bypass_block[0], bypass_block[1]);
		const seen = new Set<string>();
		for (const [key, value] of bypasses) {
			if (key == null || !Array.isArray(value)) continue;
			if (!WORMHOLE_TYPES.has(as_text(get(value, 'type')))) continue;
			const id = Number.parseInt(key);
			const from =
				bypass_owner.get(id) ??
				as_number(get(as_entries(get(value, 'owner')), 'id'), -1);
			const linked =
				get(value, 'linked_to') != null ?
					as_number(get(value, 'linked_to'), -1)
				:	as_number(as_entries(get(value, 'connections'))[0]?.[1], -1);
			const to = bypass_owner.get(linked);
			if (from == null || to == null || from < 0 || from === to) continue;
			if (!system_ids.has(from) || !system_ids.has(to)) continue;
			const pair = from < to ? `${from},${to}` : `${to},${from}`;
			if (seen.has(pair)) continue;
			seen.add(pair);
			wormholes.push([from, to]);
		}
	}

	const nebulas: { x: number; y: number; radius: number }[] = [];
	for (const [start, end] of find_top_level_blocks(text, 'nebula')) {
		const nebula = parse_block(text, start, end);
		const coordinate = get(nebula, 'coordinate');
		const members = get_all(nebula, 'galactic_object')
			.map((member) => system_by_id.get(as_number(member, -1)))
			.filter((member) => member != null);
		if (coordinate == null && members.length === 0) continue;
		nebulas.push({
			x:
				coordinate != null ?
					as_number(get(as_entries(coordinate), 'x'))
				:	members.reduce((sum, m) => sum + m.x, 0) / members.length,
			y:
				coordinate != null ?
					as_number(get(as_entries(coordinate), 'y'))
				:	members.reduce((sum, m) => sum + m.y, 0) / members.length,
			radius: as_number(get(nebula, 'radius'), 30),
		});
	}

	on_progress('Finding empire capitals');
	await tick();
	const capital_systems = new Set<number>();
	const planet_owner = new Map<number, number>();
	for (const system of systems)
		for (const planet of system.planets) planet_owner.set(planet, system.id);
	const country_block = find_top_level_blocks(text, 'country', 1)[0];
	if (country_block) {
		const section = text.slice(country_block[0], country_block[1]);
		const starts = [...section.matchAll(/\n\t(\d+)=\n\t\{/g)].map(
			(match) => match.index ?? 0,
		);
		for (let c = 0; c < starts.length; c++) {
			const chunk = section.slice(starts[c], starts[c + 1] ?? section.length);
			const type = chunk.match(/\n\t\ttype="([^"]+)"/)?.[1];
			if (type !== 'default') continue;
			const capital = chunk.match(/\n\t\tcapital=(\d+)/)?.[1];
			if (capital == null) continue;
			const system = planet_owner.get(Number.parseInt(capital));
			if (system != null) capital_systems.add(system);
		}
	}

	const summary: SaveSummary = {
		name: meta_value(meta, 'name') || file.name.replace(/\.sav$/i, ''),
		date: meta_value(meta, 'date'),
		version: meta_value(meta, 'version'),
		systems: systems.length,
		hyperlanes: lanes.length,
		wormholes: wormholes.length,
		nebulas: nebulas.length,
		capitals: capital_systems.size,
	};

	const build = async (options: SaveBuildOptions): Promise<Project> => {
		const extent = Math.max(
			1,
			...systems.map((system) =>
				Math.max(Math.abs(system.x), Math.abs(system.y)),
			),
		);
		const limit = Math.min(CANVAS_WIDTH, CANVAS_HEIGHT) / 2 - 15;
		const scale = extent > limit ? limit / extent : 1;
		const id_map = new Map<number, SolarSystemId>();
		const used = new Set<string>();
		const solar_systems = systems.map((system, index) => {
			const id = SolarSystemId.make(index);
			id_map.set(system.id, id);
			let coordinate = Coordinate.from_stellaris_coordinate(
				Coordinate.make({ x: system.x * scale, y: system.y * scale }),
			).to_rounded();
			while (used.has(coordinate.key)) {
				coordinate = Coordinate.make({ x: coordinate.x + 1, y: coordinate.y });
			}
			used.add(coordinate.key);
			const keep =
				options.keep_initializers &&
				system.initializer != null &&
				system.initializer in initializer_metadata;
			return new SolarSystem({
				id,
				coordinate,
				spawn_type:
					options.spawns && capital_systems.has(system.id) ?
						'enabled'
					:	'disabled',
				name: Option.fromNullable(system.name),
				initializer: keep ? Option.some(system.initializer!) : Option.none(),
			});
		});
		const connect = ([a, b]: [number, number]) =>
			new Connection({ a: id_map.get(a)!, b: id_map.get(b)! });
		const empty = await Project.make_empty(options.name);
		let canvas = empty.canvas;
		if (options.paint) canvas = await paint_from_systems(solar_systems);
		return new Project({
			...empty,
			name: options.name,
			step: 'tweak',
			canvas,
			solar_systems,
			hyperlanes: lanes.map(connect),
			wormholes: wormholes.map(connect),
			nebulas: nebulas.map(
				(nebula) =>
					new Nebula({
						coordinate: Coordinate.from_stellaris_coordinate(
							Coordinate.make({ x: nebula.x * scale, y: nebula.y * scale }),
						),
						radius: Math.max(5, nebula.radius * scale),
					}),
			),
			txt_import_source: Option.some('stellaris_save'),
		});
	};

	return { summary, build };
}

async function paint_from_systems(
	systems: readonly SolarSystem[],
): Promise<Blob> {
	const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
	const ctx = canvas.getContext('2d');
	if (!ctx) throw new Error('null ctx');
	ctx.fillStyle = '#000000';
	ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
	ctx.globalCompositeOperation = 'lighter';
	const radius = 22;
	for (const system of systems) {
		const { x, y } = system.coordinate;
		const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
		gradient.addColorStop(0, 'rgba(255,255,255,0.35)');
		gradient.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(x - radius, y - radius, radius * 2, radius * 2);
	}
	return canvas.convertToBlob({ type: 'image/jpeg', quality: 1 });
}
