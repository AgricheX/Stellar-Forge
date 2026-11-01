import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { render_galaxy_mask, type GalaxyRecipe } from './galaxy';
import { render_text_mask, type TextStyle } from './text_mask';

type Point = { x: number; y: number };

export type Handle =
	| 'move'
	| 'rotate'
	| 'n'
	| 's'
	| 'e'
	| 'w'
	| 'ne'
	| 'nw'
	| 'se'
	| 'sw';

type PlacementSource =
	| { kind: 'text'; style: TextStyle }
	| { kind: 'galaxy'; recipe: GalaxyRecipe; label: string; systems: number };

export type PlacementTransform = {
	cx: number;
	cy: number;
	width: number;
	height: number;
	rotation: number;
	flip_x: boolean;
	flip_y: boolean;
};

const HANDLE_OFFSETS: Record<Exclude<Handle, 'move' | 'rotate'>, Point> = {
	n: { x: 0, y: -1 },
	s: { x: 0, y: 1 },
	e: { x: 1, y: 0 },
	w: { x: -1, y: 0 },
	ne: { x: 1, y: -1 },
	nw: { x: -1, y: -1 },
	se: { x: 1, y: 1 },
	sw: { x: -1, y: 1 },
};

export const RESIZE_HANDLES = Object.keys(HANDLE_OFFSETS) as Exclude<
	Handle,
	'move' | 'rotate'
>[];

const ROTATE_HANDLE_DISTANCE = 36;
const MIN_SIZE = 8;

function rotate(point: Point, radians: number): Point {
	const cos = Math.cos(radians);
	const sin = Math.sin(radians);
	return { x: point.x * cos - point.y * sin, y: point.x * sin + point.y * cos };
}

function to_local(transform: PlacementTransform, point: Point): Point {
	return rotate(
		{ x: point.x - transform.cx, y: point.y - transform.cy },
		(-transform.rotation * Math.PI) / 180,
	);
}

function to_world(transform: PlacementTransform, point: Point): Point {
	const rotated = rotate(point, (transform.rotation * Math.PI) / 180);
	return { x: rotated.x + transform.cx, y: rotated.y + transform.cy };
}

export function handle_position(
	transform: PlacementTransform,
	handle: Handle,
	zoom: number,
): Point {
	if (handle === 'move') return { x: transform.cx, y: transform.cy };
	if (handle === 'rotate') {
		return to_world(transform, {
			x: 0,
			y: -transform.height / 2 - ROTATE_HANDLE_DISTANCE / zoom,
		});
	}
	const offset = HANDLE_OFFSETS[handle];
	return to_world(transform, {
		x: (offset.x * transform.width) / 2,
		y: (offset.y * transform.height) / 2,
	});
}

export function hit_test(
	transform: PlacementTransform,
	point: Point,
	zoom: number,
): Handle | null {
	const tolerance = 9 / zoom;
	const rotate_position = handle_position(transform, 'rotate', zoom);
	if (
		Math.hypot(point.x - rotate_position.x, point.y - rotate_position.y) <=
		tolerance * 1.3
	) {
		return 'rotate';
	}
	for (const handle of RESIZE_HANDLES) {
		const position = handle_position(transform, handle, zoom);
		if (Math.hypot(point.x - position.x, point.y - position.y) <= tolerance) {
			return handle;
		}
	}
	const local = to_local(transform, point);
	if (
		Math.abs(local.x) <= transform.width / 2 &&
		Math.abs(local.y) <= transform.height / 2
	) {
		return 'move';
	}
	return null;
}

