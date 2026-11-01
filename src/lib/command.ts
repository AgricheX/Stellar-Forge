import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import {
	default_spiral,
	PRESETS,
	random_multi,
	type GalaxyRecipe,
	type GalaxyShape,
	type Preset,
} from './galaxy';
import { make_rng, make_seed } from './random';
import { polygon_points, ring_path, spiral_path, star_points } from './shapes';

type CommandResult = {
	stars?: number | undefined;
	generate: boolean;
} & (
	| { type: 'galaxy'; recipe: GalaxyRecipe; label: string; add: boolean }
	| { type: 'preset'; preset: Preset; add: boolean }
	| { type: 'random'; seed: string }
	| { type: 'text'; text: string; font?: string; bold?: boolean }
	| {
			type: 'shape';
			path: string;
			erase: boolean;
			strength: number;
			blur: number;
	  }
	| { type: 'clear' }
	| { type: 'generate' }
	| { type: 'help' }
	| { type: 'error'; message: string; params?: Record<string, string> }
);

const COMMAND_ALIASES: Record<string, string> = {
	spiral: 'spiral',
	espiral: 'spiral',
	barred: 'barred',
	barrada: 'barred',
	elliptical: 'elliptical',
	ellipse: 'elliptical',
	eliptica: 'elliptical',
	ring: 'ring',
	anel: 'ring',
	clusters: 'clusters',
	cluster: 'clusters',
	aglomerados: 'clusters',
	aglomerado: 'clusters',
	irregular: 'irregular',
	multi: 'multi',
	multiple: 'multi',
	galaxies: 'multi',
	multiplas: 'multi',
	multipla: 'multi',
	galaxias: 'multi',
	preset: 'preset',
	modelo: 'preset',
	random: 'random',
	aleatoria: 'random',
	aleatorio: 'random',
	text: 'text',
	texto: 'text',
	circle: 'circle',
	circulo: 'circle',
	polygon: 'polygon',
	poligono: 'polygon',
	star: 'star',
	estrela: 'star',
	rect: 'rect',
	rectangle: 'rect',
	retangulo: 'rect',
	donut: 'donut',
	rosca: 'donut',
	arms: 'arms_shape',
	clear: 'clear',
	limpar: 'clear',
	generate: 'generate',
	gerar: 'generate',
	help: 'help',
	ajuda: 'help',
};

const PARAM_ALIASES: Record<string, string> = {
	arms: 'arms',
	bracos: 'arms',
	twist: 'twist',
	torcao: 'twist',
	width: 'width',
	largura: 'width',
	w: 'width',
	core: 'core',
	nucleo: 'core',
	bar: 'bar',
	barra: 'bar',
	radius: 'radius',
	raio: 'radius',
	r: 'radius',
	rotation: 'rotation',
	rotacao: 'rotation',
	rot: 'rotation',
	squash: 'squash',
	achatar: 'squash',
	tilt: 'tilt',
	inclinacao: 'tilt',
	seed: 'seed',
	semente: 'seed',
	thickness: 'thickness',
	espessura: 'thickness',
	count: 'count',
	quantidade: 'count',
	size: 'size',
	tamanho: 'size',
	lanes: 'lanes',
	rotas: 'lanes',
	blobs: 'blobs',
	manchas: 'blobs',
	stars: 'stars',
	estrelas: 'stars',
	systems: 'stars',
	sistemas: 'stars',
	x: 'x',
	y: 'y',
	h: 'height',
	height: 'height',
	altura: 'height',
	sides: 'sides',
	lados: 'sides',
	points: 'points',
	pontas: 'points',
	inner: 'inner',
	interno: 'inner',
	strength: 'strength',
	forca: 'strength',
	blur: 'blur',
	desfoque: 'blur',
	font: 'font',
	fonte: 'font',
	clumps: 'clumps',
	haze: 'haze',
	nevoa: 'haze',
};

