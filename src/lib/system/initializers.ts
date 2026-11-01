import type { Body, CustomSystem, Moon } from '$lib/models/custom_system';
import { IDEAL_CLASS } from './data';

function quote(value: string): string {
	return `"${value.replaceAll('\\', '\\\\').replaceAll('"', '\\"')}"`;
}

function round(value: number): number {
	return Math.round(value);
}

function normalize_angle(value: number): number {
	const angle = round(value) % 360;
	return angle < 0 ? angle + 360 : angle;
}

function sorted_bodies(system: CustomSystem): Body[] {
	return system.bodies.toSorted(
		(a, b) => a.orbit - b.orbit || a.angle - b.angle,
	);
}

function sorted_moons(body: Body): Moon[] {
	return body.moons.toSorted((a, b) => a.orbit - b.orbit || a.angle - b.angle);
}

function moon_code(
	moon: Moon,
	previous: { orbit: number; angle: number },
	tab: string,
): string {
	const lines = [
		`${tab}moon = {`,
		...(moon.name ? [`${tab}\tname = ${quote(moon.name)}`] : []),
		`${tab}\tclass = ${quote(moon.class)}`,
		`${tab}\tsize = ${round(moon.size)}`,
		`${tab}\torbit_distance = ${round(moon.orbit - previous.orbit)}`,
		`${tab}\torbit_angle = ${normalize_angle(moon.angle - previous.angle)}`,
		`${tab}\thas_ring = no`,
		`${tab}}`,
	];
	return lines.join('\n');
}

function body_code(
	body: Body,
	previous: { orbit: number; angle: number },
): string {
	const tab = '\t';
	const lines = [`${tab}planet = {`];
	if (body.name) lines.push(`${tab}\tname = ${quote(body.name)}`);
	lines.push(
		`${tab}\tclass = ${body.class === IDEAL_CLASS ? IDEAL_CLASS : quote(body.class)}`,
		`${tab}\torbit_distance = ${round(body.orbit - previous.orbit)}`,
		`${tab}\torbit_angle = ${normalize_angle(body.angle - previous.angle)}`,
		`${tab}\tsize = ${round(body.size)}`,
		`${tab}\thas_ring = ${body.ring ? 'yes' : 'no'}`,
	);
	if (body.kind === 'planet' && body.home) {
		lines.push(
			`${tab}\thome_planet = yes`,
			`${tab}\tstarting_planet = yes`,
			`${tab}\tdeposit_blockers = none`,
			`${tab}\tmodifiers = none`,
			`${tab}\tinit_effect = {`,
			`${tab}\t\tprevent_anomaly = yes`,
			`${tab}\t}`,
			`${tab}\tinit_effect = {`,
			`${tab}\t\tgenerate_empire_home_planet = yes`,
			`${tab}\t}`,
		);
	} else if (body.class === IDEAL_CLASS) {
		lines.push(
			`${tab}\tmodifiers = none`,
			`${tab}\tanomaly = none`,
			`${tab}\tinit_effect = {`,
			`${tab}\t\tprevent_anomaly = yes`,
			`${tab}\t\tset_planet_flag = prescripted_ideal`,
			`${tab}\t}`,
		);
	}
	let moon_previous = { orbit: 0, angle: 0 };
	for (const moon of sorted_moons(body)) {
		lines.push(moon_code(moon, moon_previous, `${tab}\t`));
		moon_previous = { orbit: moon.orbit, angle: moon.angle };
	}
	lines.push(`${tab}}`);
	return lines.join('\n');
}

export function has_home_planet(system: CustomSystem): boolean {
	return system.bodies.some((body) => body.kind === 'planet' && body.home);
}

export function system_code(system: CustomSystem): string {
	const lines = [
		`${system.key} = {`,
		`\tname = ${quote(system.name || system.key)}`,
		`\tclass = ${quote(system.star_class)}`,
		`\tflags = { stellar_forge_custom_system }`,
	];
	if (has_home_planet(system)) {
		lines.push(
			`\tinit_effect = {`,
			`\t\tgenerate_home_system_resources = yes`,
			`\t}`,
		);
	}
	lines.push(
		`\tplanet = {`,
		`\t\tclass = star`,
		`\t\torbit_distance = 0`,
		`\t\torbit_angle = 1`,
		`\t\tsize = ${round(system.star_size)}`,
		`\t\thas_ring = no`,
		`\t}`,
	);
	for (const belt of system.belts.toSorted((a, b) => a.radius - b.radius)) {
		lines.push(
			`\tasteroid_belt = {`,
			`\t\ttype = ${belt.type}`,
			`\t\tradius = ${round(belt.radius)}`,
			`\t}`,
		);
	}
	let previous = { orbit: 0, angle: 0 };
	for (const body of sorted_bodies(system)) {
		lines.push(body_code(body, previous));
		previous = { orbit: body.orbit, angle: body.angle };
	}
	lines.push('}');
	return lines.join('\n');
}

export function initializers_file(
	systems: readonly CustomSystem[],
	header: string,
): string {
	return `\ufeff# ${header}\n\n${systems.map(system_code).join('\n\n')}\n`;
}

export function make_system_key(name: string, taken: Iterable<string>): string {
	const used = new Set(taken);
	const base = `sf_${
		name
			.normalize('NFKD')
			.replace(/[̀-ͯ]/g, '')
			.toLowerCase()
			.replace(/[^a-z0-9]+/g, '_')
			.replace(/^_+|_+$/g, '') || 'system'
	}`;
	let key = base;
	let i = 2;
	while (used.has(key)) key = `${base}_${i++}`;
	return key;
}
