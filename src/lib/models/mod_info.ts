import { Schema } from 'effect';

export const MOD_TAGS = [
	'Galaxy Generation',
	'Overhaul',
	'Gameplay',
	'Balance',
	'Fixes',
	'Graphics',
	'Utilities',
	'Customization',
	'Total Conversion',
	'Spaceships',
	'Species',
	'Events',
] as const;

export class ModInfo extends Schema.Class<ModInfo>('ModInfo')({
	name: Schema.String.pipe(
		Schema.optional,
		Schema.withDefaults({ constructor: () => '', decoding: () => '' }),
	),
	version: Schema.String.pipe(
		Schema.optional,
		Schema.withDefaults({
			constructor: () => '1.0.0',
			decoding: () => '1.0.0',
		}),
	),
	description: Schema.String.pipe(
		Schema.optional,
		Schema.withDefaults({ constructor: () => '', decoding: () => '' }),
	),
	tags: Schema.Array(Schema.String).pipe(
		Schema.optional,
		Schema.withDefaults({
			constructor: () => ['Galaxy Generation'],
			decoding: () => ['Galaxy Generation'],
		}),
	),
	supported_version: Schema.String.pipe(
		Schema.optional,
		Schema.withDefaults({ constructor: () => 'v4.*', decoding: () => 'v4.*' }),
	),
	icon: Schema.String.pipe(
		Schema.optional,
		Schema.withDefaults({ constructor: () => '', decoding: () => '' }),
	),
	thumbnail: Schema.Boolean.pipe(
		Schema.optional,
		Schema.withDefaults({ constructor: () => true, decoding: () => true }),
	),
}) {
	static default() {
		return ModInfo.make({});
	}
}

export function bump_version(version: string) {
	const parts = version.split('.');
	const last = Number.parseInt(parts.at(-1) ?? '', 10);
	if (Number.isNaN(last)) return version;
	parts[parts.length - 1] = String(last + 1);
	return parts.join('.');
}