const FLAG_ALIASES: Record<string, string> = {
	add: 'add',
	adicionar: 'add',
	somar: 'add',
	erase: 'erase',
	apagar: 'erase',
	generate: 'generate',
	gerar: 'generate',
	bold: 'bold',
	negrito: 'bold',
};

function normalize(text: string) {
	return text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase();
}

function tokenize(input: string): string[] {
	const tokens: string[] = [];
	const pattern = /(\w[\w-]*=)?"([^"]*)"|(\w[\w-]*=)?'([^']*)'|\S+/gu;
	for (const match of input.matchAll(pattern)) {
		if (match[2] != null) tokens.push(`${match[1] ?? ''}\u0000${match[2]}`);
		else if (match[4] != null)
			tokens.push(`${match[3] ?? ''}\u0000${match[4]}`);
		else tokens.push(match[0]);
	}
	return tokens;
}

type Parsed = {
	command: string;
	params: Record<string, string>;
	flags: Set<string>;
	words: string[];
};

function parse(input: string): Parsed | null {
	const tokens = tokenize(input.trim());
	const first = tokens.shift();
	if (first == null) return null;
	const command = COMMAND_ALIASES[normalize(first)] ?? normalize(first);
	const params: Record<string, string> = {};
	const flags = new Set<string>();
	const words: string[] = [];
	for (const token of tokens) {
		const quoted = token.includes('\u0000');
		const [raw_key, raw_value] =
			quoted ? token.split('\u0000')
			: token.includes('=') ? token.split('=')
			: [];
		if (raw_key != null && raw_key !== '' && raw_value != null) {
			const key = normalize(raw_key.replace(/=$/, ''));
			params[PARAM_ALIASES[key] ?? key] = raw_value;
		} else if (quoted) {
			words.push(token.replace('\u0000', ''));
		} else if (FLAG_ALIASES[normalize(token)]) {
			flags.add(FLAG_ALIASES[normalize(token)]!);
		} else {
			words.push(token);
		}
	}
	return { command, params, flags, words };
}

function number_param(
	params: Record<string, string>,
	key: string,
	fallback: number,
	min = -Infinity,
	max = Infinity,
): number {
	const raw = params[key];
	if (raw == null) return fallback;
	const value = Number.parseFloat(raw.replace(',', '.').replace('%', ''));
	if (Number.isNaN(value)) return fallback;
	const adjusted = raw.endsWith('%') ? value / 100 : value;
	return Math.min(Math.max(adjusted, min), max);
}

function ratio_param(
	params: Record<string, string>,
	key: string,
	fallback: number,
) {
	const value = number_param(params, key, fallback);
	return value > 1 ? value / 100 : Math.max(value, 0);
}

const CX = CANVAS_WIDTH / 2;
const CY = CANVAS_HEIGHT / 2;

function points_path(points: { x: number; y: number }[]) {
	return (
		points
			.map(
				(p, i) => `${i === 0 ? 'M' : 'L'} ${p.x.toFixed(2)} ${p.y.toFixed(2)}`,
			)
			.join(' ') + ' Z'
	);
}

function find_preset(query: string): Preset | undefined {
	const q = normalize(query).replace(/[^a-z0-9]/g, '');
	if (q === '') return undefined;
	return (
		PRESETS.find((preset) => preset.id.replace(/_/g, '') === q) ??
		PRESETS.find((preset) =>
			normalize(preset.name)
				.replace(/[^a-z0-9]/g, '')
				.includes(q),
		) ??
		PRESETS.find((preset) =>
			normalize(preset.inspired_by ?? '')
				.replace(/[^a-z0-9]/g, '')
				.includes(q),
		)
	);
}