export function drag_transform(
	start: PlacementTransform,
	handle: Handle,
	start_point: Point,
	point: Point,
	modifiers: { shift: boolean; alt: boolean },
): PlacementTransform {
	if (handle === 'move') {
		return {
			...start,
			cx: start.cx + point.x - start_point.x,
			cy: start.cy + point.y - start_point.y,
		};
	}
	if (handle === 'rotate') {
		let angle =
			(Math.atan2(point.y - start.cy, point.x - start.cx) * 180) / Math.PI + 90;
		if (modifiers.shift) angle = Math.round(angle / 15) * 15;
		angle = (((angle % 360) + 540) % 360) - 180;
		return { ...start, rotation: Math.round(angle * 10) / 10 };
	}
	const offset = HANDLE_OFFSETS[handle];
	const local = to_local(start, point);
	const half_w = start.width / 2;
	const half_h = start.height / 2;
	let width = start.width;
	let height = start.height;
	let center_local: Point = { x: 0, y: 0 };
	if (modifiers.alt) {
		if (offset.x !== 0) width = Math.max(Math.abs(local.x) * 2, MIN_SIZE);
		if (offset.y !== 0) height = Math.max(Math.abs(local.y) * 2, MIN_SIZE);
	} else {
		const anchor = { x: -offset.x * half_w, y: -offset.y * half_h };
		if (offset.x !== 0) {
			width = Math.max(Math.abs(local.x - anchor.x), MIN_SIZE);
		}
		if (offset.y !== 0) {
			height = Math.max(Math.abs(local.y - anchor.y), MIN_SIZE);
		}
		if (modifiers.shift && offset.x !== 0 && offset.y !== 0) {
			const ratio = start.width / start.height;
			if (width / height > ratio) height = width / ratio;
			else width = height * ratio;
		}
		center_local = {
			x: offset.x === 0 ? 0 : anchor.x + (offset.x * width) / 2,
			y: offset.y === 0 ? 0 : anchor.y + (offset.y * height) / 2,
		};
	}
	if (modifiers.alt && modifiers.shift && offset.x !== 0 && offset.y !== 0) {
		const ratio = start.width / start.height;
		if (width / height > ratio) height = width / ratio;
		else width = height * ratio;
	}
	const center = to_world(start, center_local);
	return {
		...start,
		cx: center.x,
		cy: center.y,
		width: Math.round(width * 10) / 10,
		height: Math.round(height * 10) / 10,
	};
}

export function cursor_for_handle(handle: Handle | null, rotation: number) {
	if (handle == null) return null;
	if (handle === 'move') return 'move';
	if (handle === 'rotate') return 'grab';
	const base: Record<string, number> = {
		e: 0,
		se: 45,
		s: 90,
		sw: 135,
		w: 180,
		nw: 225,
		n: 270,
		ne: 315,
	};
	const angle = (((base[handle]! + rotation) % 180) + 180) % 180;
	const cursors = ['ew-resize', 'nwse-resize', 'ns-resize', 'nesw-resize'];
	return cursors[Math.round(angle / 45) % 4]!;
}

function canvas_to_url(canvas: HTMLCanvasElement | OffscreenCanvas) {
	if ('toDataURL' in canvas) return Promise.resolve(canvas.toDataURL());
	return canvas.convertToBlob({ type: 'image/png' }).then(
		(blob) =>
			new Promise<string>((resolve) => {
				const reader = new FileReader();
				reader.onload = () => resolve(String(reader.result));
				reader.readAsDataURL(blob);
			}),
	);
}

class Placement {
	active = $state(false);
	source = $state.raw<PlacementSource | null>(null);
	mask = $state.raw<HTMLCanvasElement | OffscreenCanvas | null>(null);
	mask_url = $state('');
	transform = $state<PlacementTransform>({
		cx: CANVAS_WIDTH / 2,
		cy: CANVAS_HEIGHT / 2,
		width: 600,
		height: 300,
		rotation: 0,
		flip_x: false,
		flip_y: false,
	});
	strength = $state(0.7);
	blur = $state(0);
	erase = $state(false);
	replace = $state(false);
	busy = $state(false);
	#version = 0;

