function hash_seed(seed: string): number {
	let h = 1779033703 ^ seed.length;
	for (let i = 0; i < seed.length; i++) {
		h = Math.imul(h ^ seed.charCodeAt(i), 3432918353);
		h = (h << 13) | (h >>> 19);
	}
	h = Math.imul(h ^ (h >>> 16), 2246822507);
	h = Math.imul(h ^ (h >>> 13), 3266489909);
	return (h ^ (h >>> 16)) >>> 0;
}

function mulberry32(seed: number): () => number {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export function make_rng(seed: string): () => number {
	return mulberry32(hash_seed(seed));
}

const SEED_WORDS = [
	'nova',
	'vega',
	'orion',
	'lyra',
	'draco',
	'atlas',
	'aurora',
	'nebula',
	'quasar',
	'pulsar',
	'helix',
	'zenith',
	'vortex',
	'ember',
	'forge',
	'aegis',
	'astra',
	'cygnus',
	'hydra',
	'sol',
];

export function make_seed(): string {
	const word = SEED_WORDS[Math.floor(Math.random() * SEED_WORDS.length)];
	const number = Math.floor(Math.random() * 9000 + 1000);
	return `${word}-${number}`;
}

export async function with_seeded_random<T>(
	seed: string,
	fn: () => Promise<T>,
): Promise<T> {
	const original = Math.random;
	Math.random = make_rng(`${seed}:generator`);
	try {
		return await fn();
	} finally {
		Math.random = original;
	}
}
