import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { make_rng } from './random';

type Ctx = OffscreenCanvasRenderingContext2D | CanvasRenderingContext2D;

export type SpiralShape = {
	kind: 'spiral';
	arms: number;
	twist: number;
	arm_width: number;
	core: number;
	bar: number;
	radius: number;
	rotation: number;
	squash: number;
	tilt: number;
	clumps: number;
	haze: number;
};

export type EllipticalShape = {
	kind: 'elliptical';
	radius: number;
	squash: number;
	tilt: number;
	core: number;
	clumps: number;
};

export type RingShape = {
	kind: 'ring';
	radius: number;
	thickness: number;
	core: number;
	squash: number;
	tilt: number;
	clumps: number;
};

export type ClustersShape = {
	kind: 'clusters';
	count: number;
	cluster_radius: number;
	radius: number;
	lanes: number;
};

export type IrregularShape = {
	kind: 'irregular';
	blobs: number;
	radius: number;
};

export type GalaxyShape =
	| SpiralShape
	| EllipticalShape
	| RingShape
	| ClustersShape
	| IrregularShape;

export type GalaxyExtras = {
	rift?: { angle: number; width: number; offset: number };
	companions?: { x: number; y: number; radius: number }[];
	ring?: { radius: number; thickness: number };
	center_x?: number;
	center_y?: number;
};

export type GalaxyRecipe = {
	shape: GalaxyShape;
	extras?: GalaxyExtras;
	seed: string;
};

const CX = CANVAS_WIDTH / 2;
const CY = CANVAS_HEIGHT / 2;

function dab(ctx: Ctx, x: number, y: number, radius: number, alpha: number) {
	if (radius <= 0 || alpha <= 0) return;
	const gradient = ctx.createRadialGradient(x, y, 0, x, y, radius);
	gradient.addColorStop(0, `rgba(255,255,255,${Math.min(alpha, 1)})`);
	gradient.addColorStop(0.55, `rgba(255,255,255,${Math.min(alpha, 1) * 0.55})`);
	gradient.addColorStop(1, 'rgba(255,255,255,0)');
	ctx.fillStyle = gradient;
	ctx.beginPath();
	ctx.arc(x, y, radius, 0, Math.PI * 2);
	ctx.fill();
}

function with_frame(
	ctx: Ctx,
	cx: number,
	cy: number,
	tilt: number,
	squash: number,
	fn: () => void,
) {
	ctx.save();
	ctx.translate(cx, cy);
	ctx.rotate((tilt * Math.PI) / 180);
	ctx.scale(1, Math.min(Math.max(squash, 0.1), 1));
	ctx.translate(-cx, -cy);
	fn();
	ctx.restore();
}

function draw_spiral(
	ctx: Ctx,
	shape: SpiralShape,
	rng: () => number,
	cx: number,
	cy: number,
) {
	with_frame(ctx, cx, cy, shape.tilt, shape.squash, () => {
		const radius = shape.radius;
		const core_radius = radius * shape.core;
		dab(ctx, cx, cy, radius * 1.05, shape.haze);
		dab(ctx, cx, cy, Math.max(core_radius * 1.6, 20), 0.8);
		const bar_length = radius * shape.bar;
		const rotation = (shape.rotation * Math.PI) / 180;
		if (bar_length > 0) {
			const steps = 18;
			for (let i = -steps; i <= steps; i++) {
				const t = i / steps;
				dab(
					ctx,
					cx + Math.cos(rotation) * bar_length * t,
					cy + Math.sin(rotation) * bar_length * t,
					shape.arm_width * 0.8,
					0.1,
				);
			}
		}
		const arms = Math.max(1, Math.round(shape.arms));
		const steps = 140;
		for (let arm = 0; arm < arms; arm++) {
			const offset = rotation + (arm / arms) * Math.PI * 2;
			const start = Math.max(bar_length, core_radius);
			for (let i = 0; i <= steps; i++) {
				const t = i / steps;
				const r = start + (radius - start) * t;
				const angle = offset + shape.twist * Math.PI * 2 * t;
				const width = shape.arm_width * (1 - 0.55 * t);
				const jitter = width * 0.35;
				const x = cx + Math.cos(angle) * r + (rng() - 0.5) * jitter;
				const y = cy + Math.sin(angle) * r + (rng() - 0.5) * jitter;
				dab(ctx, x, y, width, 0.16 * (1 - 0.45 * t));
				if (rng() < shape.clumps) {
					dab(
						ctx,
						x + (rng() - 0.5) * width * 1.6,
						y + (rng() - 0.5) * width * 1.6,
						width * (0.25 + rng() * 0.35),
						0.35,
					);
				}
			}
		}
	});
}

