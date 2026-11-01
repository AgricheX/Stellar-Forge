import type { ToolId } from './models/tool';
import type { Icons } from './components/icons';

export type LayerId =
	| 'paint'
	| 'systems'
	| 'spawns'
	| 'hyperlanes'
	| 'wormholes'
	| 'nebulas'
	| 'fe_zones'
	| 'guides';

type LayerState = { visible: boolean; locked: boolean; opacity: number };

export const LAYERS: { id: LayerId; name: string; icon: keyof typeof Icons }[] =
	[
		{ id: 'paint', name: 'Painting', icon: 'Brush' },
		{ id: 'systems', name: 'Star Systems', icon: 'Sparkle' },
		{ id: 'spawns', name: 'Spawns', icon: 'MapPin' },
		{ id: 'hyperlanes', name: 'Hyperlanes', icon: 'Waypoints' },
		{ id: 'wormholes', name: 'Wormholes', icon: 'Galaxy' },
		{ id: 'nebulas', name: 'Nebulas', icon: 'Cloud' },
		{ id: 'fe_zones', name: 'Fallen Empire Zones', icon: 'Castle' },
		{ id: 'guides', name: 'Guides', icon: 'Crosshair' },
	];

const TOOL_LAYERS: Record<ToolId, LayerId> = {
	freehand_draw: 'paint',
	freehand_erase: 'paint',
	circle_draw: 'paint',
	circle_erase: 'paint',
	ellipse_draw: 'paint',
	ellipse_erase: 'paint',
	rectangle_draw: 'paint',
	rectangle_erase: 'paint',
	line_draw: 'paint',
	line_erase: 'paint',
	polygon_draw: 'paint',
	polygon_erase: 'paint',
	star_draw: 'paint',
	star_erase: 'paint',
	ring_draw: 'paint',
	ring_erase: 'paint',
	spiral_draw: 'paint',
	spiral_erase: 'paint',
	hyperlane_toggle: 'hyperlanes',
	wormhole_toggle: 'wormholes',
	nebula_create: 'nebulas',
	nebula_delete: 'nebulas',
	solar_system_create: 'systems',
	solar_system_delete: 'systems',
	solar_system_lock: 'systems',
	solar_system_unlock: 'systems',
	solar_system_move: 'systems',
	cluster_move: 'systems',
	spawn_toggle: 'spawns',
	spawn_preferred_toggle: 'spawns',
	fallen_empire_zone_create: 'fe_zones',
	fallen_empire_zone_delete: 'fe_zones',
};

export function get_tool_layer(tool_id: ToolId): LayerId {
	return TOOL_LAYERS[tool_id];
}

const STORAGE_KEY = 'stellar-forge-layers';

function default_layers(): Record<LayerId, LayerState> {
	return Object.fromEntries(
		LAYERS.map((layer) => [
			layer.id,
			{ visible: true, locked: false, opacity: 1 },
		]),
	) as Record<LayerId, LayerState>;
}

function load_layers(): Record<LayerId, LayerState> {
	const defaults = default_layers();
	try {
		const stored = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? '{}');
		for (const layer of LAYERS) {
			const value = stored?.[layer.id];
			if (value && typeof value === 'object') {
				defaults[layer.id] = {
					visible: value.visible !== false,
					locked: value.locked === true,
					opacity:
						typeof value.opacity === 'number' ?
							Math.min(Math.max(value.opacity, 0), 1)
						:	1,
				};
			}
		}
	} catch {
		return defaults;
	}
	return defaults;
}

type Panel =
	| 'none'
	| 'shortcuts'
	| 'command'
	| 'export'
	| 'guide'
	| 'random'
	| 'system'
	| 'save'
	| 'mod'
	| 'map';

class Ui {
	layers = $state(load_layers());
	solo = $state<LayerId | null>(null);
	panel = $state<Panel>('none');
	system_focus = $state<string | null>(null);
	system_assign = $state<number | null>(null);
	zoom = $state(1);
	space_held = $state(false);
	camera: {
		reset: () => void;
		scale_by: (factor: number) => void;
		scale_to: (k: number) => void;
	} = { reset: () => {}, scale_by: () => {}, scale_to: () => {} };
	cursor = $state<{ x: number; y: number } | null>(null);
	layers_open = $state(
		localStorage.getItem('stellar-forge-layers-open') === '1',
	);
	advanced = $state(localStorage.getItem('stellar-forge-advanced') === '1');

	is_visible(layer: LayerId) {
		if (this.solo != null && this.solo !== layer) return false;
		return this.layers[layer].visible;
	}

	opacity(layer: LayerId) {
		return this.is_visible(layer) ? this.layers[layer].opacity : 0;
	}

	is_locked(layer: LayerId) {
		return this.layers[layer].locked;
	}

	is_tool_locked(tool_id: ToolId) {
		return this.is_locked(get_tool_layer(tool_id));
	}

	toggle_visible(layer: LayerId) {
		this.layers[layer].visible = !this.layers[layer].visible;
		this.save();
	}

	toggle_locked(layer: LayerId) {
		this.layers[layer].locked = !this.layers[layer].locked;
		this.save();
	}

	set_opacity(layer: LayerId, opacity: number) {
		this.layers[layer].opacity = opacity;
		this.save();
	}

	toggle_solo(layer: LayerId) {
		this.solo = this.solo === layer ? null : layer;
	}

	toggle_layers_open() {
		this.layers_open = !this.layers_open;
		localStorage.setItem(
			'stellar-forge-layers-open',
			this.layers_open ? '1' : '0',
		);
	}

	toggle_advanced() {
		this.advanced = !this.advanced;
		localStorage.setItem('stellar-forge-advanced', this.advanced ? '1' : '0');
	}

	reset_layers() {
		this.layers = default_layers();
		this.solo = null;
		this.save();
	}

	save() {
		localStorage.setItem(STORAGE_KEY, JSON.stringify(this.layers));
	}

	open(panel: Panel) {
		this.panel = panel;
	}

	close() {
		this.panel = 'none';
	}
}

export const ui = new Ui();
