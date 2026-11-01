type StarClassInfo = {
	id: string;
	name: string;
	color: string;
	body: string;
	glow: number;
};

export const STAR_CLASSES: StarClassInfo[] = [
	{
		id: 'sc_b',
		name: 'Blue (B)',
		color: '#9cc0ff',
		body: 'pc_b_star',
		glow: 1.25,
	},
	{
		id: 'sc_a',
		name: 'White (A)',
		color: '#e6eeff',
		body: 'pc_a_star',
		glow: 1.15,
	},
	{
		id: 'sc_f',
		name: 'Yellow-White (F)',
		color: '#fff6d8',
		body: 'pc_f_star',
		glow: 1.05,
	},
	{
		id: 'sc_g',
		name: 'Yellow (G)',
		color: '#ffd76a',
		body: 'pc_g_star',
		glow: 1,
	},
	{
		id: 'sc_k',
		name: 'Orange (K)',
		color: '#ffae5a',
		body: 'pc_k_star',
		glow: 0.9,
	},
	{
		id: 'sc_m',
		name: 'Red Dwarf (M)',
		color: '#ff6e4a',
		body: 'pc_m_star',
		glow: 0.75,
	},
	{
		id: 'sc_m_giant',
		name: 'Red Giant',
		color: '#ff5533',
		body: 'pc_m_giant_star',
		glow: 1.5,
	},
	{
		id: 'sc_t',
		name: 'Brown Dwarf (T)',
		color: '#b0603a',
		body: 'pc_t_star',
		glow: 0.6,
	},
	{
		id: 'sc_neutron_star',
		name: 'Neutron Star',
		color: '#c8e6ff',
		body: 'pc_neutron_star',
		glow: 0.7,
	},
	{
		id: 'sc_pulsar',
		name: 'Pulsar',
		color: '#b0f0ff',
		body: 'pc_pulsar',
		glow: 0.8,
	},
	{
		id: 'sc_black_hole',
		name: 'Black Hole',
		color: '#1a1a1f',
		body: 'pc_black_hole',
		glow: 1.2,
	},
];

type PlanetClassInfo = {
	id: string;
	name: string;
	color: string;
	group: 'habitable' | 'uninhabitable' | 'special' | 'star';
	size: number;
};

export const PLANET_CLASSES: PlanetClassInfo[] = [
	{
		id: 'pc_continental',
		name: 'Continental',
		color: '#4f9d5a',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_ocean',
		name: 'Ocean',
		color: '#2f6fb8',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_tropical',
		name: 'Tropical',
		color: '#3fa36b',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_arid',
		name: 'Arid',
		color: '#c89a52',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_desert',
		name: 'Desert',
		color: '#d8b46a',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_savannah',
		name: 'Savannah',
		color: '#a8a04a',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_alpine',
		name: 'Alpine',
		color: '#9cb8c8',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_arctic',
		name: 'Arctic',
		color: '#d8ecf6',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_tundra',
		name: 'Tundra',
		color: '#8ca08c',
		group: 'habitable',
		size: 16,
	},
	{
		id: 'pc_gaia',
		name: 'Gaia',
		color: '#5fd08a',
		group: 'habitable',
		size: 18,
	},
	{
		id: 'pc_barren',
		name: 'Barren',
		color: '#8a8278',
		group: 'uninhabitable',
		size: 10,
	},
	{
		id: 'pc_barren_cold',
		name: 'Frozen Barren',
		color: '#a6aab4',
		group: 'uninhabitable',
		size: 10,
	},
	{
		id: 'pc_frozen',
		name: 'Frozen',
		color: '#c6e2f2',
		group: 'uninhabitable',
		size: 12,
	},
	{
		id: 'pc_molten',
		name: 'Molten',
		color: '#e0552d',
		group: 'uninhabitable',
		size: 10,
	},
	{
		id: 'pc_toxic',
		name: 'Toxic',
		color: '#9fbf3a',
		group: 'uninhabitable',
		size: 14,
	},
	{
		id: 'pc_gas_giant',
		name: 'Gas Giant',
		color: '#c99a6e',
		group: 'uninhabitable',
		size: 30,
	},
	{
		id: 'pc_asteroid',
		name: 'Asteroid',
		color: '#7a6f66',
		group: 'uninhabitable',
		size: 4,
	},
	{
		id: 'pc_ice_asteroid',
		name: 'Ice Asteroid',
		color: '#b8d8e8',
		group: 'uninhabitable',
		size: 4,
	},
	{
		id: 'pc_crystal_asteroid',
		name: 'Crystal Asteroid',
		color: '#c88cff',
		group: 'uninhabitable',
		size: 4,
	},
	{
		id: 'pc_relic',
		name: 'Relic World',
		color: '#b89a5a',
		group: 'special',
		size: 20,
	},
	{
		id: 'pc_nuked',
		name: 'Tomb World',
		color: '#7a7a4a',
		group: 'special',
		size: 16,
	},
	{
		id: 'pc_city',
		name: 'Ecumenopolis',
		color: '#d6c06a',
		group: 'special',
		size: 20,
	},
	{
		id: 'pc_hive',
		name: 'Hive World',
		color: '#a04a6a',
		group: 'special',
		size: 18,
	},
	{
		id: 'pc_machine',
		name: 'Machine World',
		color: '#6a8aa0',
		group: 'special',
		size: 18,
	},
	{
		id: 'pc_shattered',
		name: 'Shattered World',
		color: '#6a5a50',
		group: 'special',
		size: 12,
	},
	{
		id: 'pc_shielded',
		name: 'Shielded World',
		color: '#6ac8ff',
		group: 'special',
		size: 16,
	},
	{
		id: 'pc_infested',
		name: 'Infested World',
		color: '#8a3a5a',
		group: 'special',
		size: 16,
	},
];

export const STAR_BODY_CLASSES: PlanetClassInfo[] = STAR_CLASSES.map(
	(star) => ({
		id: star.body,
		name: star.name,
		color: star.color,
		group: 'star' as const,
		size: 20,
	}),
);

export const IDEAL_CLASS = 'ideal_planet_class';

export const BELT_TYPES = [
	{ id: 'rocky_asteroid_belt', name: 'Rocky', color: '#8a7a6a' },
	{ id: 'icy_asteroid_belt', name: 'Icy', color: '#a8d0e6' },
] as const;

export function star_info(id: string): StarClassInfo {
	return STAR_CLASSES.find((star) => star.id === id) ?? STAR_CLASSES[4]!;
}

export function planet_info(id: string): PlanetClassInfo {
	if (id === IDEAL_CLASS)
		return {
			id,
			name: 'Species ideal class',
			color: '#4fd1c5',
			group: 'habitable',
			size: 16,
		};
	return (
		PLANET_CLASSES.find((planet) => planet.id === id) ??
		STAR_BODY_CLASSES.find((planet) => planet.id === id) ?? {
			id,
			name: id,
			color: '#888888',
			group: 'special',
			size: 12,
		}
	);
}