export function run_command(input: string): CommandResult {
	const parsed = parse(input);
	if (parsed == null) return { type: 'help', generate: false };
	const { command, params, flags, words } = parsed;
	const stars =
		params.stars != null ?
			number_param(params, 'stars', 0, 0, 5000)
		:	undefined;
	const generate = flags.has('generate') || stars != null;
	const add = flags.has('add');
	const seed = params.seed ?? make_seed();
	const rotation = number_param(params, 'rotation', 0);
	const x = CX + number_param(params, 'x', 0);
	const y = CY + number_param(params, 'y', 0);
	const base = { stars, generate };

	const galaxy = (shape: GalaxyShape, label: string): CommandResult => ({
		...base,
		type: 'galaxy',
		recipe: {
			shape,
			seed,
			extras: { center_x: x - CX, center_y: y - CY },
		},
		label,
		add,
	});

	const spiral_from_params = (bar_default: number) => {
		const defaults = default_spiral();
		return {
			...defaults,
			arms: number_param(params, 'arms', defaults.arms, 1, 12),
			twist: number_param(params, 'twist', defaults.twist, 0, 4),
			arm_width: number_param(params, 'width', defaults.arm_width, 5, 200),
			core: ratio_param(params, 'core', defaults.core),
			bar: ratio_param(params, 'bar', bar_default),
			radius: number_param(params, 'radius', defaults.radius, 20, 700),
			rotation,
			squash: ratio_param(params, 'squash', 1) || 1,
			tilt: number_param(params, 'tilt', 0),
			clumps: ratio_param(params, 'clumps', defaults.clumps),
			haze: ratio_param(params, 'haze', defaults.haze),
		};
	};

	const paint = (path: string): CommandResult => ({
		...base,
		type: 'shape',
		path,
		erase: flags.has('erase'),
		strength: ratio_param(params, 'strength', 0.7),
		blur: number_param(params, 'blur', 0, 0, 100),
	});

	switch (command) {
		case 'spiral':
			return galaxy(spiral_from_params(0), 'Spiral');
		case 'barred':
			return galaxy(spiral_from_params(0.3), 'Barred Spiral');
		case 'elliptical':
			return galaxy(
				{
					kind: 'elliptical',
					radius: number_param(params, 'radius', 420, 20, 700),
					squash: ratio_param(params, 'squash', 0.8) || 0.8,
					tilt: number_param(params, 'tilt', rotation),
					core: ratio_param(params, 'core', 0.2),
					clumps: ratio_param(params, 'clumps', 0.4),
				},
				'Elliptical',
			);
		case 'ring':
			return galaxy(
				{
					kind: 'ring',
					radius: number_param(params, 'radius', 330, 20, 700),
					thickness: number_param(params, 'thickness', 100, 5, 500),
					core: ratio_param(params, 'core', 0.1),
					squash: ratio_param(params, 'squash', 1) || 1,
					tilt: number_param(params, 'tilt', rotation),
					clumps: ratio_param(params, 'clumps', 0.2),
				},
				'Ring',
			);
		case 'clusters':
			return galaxy(
				{
					kind: 'clusters',
					count: number_param(params, 'count', 12, 1, 80),
					cluster_radius: number_param(params, 'size', 55, 5, 300),
					radius: number_param(params, 'radius', 400, 20, 700),
					lanes: number_param(params, 'lanes', 0, 0, 60),
				},
				'Clusters',
			);
		case 'irregular':
			return galaxy(
				{
					kind: 'irregular',
					blobs: number_param(params, 'blobs', 7, 1, 40),
					radius: number_param(params, 'radius', 360, 20, 700),
				},
				'Irregular',
			);
		case 'multi':
			return galaxy(
				random_multi(
					make_rng(`${seed}:multi`),
					params.count != null ?
						number_param(params, 'count', 4, 2, 12)
					:	undefined,
				),
				'Multiple Galaxies',
			);
		case 'preset': {
			const preset = find_preset(words.join(' ') || params.name || '');
			if (!preset) {
				return { ...base, type: 'error', message: 'Preset not found.' };
			}
			return { ...base, type: 'preset', preset, add };
		}
		case 'random':
			return {
				...base,
				type: 'random',
				seed: params.seed ?? words[0] ?? make_seed(),
			};
		case 'text': {
			const text = words.join(' ').replace(/\\n/g, '\n');
			if (text.trim() === '') {
				return { ...base, type: 'error', message: 'Type the text in quotes.' };
			}
			return {
				...base,
				type: 'text',
				text,
				...(params.font ? { font: params.font } : {}),
				bold: flags.has('bold'),
			};
		}
		case 'circle': {
			const radius = number_param(params, 'radius', 150, 1, 1000);
			return paint(points_path(polygon_points({ x, y }, radius, 96, 0)));
		}
		case 'polygon': {
			const radius = number_param(params, 'radius', 200, 1, 1000);
			const sides = number_param(params, 'sides', 6, 3, 64);
			return paint(
				points_path(
					polygon_points(
						{ x, y },
						radius,
						sides,
						(rotation * Math.PI) / 180 - Math.PI / 2,
					),
				),
			);
		}
		case 'star': {
			const radius = number_param(params, 'radius', 220, 1, 1000);
			const points = number_param(params, 'points', 5, 3, 40);
			const inner = ratio_param(params, 'inner', 0.45);
			return paint(
				points_path(
					star_points(
						{ x, y },
						radius,
						points,
						inner,
						(rotation * Math.PI) / 180 - Math.PI / 2,
					),
				),
			);
		}
		case 'rect': {
			const width = number_param(params, 'width', 400, 1, 2000);
			const height = number_param(params, 'height', 250, 1, 2000);
			const radians = (rotation * Math.PI) / 180;
			const corners = [
				{ x: -width / 2, y: -height / 2 },
				{ x: width / 2, y: -height / 2 },
				{ x: width / 2, y: height / 2 },
				{ x: -width / 2, y: height / 2 },
			].map((corner) => ({
				x: x + corner.x * Math.cos(radians) - corner.y * Math.sin(radians),
				y: y + corner.x * Math.sin(radians) + corner.y * Math.cos(radians),
			}));
			return paint(points_path(corners));
		}
		case 'donut': {
			const radius = number_param(params, 'radius', 300, 1, 1000);
			const thickness = number_param(params, 'thickness', 100, 1, 1000);
			return paint(ring_path({ x, y }, { x: x + radius, y }, thickness));
		}
		case 'arms_shape': {
			const radius = number_param(params, 'radius', 400, 1, 1000);
			const radians = (rotation * Math.PI) / 180;
			return paint(
				spiral_path(
					{ x, y },
					{
						x: x + Math.cos(radians) * radius,
						y: y + Math.sin(radians) * radius,
					},
					number_param(params, 'arms', 2, 1, 12),
					number_param(params, 'twist', 0.75, 0, 4),
					number_param(params, 'width', 90, 1, 400),
				),
			);
		}
		case 'clear':
			return { ...base, type: 'clear' };
		case 'generate':
			return { ...base, type: 'generate', generate: true };
		case 'help':
			return { ...base, type: 'help' };
		default:
			return {
				...base,
				type: 'error',
				message: 'Unknown command "{command}".',
				params: { command },
			};
	}
}

export const COMMAND_EXAMPLES = [
	'spiral arms=4 twist=0.9 stars=900',
	'barred arms=2 bar=35% radius=420',
	'elliptical radius=380 squash=0.6 tilt=30',
	'ring radius=320 thickness=90 core=10%',
	'clusters count=16 size=50 lanes=8',
	'multi count=5',
	'preset milky way stars=1000',
	'random seed=vega-2077',
	'text "STELLAR FORGE" font=Orbitron',
	'text "💜"',
	'star points=5 radius=250 x=0 y=0',
	'polygon sides=6 radius=200 rotation=30',
	'donut radius=300 thickness=80',
	'clear',
	'generate',
];
