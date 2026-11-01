import { Schema } from 'effect';

export const Moon = Schema.Struct({
	id: Schema.String,
	name: Schema.String,
	class: Schema.String,
	orbit: Schema.Number,
	angle: Schema.Number,
	size: Schema.Number,
});
export type Moon = typeof Moon.Type;

export const Body = Schema.Struct({
	id: Schema.String,
	kind: Schema.Literal('star', 'planet'),
	name: Schema.String,
	class: Schema.String,
	orbit: Schema.Number,
	angle: Schema.Number,
	size: Schema.Number,
	ring: Schema.Boolean,
	home: Schema.Boolean,
	moons: Schema.Array(Moon),
});
export type Body = typeof Body.Type;

export const Belt = Schema.Struct({
	id: Schema.String,
	type: Schema.String,
	radius: Schema.Number,
});
export type Belt = typeof Belt.Type;

export const CustomSystem = Schema.Struct({
	key: Schema.String,
	name: Schema.String,
	star_class: Schema.String,
	star_size: Schema.Number,
	bodies: Schema.Array(Body),
	belts: Schema.Array(Belt),
});
export type CustomSystem = typeof CustomSystem.Type;