function draw_elliptical(
	ctx: Ctx,
	shape: EllipticalShape,
	rng: () => number,
	cx: number,
	cy: number,
) {
	with_frame(ctx, cx, cy, shape.tilt, shape.squash, () => {
		for (let i = 0; i < 6; i++) {
			const r = shape.radius * (1 - i * 0.14);
			dab(ctx, cx, cy, r, 0.22);
		}
		dab(ctx, cx, cy, shape.radius * shape.core, 0.9);
		const clumps = Math.round(shape.clumps * 60);
		for (let i = 0; i < clumps; i++) {
			const angle = rng() * Math.PI * 2;
			const r = Math.sqrt(rng()) * shape.radius * 0.85;
			dab(
				ctx,
				cx + Math.cos(angle) * r,
				cy + Math.sin(angle) * r,
				shape.radius * (0.05 + rng() * 0.08),
				0.25,
			);
		}
	});
}

function draw_ring(
	ctx: Ctx,
	shape: RingShape,
	rng: () => number,
	cx: number,
	cy: number,
) {
	with_frame(ctx, cx, cy, shape.tilt, shape.squash, () => {
		const steps = 220;
		for (let i = 0; i < steps; i++) {
			const angle = (i / steps) * Math.PI * 2;
			const r = shape.radius + (rng() - 0.5) * shape.thickness * 0.4;
			dab(
				ctx,
				cx + Math.cos(angle) * r,
				cy + Math.sin(angle) * r,
				shape.thickness / 2,
				0.2,
			);
			if (rng() < shape.clumps) {
				dab(
					ctx,
					cx + Math.cos(angle) * r + (rng() - 0.5) * shape.thickness,
					cy + Math.sin(angle) * r + (rng() - 0.5) * shape.thickness,
					shape.thickness * 0.3,
					0.4,
				);
			}
		}
		if (shape.core > 0) {
			dab(ctx, cx, cy, shape.radius * shape.core, 0.9);
		}
	});
}

function draw_clusters(
	ctx: Ctx,
	shape: ClustersShape,
	rng: () => number,
	cx: number,
	cy: number,
) {
	const centers: { x: number; y: number; r: number }[] = [];
	const count = Math.max(1, Math.round(shape.count));
	let attempts = 0;
	while (centers.length < count && attempts < 4000) {
		attempts++;
		const angle = rng() * Math.PI * 2;
		const distance = Math.sqrt(rng()) * shape.radius;
		const r = shape.cluster_radius * (0.7 + rng() * 0.6);
		const x = cx + Math.cos(angle) * distance;
		const y = cy + Math.sin(angle) * distance;
		if (
			centers.every(
				(center) =>
					Math.hypot(center.x - x, center.y - y) > (center.r + r) * 1.15,
			)
		) {
			centers.push({ x, y, r });
		}
	}
	if (shape.lanes > 0) {
		const connected = new Set<number>([0]);
		while (connected.size < centers.length) {
			let best: [number, number, number] | null = null;
			for (const i of connected) {
				for (let j = 0; j < centers.length; j++) {
					if (connected.has(j)) continue;
					const d = Math.hypot(
						centers[i]!.x - centers[j]!.x,
						centers[i]!.y - centers[j]!.y,
					);
					if (best == null || d < best[2]) best = [i, j, d];
				}
			}
			if (best == null) break;
			const a = centers[best[0]]!;
			const b = centers[best[1]]!;
			const steps = Math.ceil(best[2] / 10);
			for (let s = 0; s <= steps; s++) {
				const t = s / steps;
				dab(
					ctx,
					a.x + (b.x - a.x) * t,
					a.y + (b.y - a.y) * t,
					shape.lanes,
					0.25,
				);
			}
			connected.add(best[1]);
		}
	}
	for (const center of centers) {
		dab(ctx, center.x, center.y, center.r, 0.6);
		dab(ctx, center.x, center.y, center.r * 0.5, 0.6);
	}
}