	async #set_mask(
		mask: HTMLCanvasElement | OffscreenCanvas,
		fit: 'text' | 'full' | 'keep',
	) {
		const url = await canvas_to_url(mask);
		this.mask = mask;
		this.mask_url = url;
		if (fit === 'full') {
			this.transform = {
				cx: CANVAS_WIDTH / 2,
				cy: CANVAS_HEIGHT / 2,
				width: CANVAS_WIDTH,
				height: CANVAS_HEIGHT,
				rotation: 0,
				flip_x: false,
				flip_y: false,
			};
		} else if (fit === 'text') {
			const max_w = CANVAS_WIDTH * 0.75;
			const max_h = CANVAS_HEIGHT * 0.6;
			const scale = Math.min(max_w / mask.width, max_h / mask.height);
			this.transform = {
				cx: CANVAS_WIDTH / 2,
				cy: CANVAS_HEIGHT / 2,
				width: Math.round(mask.width * scale),
				height: Math.round(mask.height * scale),
				rotation: 0,
				flip_x: false,
				flip_y: false,
			};
		} else {
			const ratio = mask.width / mask.height;
			const area = this.transform.width * this.transform.height;
			const height = Math.sqrt(area / ratio);
			this.transform = {
				...this.transform,
				width: Math.round(height * ratio),
				height: Math.round(height),
			};
		}
	}

	async start_text(style: TextStyle) {
		const version = ++this.#version;
		this.busy = true;
		try {
			const mask = await render_text_mask(style);
			if (version !== this.#version) return;
			const keep = this.active && this.source?.kind === 'text';
			this.source = { kind: 'text', style };
			await this.#set_mask(mask, keep ? 'keep' : 'text');
			this.replace = false;
			this.active = true;
		} finally {
			if (version === this.#version) this.busy = false;
		}
	}

	async start_galaxy(recipe: GalaxyRecipe, label: string, systems: number) {
		const version = ++this.#version;
		this.busy = true;
		try {
			const mask = render_galaxy_mask(recipe);
			if (version !== this.#version) return;
			this.source = { kind: 'galaxy', recipe, label, systems };
			await this.#set_mask(mask, 'full');
			this.strength = 1;
			this.blur = 0;
			this.erase = false;
			this.replace = true;
			this.active = true;
		} finally {
			if (version === this.#version) this.busy = false;
		}
	}

	set_transform(partial: Partial<PlacementTransform>) {
		this.transform = { ...this.transform, ...partial };
	}

	cancel() {
		this.#version++;
		this.active = false;
		this.source = null;
		this.mask = null;
		this.mask_url = '';
		this.busy = false;
	}

	draw_into(ctx: OffscreenCanvasRenderingContext2D) {
		const mask = this.mask;
		if (!mask) return;
		const t = this.transform;
		let source: HTMLCanvasElement | OffscreenCanvas = mask;
		if (this.erase) {
			const tinted = new OffscreenCanvas(mask.width, mask.height);
			const tinted_ctx = tinted.getContext('2d')!;
			tinted_ctx.drawImage(mask, 0, 0);
			tinted_ctx.globalCompositeOperation = 'source-in';
			tinted_ctx.fillStyle = '#000000';
			tinted_ctx.fillRect(0, 0, mask.width, mask.height);
			source = tinted;
		}
		ctx.save();
		ctx.globalAlpha = this.strength;
		if (this.blur > 0) ctx.filter = `blur(${this.blur}px)`;
		ctx.translate(t.cx, t.cy);
		ctx.rotate((t.rotation * Math.PI) / 180);
		ctx.scale(t.flip_x ? -1 : 1, t.flip_y ? -1 : 1);
		ctx.drawImage(source, -t.width / 2, -t.height / 2, t.width, t.height);
		ctx.restore();
	}

	async render_result(current: Blob): Promise<Blob> {
		const canvas = new OffscreenCanvas(CANVAS_WIDTH, CANVAS_HEIGHT);
		const ctx = canvas.getContext('2d')!;
		ctx.fillStyle = '#000000';
		ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		if (!this.replace) {
			ctx.filter = 'grayscale(1)';
			ctx.drawImage(
				await createImageBitmap(current),
				0,
				0,
				CANVAS_WIDTH,
				CANVAS_HEIGHT,
			);
			ctx.filter = 'none';
		}
		this.draw_into(ctx);
		return canvas.convertToBlob({ type: 'image/jpeg', quality: 1 });
	}
}

export const placement = new Placement();
