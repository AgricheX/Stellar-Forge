import type { Body, CustomSystem, Moon } from '$lib/models/custom_system';
import { BELT_TYPES, IDEAL_CLASS, PLANET_CLASSES, STAR_CLASSES } from './data';

export function uid(): string {
	return Math.random().toString(36).slice(2, 10);
}

export function make_body(partial: Partial<Body> = {}): Body {
	return {
		id: uid(),
		kind: 'planet',
		name: '',
		class: 'pc_barren',
		orbit: 60,
		angle: 0,
		size: 12,
		ring: false,
		home: false,
		moons: [],
		...partial,
	};
}

export function make_moon(partial: Partial<Moon> = {}): Moon {
	return {
		id: uid(),
		name: '',
		class: 'pc_barren',
		orbit: 6,
		angle: 0,
		size: 5,
		...partial,
	};
}

export function blank_system(name: string, key: string): CustomSystem {
	return {
		key,
		name,
		star_class: 'sc_g',
		star_size: 30,
		belts: [],
		bodies: [
			make_body({ class: 'pc_molten', orbit: 40, angle: 30, size: 8 }),
			make_body({
				class: 'pc_continental',
				orbit: 70,
				angle: 140,
				size: 16,
				moons: [make_moon({ orbit: 6, angle: 60, size: 4 })],
			}),
			make_body({
				class: 'pc_gas_giant',
				orbit: 115,
				angle: 250,
				size: 28,
				ring: true,
			}),
		],
	};
}

export function home_system(name: string, key: string): CustomSystem {
	return {
		key,
		name,
		star_class: 'sc_g',
		star_size: 30,
		belts: [{ id: uid(), type: 'rocky_asteroid_belt', radius: 100 }],
		bodies: [
			make_body({ class: 'pc_molten', orbit: 35, angle: 20, size: 7 }),
			make_body({ class: 'pc_barren', orbit: 55, angle: 200, size: 10 }),
			make_body({
				name: '',
				class: IDEAL_CLASS,
				orbit: 78,
				angle: 110,
				size: 22,
				home: true,
				moons: [make_moon({ orbit: 7, angle: 45, size: 5 })],
			}),
			make_body({
				class: 'pc_gas_giant',
				orbit: 130,
				angle: 300,
				size: 30,
				ring: true,
			}),
			make_body({ class: 'pc_frozen', orbit: 165, angle: 70, size: 12 }),
		],
	};
}

export function random_system(
	name: string,
	key: string,
	rng: () => number = Math.random,
): CustomSystem {
	const pick = <T>(items: readonly T[]): T =>
		items[Math.floor(rng() * items.length)]!;
	const between = (min: number, max: number) => min + rng() * (max - min);
	const star = pick(
		STAR_CLASSES.filter((s) => s.id !== 'sc_black_hole' || rng() < 0.3),
	);
	const count = 2 + Math.floor(rng() * 6);
	const bodies: Body[] = [];
	let orbit = between(28, 45);
	for (let i = 0; i < count; i++) {
		const outer = orbit > 110;
		const pool = PLANET_CLASSES.filter((p) =>
			outer ?
				[
					'pc_gas_giant',
					'pc_frozen',
					'pc_barren_cold',
					'pc_ice_asteroid',
					'pc_arctic',
					'pc_tundra',
				].includes(p.id)
			: orbit < 50 ?
				['pc_molten', 'pc_barren', 'pc_toxic', 'pc_desert', 'pc_arid'].includes(
					p.id,
				)
			:	p.group !== 'special',
		);
		const info = pick(pool);
		const size = Math.round(info.size * between(0.75, 1.25));
		const moons: Moon[] = [];
		const moon_count =
			info.id === 'pc_gas_giant' ? Math.floor(rng() * 4)
			: rng() < 0.3 ? 1
			: 0;
		let moon_orbit = between(5, 8);
		for (let m = 0; m < moon_count; m++) {
			moons.push(
				make_moon({
					class: pick([
						'pc_barren',
						'pc_frozen',
						'pc_molten',
						'pc_toxic',
						'pc_barren_cold',
					]),
					orbit: Math.round(moon_orbit),
					angle: Math.round(between(0, 360)),
					size: Math.round(between(3, 7)),
				}),
			);
			moon_orbit += between(3, 6);
		}
		bodies.push(
			make_body({
				class: info.id,
				orbit: Math.round(orbit),
				angle: Math.round(between(0, 360)),
				size,
				ring: info.id === 'pc_gas_giant' && rng() < 0.4,
				moons,
			}),
		);
		orbit += between(18, 40);
	}
	const belts =
		rng() < 0.55 ?
			[
				{
					id: uid(),
					type: pick(BELT_TYPES).id,
					radius: Math.round(between(60, Math.max(orbit, 90))),
				},
			]
		:	[];
	return {
		key,
		name,
		star_class: star.id,
		star_size: Math.round(between(22, 36)),
		bodies,
		belts,
	};
}

export function clone_system(system: CustomSystem): CustomSystem {
	return JSON.parse(JSON.stringify(system)) as CustomSystem;
}