function draw_irregular(
	ctx: Ctx,
	shape: IrregularShape,
	rng: () => number,
	cx: number,
	cy: number,
) {
	const blobs = Math.max(1, Math.round(shape.blobs));
	for (let i = 0; i < blobs; i++) {
		const angle = rng() * Math.PI * 2;
		const distance = rng() * shape.radius * 0.6;
		const x = cx + Math.cos(angle) * distance;
		const y = cy + Math.sin(angle) * distance;
		const r = shape.radius * (0.2 + rng() * 0.35);
		dab(ctx, x, y, r, 0.3 + rng() * 0.3);
		for (let k = 0; k < 6; k++) {
			dab(
				ctx,
				x + (rng() - 0.5) * r * 1.4,
				y + (rng() - 0.5) * r * 1.4,
				r * (0.2 + rng() * 0.3),
				0.3,
			);
		}
	}
}

function draw_galaxy(ctx: Ctx, recipe: GalaxyRecipe) {
	const rng = make_rng(recipe.seed);
	const cx = CX + (recipe.extras?.center_x ?? 0);
	const cy = CY + (recipe.extras?.center_y ?? 0);
	ctx.save();
	ctx.globalCompositeOperation = 'lighter';
	const shape = recipe.shape;
	if (shape.kind === 'spiral') draw_spiral(ctx, shape, rng, cx, cy);
	if (shape.kind === 'elliptical') draw_elliptical(ctx, shape, rng, cx, cy);
	if (shape.kind === 'ring') draw_ring(ctx, shape, rng, cx, cy);
	if (shape.kind === 'clusters') draw_clusters(ctx, shape, rng, cx, cy);
	if (shape.kind === 'irregular') draw_irregular(ctx, shape, rng, cx, cy);
	const ring = recipe.extras?.ring;
	if (ring) {
		draw_ring(
			ctx,
			{
				kind: 'ring',
				radius: ring.radius,
				thickness: ring.thickness,
				core: 0,
				squash: 1,
				tilt: 0,
				clumps: 0.2,
			},
			rng,
			cx,
			cy,
		);
	}
	for (const companion of recipe.extras?.companions ?? []) {
		dab(ctx, CX + companion.x, CY + companion.y, companion.radius, 0.7);
		dab(ctx, CX + companion.x, CY + companion.y, companion.radius * 0.5, 0.6);
	}
	ctx.restore();
	const rift = recipe.extras?.rift;
	if (rift) {
		ctx.save();
		ctx.globalCompositeOperation = 'destination-out';
		ctx.translate(cx, cy);
		ctx.rotate((rift.angle * Math.PI) / 180);
		const gradient = ctx.createLinearGradient(
			0,
			rift.offset - rift.width,
			0,
			rift.offset + rift.width,
		);
		gradient.addColorStop(0, 'rgba(0,0,0,0)');
		gradient.addColorStop(0.35, 'rgba(0,0,0,0.95)');
		gradient.addColorStop(0.65, 'rgba(0,0,0,0.95)');
		gradient.addColorStop(1, 'rgba(0,0,0,0)');
		ctx.fillStyle = gradient;
		ctx.fillRect(
			-CANVAS_WIDTH,
			rift.offset - rift.width,
			CANVAS_WIDTH * 2,
			rift.width * 2,
		);
		ctx.restore();
	}
}

export function render_galaxy_mask(recipe: GalaxyRecipe): OffscreenCanvas {
	const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
	const ctx = canvas.getContext('2d');
	if (ctx == null) throw new Error('null ctx');
	draw_galaxy(ctx, recipe);
	return canvas;
}

export function default_spiral(): SpiralShape {
	return {
		kind: 'spiral',
		arms: 2,
		twist: 0.8,
		arm_width: 55,
		core: 0.12,
		bar: 0,
		radius: 440,
		rotation: 0,
		squash: 1,
		tilt: 0,
		clumps: 0.15,
		haze: 0.12,
	};
}

