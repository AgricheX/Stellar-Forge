import type { Body, Belt, CustomSystem, Moon } from '$lib/models/custom_system';
import { parse_entries, tokenize } from '$lib/parse_txt';
import { make_body, make_moon, uid } from './templates';
import { STAR_CLASSES } from './data';

type Entries = ReturnType<typeof parse_entries>;

function number_of(value: string | Entries | undefined, fallback = 0): number {
	if (value == null) return fallback;
	if (typeof value === 'string') {
		const parsed = Number.parseFloat(value);
		return Number.isNaN(parsed) ? fallback : parsed;
	}
	const min = value.find((entry) => entry[0] === 'min')?.[1];
	const max = value.find((entry) => entry[0] === 'max')?.[1];
	if (min == null && max == null) return fallback;
	return (number_of(min, 0) + number_of(max ?? min, 0)) / 2;
}

function get(entries: Entries, key: string): string | Entries | undefined {
	return entries.find((entry) => entry[0] === key)?.[1];
}

function text_of(entries: Entries, key: string): string {
	const value = get(entries, key);
	return typeof value === 'string' ? value : '';
}

function clean_name(value: string): string {
	if (!value) return '';
	if (/^NAME_/.test(value)) return value.slice(5).replaceAll('_', ' ');
	return value;
}

const STAR_BODIES = new Set(STAR_CLASSES.map((star) => star.body));

function parse_moons(entries: Entries): Moon[] {
	const moons: Moon[] = [];
	let orbit = 0;
	let angle = 0;
	for (const [key, value] of entries) {
		if (key === 'change_orbit') orbit += number_of(value);
		if ((key !== 'moon' && key !== 'planet') || typeof value === 'string')
			continue;
		const count = Math.max(1, Math.round(number_of(get(value, 'count'), 1)));
		for (let i = 0; i < count; i++) {
			orbit += number_of(get(value, 'orbit_distance'), 5);
			angle += number_of(get(value, 'orbit_angle'), 0);
			moons.push(
				make_moon({
					name: clean_name(text_of(value, 'name')),
					class: text_of(value, 'class') || 'pc_barren',
					orbit: Math.round(orbit),
					angle: Math.round(angle),
					size: Math.round(number_of(get(value, 'size'), 5)),
				}),
			);
		}
	}
	return moons;
}

function parse_system(key: string, entries: Entries): CustomSystem {
	const bodies: Body[] = [];
	const belts: Belt[] = [];
	let orbit = 0;
	let angle = 0;
	let star_size = 30;
	let primary_found = false;
	for (const [entry_key, value] of entries) {
		if (entry_key === 'change_orbit') {
			orbit += number_of(value);
			continue;
		}
		if (entry_key === 'asteroid_belt' && typeof value !== 'string') {
			belts.push({
				id: uid(),
				type: text_of(value, 'type') || 'rocky_asteroid_belt',
				radius: Math.round(number_of(get(value, 'radius'), 80)),
			});
			continue;
		}
		if (entry_key !== 'planet' || typeof value === 'string') continue;
		const body_class = text_of(value, 'class');
		const count = Math.max(1, Math.round(number_of(get(value, 'count'), 1)));
		for (let i = 0; i < count; i++) {
			orbit += number_of(get(value, 'orbit_distance'), 0);
			angle += number_of(get(value, 'orbit_angle'), 0);
			if (body_class === 'star' && !primary_found && orbit === 0) {
				primary_found = true;
				star_size = number_of(get(value, 'size'), 30);
				continue;
			}
			const is_star = body_class === 'star' || STAR_BODIES.has(body_class);
			bodies.push(
				make_body({
					kind: is_star ? 'star' : 'planet',
					name: clean_name(text_of(value, 'name')),
					class: body_class || 'pc_barren',
					orbit: Math.round(orbit),
					angle: Math.round(angle),
					size: Math.round(number_of(get(value, 'size'), is_star ? 20 : 12)),
					ring: text_of(value, 'has_ring') === 'yes',
					home:
						text_of(value, 'starting_planet') === 'yes' ||
						text_of(value, 'home_planet') === 'yes',
					moons: parse_moons(value),
				}),
			);
		}
	}
	const star_class = text_of(entries, 'class');
	return {
		key,
		name: clean_name(text_of(entries, 'name')) || key,
		star_class:
			STAR_CLASSES.some((star) => star.id === star_class) ? star_class : 'sc_g',
		star_size: Math.round(star_size),
		bodies,
		belts,
	};
}

export function import_initializers(txt: string): CustomSystem[] {
	const entries = parse_entries(tokenize(txt));
	return entries
		.filter(
			(entry): entry is [string, Entries] =>
				Array.isArray(entry[1]) &&
				entry[1].some((child) => child[0] === 'planet'),
		)
		.map(([key, value]) => parse_system(key, value));
}