export type Preset = {
	id: string;
	name: string;
	inspired_by?: string;
	description: string;
	systems: number;
	recipe: Omit<GalaxyRecipe, 'seed'>;
};

export const PRESETS: Preset[] = [
	{
		id: 'milky_way',
		name: 'Milky Way',
		description: 'Barred spiral with two major and two minor arms.',
		systems: 1000,
		recipe: {
			shape: {
				...default_spiral(),
				arms: 4,
				twist: 0.7,
				bar: 0.28,
				arm_width: 48,
				core: 0.1,
				rotation: 25,
				clumps: 0.2,
			},
		},
	},
	{
		id: 'andromeda',
		name: 'Andromeda',
		description:
			'Large tilted spiral with a bright core and a small companion.',
		systems: 1000,
		recipe: {
			shape: {
				...default_spiral(),
				arms: 2,
				twist: 1.1,
				arm_width: 60,
				core: 0.18,
				squash: 0.5,
				tilt: -35,
				haze: 0.22,
			},
			extras: { companions: [{ x: 250, y: -230, radius: 45 }] },
		},
	},
	{
		id: 'far_far_away',
		name: 'A Galaxy Far, Far Away',
		inspired_by: 'Star Wars',
		description:
			'Dense Core Worlds, a crowded Inner Rim and a wide, sparse Outer Rim.',
		systems: 1200,
		recipe: {
			shape: {
				...default_spiral(),
				arms: 5,
				twist: 0.55,
				arm_width: 62,
				core: 0.24,
				haze: 0.3,
				clumps: 0.25,
			},
		},
	},
	{
		id: 'four_quadrants',
		name: 'Four Quadrants',
		inspired_by: 'Star Trek',
		description:
			'Barred spiral meant to be split into Alpha, Beta, Gamma and Delta.',
		systems: 1000,
		recipe: {
			shape: {
				...default_spiral(),
				arms: 2,
				twist: 0.85,
				bar: 0.35,
				arm_width: 70,
				core: 0.12,
				rotation: 0,
				haze: 0.2,
			},
		},
	},
	{
		id: 'great_rift',
		name: 'The Great Rift',
		inspired_by: 'Warhammer 40,000',
		description: 'Spiral galaxy torn in two by a dark warp scar.',
		systems: 1000,
		recipe: {
			shape: {
				...default_spiral(),
				arms: 4,
				twist: 0.75,
				bar: 0.2,
				arm_width: 55,
				clumps: 0.2,
			},
			extras: { rift: { angle: -35, width: 45, offset: 40 } },
		},
	},
	{
		id: 'relay_network',
		name: 'Relay Network',
		inspired_by: 'Mass Effect',
		description: 'Isolated star clusters linked by thin travel corridors.',
		systems: 700,
		recipe: {
			shape: {
				kind: 'clusters',
				count: 14,
				cluster_radius: 55,
				radius: 380,
				lanes: 9,
			},
		},
	},
	{
		id: 'ark_ring',
		name: 'Ark Ring',
		inspired_by: 'Halo',
		description:
			'A bright ring of stars around an empty middle and a small core.',
		systems: 800,
		recipe: {
			shape: {
				kind: 'ring',
				radius: 330,
				thickness: 110,
				core: 0.12,
				squash: 1,
				tilt: 0,
				clumps: 0.2,
			},
		},
	},
	{
		id: 'imperium_sprawl',
		name: 'Imperium Sprawl',
		inspired_by: 'Dune',
		description: 'Old elliptical galaxy, evenly settled with a few hot spots.',
		systems: 900,
		recipe: {
			shape: {
				kind: 'elliptical',
				radius: 430,
				squash: 0.8,
				tilt: 20,
				core: 0.25,
				clumps: 0.6,
			},
		},
	},
	{
		id: 'whirlpool',
		name: 'Whirlpool',
		description:
			'Grand design spiral with a companion galaxy at the tip of an arm.',
		systems: 900,
		recipe: {
			shape: {
				...default_spiral(),
				arms: 2,
				twist: 1.25,
				arm_width: 50,
				radius: 380,
				rotation: 90,
			},
			extras: { companions: [{ x: 300, y: 300, radius: 70 }] },
		},
	},
	{
		id: 'magellanic',
		name: 'Magellanic Clouds',
		description: 'Two irregular dwarf galaxies drifting side by side.',
		systems: 600,
		recipe: {
			shape: { kind: 'irregular', blobs: 7, radius: 240 },
			extras: {
				center_x: -150,
				center_y: -80,
				companions: [
					{ x: 230, y: 180, radius: 90 },
					{ x: 280, y: 130, radius: 60 },
				],
			},
		},
	},
	{
		id: 'cartwheel',
		name: 'Cartwheel',
		description: 'Ring galaxy with spokes running to the core.',
		systems: 800,
		recipe: {
			shape: {
				...default_spiral(),
				arms: 8,
				twist: 0.05,
				arm_width: 22,
				radius: 360,
				core: 0.15,
				haze: 0.05,
				clumps: 0.05,
			},
			extras: { ring: { radius: 400, thickness: 80 } },
		},
	},
	{
		id: 'archipelago',
		name: 'Archipelago',
		description: 'Many small island clusters with empty space between them.',
		systems: 800,
		recipe: {
			shape: {
				kind: 'clusters',
				count: 24,
				cluster_radius: 40,
				radius: 420,
				lanes: 0,
			},
		},
	},
];

export function random_recipe(seed: string): {
	recipe: GalaxyRecipe;
	systems: number;
	label: string;
} {
	const rng = make_rng(`${seed}:shape`);
	const between = (min: number, max: number) => min + rng() * (max - min);
	const int = (min: number, max: number) => Math.floor(between(min, max + 1));
	const roll = rng();
	let shape: GalaxyShape;
	let label: string;
	if (roll < 0.45) {
		shape = {
			kind: 'spiral',
			arms: int(2, 6),
			twist: between(0.4, 1.3),
			arm_width: between(35, 75),
			core: between(0.06, 0.22),
			bar: rng() < 0.4 ? between(0.15, 0.4) : 0,
			radius: between(360, 460),
			rotation: between(0, 360),
			squash: rng() < 0.25 ? between(0.5, 0.9) : 1,
			tilt: between(-60, 60),
			clumps: between(0.05, 0.3),
			haze: between(0.05, 0.25),
		};
		label = shape.bar > 0 ? 'Barred Spiral' : 'Spiral';
	} else if (roll < 0.6) {
		shape = {
			kind: 'elliptical',
			radius: between(320, 450),
			squash: between(0.5, 1),
			tilt: between(-90, 90),
			core: between(0.1, 0.3),
			clumps: between(0.1, 0.8),
		};
		label = 'Elliptical';
	} else if (roll < 0.72) {
		shape = {
			kind: 'ring',
			radius: between(250, 380),
			thickness: between(60, 140),
			core: rng() < 0.6 ? between(0.08, 0.2) : 0,
			squash: rng() < 0.3 ? between(0.6, 0.95) : 1,
			tilt: between(-90, 90),
			clumps: between(0.05, 0.3),
		};
		label = 'Ring';
	} else if (roll < 0.88) {
		shape = {
			kind: 'clusters',
			count: int(6, 26),
			cluster_radius: between(35, 75),
			radius: between(320, 430),
			lanes: rng() < 0.5 ? between(6, 14) : 0,
		};
		label = 'Clusters';
	} else {
		shape = {
			kind: 'irregular',
			blobs: int(4, 10),
			radius: between(280, 420),
		};
		label = 'Irregular';
	}
	const extras: GalaxyExtras = {};
	if (shape.kind === 'spiral' && rng() < 0.2) {
		extras.rift = {
			angle: between(0, 180),
			width: between(25, 50),
			offset: between(-80, 80),
		};
	}
	if (rng() < 0.25) {
		extras.companions = [
			{
				x: between(-380, 380),
				y: between(-380, 380),
				radius: between(35, 80),
			},
		];
	}
	return {
		recipe: { shape, extras, seed },
		systems: int(5, 12) * 100,
		label,
	};
}
