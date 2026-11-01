export type TextStyle = {
	text: string;
	font: string;
	bold: boolean;
	outline: boolean;
	outline_width: number;
	letter_spacing: number;
	line_height: number;
};

export const FONTS = [
	{ id: 'Inter', label: 'Inter' },
	{ id: 'Orbitron', label: 'Orbitron' },
	{ id: 'Bebas Neue', label: 'Bebas Neue' },
	{ id: 'Russo One', label: 'Russo One' },
	{ id: 'Press Start 2P', label: 'Press Start 2P' },
	{ id: 'JetBrains Mono', label: 'JetBrains Mono' },
	{ id: 'Georgia', label: 'Georgia' },
	{ id: 'Impact', label: 'Impact' },
] as const;

const BASE_SIZE = 200;
const PADDING = 24;
const TWEMOJI_BASE =
	'https://cdn.jsdelivr.net/gh/jdecked/twemoji@15.1.0/assets/svg/';

const emoji_cache = new Map<string, Promise<HTMLImageElement | null>>();

const EMOJI_PATTERN = /\p{Extended_Pictographic}|\p{Regional_Indicator}/u;

function is_emoji(grapheme: string): boolean {
	return EMOJI_PATTERN.test(grapheme);
}

function emoji_code(grapheme: string): string {
	const has_zwj = grapheme.includes('‍');
	const points = Array.from(grapheme)
		.map((char) => char.codePointAt(0)!)
		.filter((code) => has_zwj || code !== 0xfe0f)
		.map((code) => code.toString(16));
	return points.join('-');
}

function load_emoji(grapheme: string): Promise<HTMLImageElement | null> {
	const code = emoji_code(grapheme);
	const cached = emoji_cache.get(code);
	if (cached) return cached;
	const promise = new Promise<HTMLImageElement | null>((resolve) => {
		const image = new Image();
		image.crossOrigin = 'anonymous';
		image.onload = () => resolve(image);
		image.onerror = () => resolve(null);
		image.src = `${TWEMOJI_BASE}${code}.svg`;
	});
	emoji_cache.set(code, promise);
	return promise;
}

function split_graphemes(text: string): string[] {
	if (typeof Intl !== 'undefined' && 'Segmenter' in Intl) {
		const segmenter = new Intl.Segmenter(undefined, {
			granularity: 'grapheme',
		});
		return Array.from(segmenter.segment(text), (part) => part.segment);
	}
	return Array.from(text);
}

function font_string(style: TextStyle, size = BASE_SIZE) {
	return `${style.bold ? 800 : 500} ${size}px "${style.font}", "Inter", sans-serif`;
}

async function ensure_font(style: TextStyle) {
	if (typeof document === 'undefined' || !document.fonts) return;
	try {
		await document.fonts.load(font_string(style, 64), style.text || 'A');
	} catch {
		return;
	}
}

type Glyph = {
	grapheme: string;
	width: number;
	emoji: HTMLImageElement | null;
};

export async function render_text_mask(
	style: TextStyle,
): Promise<HTMLCanvasElement> {
	await ensure_font(style);
	const measure = document.createElement('canvas').getContext('2d')!;
	measure.font = font_string(style);
	const lines = (style.text.trim() === '' ? ' ' : style.text).split('\n');
	const spacing = style.letter_spacing * BASE_SIZE;
	const line_height = BASE_SIZE * style.line_height;
	const layout: Glyph[][] = [];
	for (const line of lines) {
		const glyphs: Glyph[] = [];
		for (const grapheme of split_graphemes(line)) {
			if (is_emoji(grapheme)) {
				const emoji = await load_emoji(grapheme);
				glyphs.push({
					grapheme,
					width: emoji ? BASE_SIZE * 0.95 : measure.measureText(grapheme).width,
					emoji,
				});
			} else {
				glyphs.push({
					grapheme,
					width: measure.measureText(grapheme).width,
					emoji: null,
				});
			}
		}
		layout.push(glyphs);
	}
	const line_widths = layout.map((glyphs) =>
		glyphs.reduce(
			(sum, glyph, i) => sum + glyph.width + (i > 0 ? spacing : 0),
			0,
		),
	);
	const outline_pad = style.outline ? style.outline_width : 0;
	const width = Math.max(
		Math.ceil(Math.max(...line_widths, 1) + PADDING * 2 + outline_pad * 2),
		4,
	);
	const height = Math.ceil(
		line_height * (layout.length - 1) +
			BASE_SIZE * 1.15 +
			PADDING * 2 +
			outline_pad * 2,
	);
	const canvas = document.createElement('canvas');
	canvas.width = width;
	canvas.height = height;
	const ctx = canvas.getContext('2d', { willReadFrequently: true })!;
	ctx.font = font_string(style);
	ctx.textBaseline = 'middle';
	ctx.fillStyle = '#ffffff';
	ctx.strokeStyle = '#ffffff';
	ctx.lineJoin = 'round';
	ctx.lineWidth = Math.max(style.outline_width, 1);
	layout.forEach((glyphs, line_index) => {
		let x = (width - line_widths[line_index]!) / 2;
		const y =
			PADDING + outline_pad + BASE_SIZE * 0.575 + line_index * line_height;
		for (const glyph of glyphs) {
			if (glyph.emoji) {
				const size = BASE_SIZE * 0.95;
				ctx.drawImage(glyph.emoji, x, y - size / 2, size, size);
			} else if (style.outline) {
				ctx.strokeText(glyph.grapheme, x, y);
			} else {
				ctx.fillText(glyph.grapheme, x, y);
			}
			x += glyph.width + spacing;
		}
	});
	const image = ctx.getImageData(0, 0, width, height);
	const data = image.data;
	for (let i = 0; i < data.length; i += 4) {
		const alpha = data[i + 3]! / 255;
		const luma =
			(0.2126 * data[i]! + 0.7152 * data[i + 1]! + 0.0722 * data[i + 2]!) / 255;
		const value = alpha * (0.35 + 0.65 * luma);
		data[i] = 255;
		data[i + 1] = 255;
		data[i + 2] = 255;
		data[i + 3] = Math.round(value * 255);
	}
	ctx.putImageData(image, 0, 0);
	if (style.outline && layout.some((glyphs) => glyphs.some((g) => g.emoji))) {
		const edges = document.createElement('canvas');
		edges.width = width;
		edges.height = height;
		const edges_ctx = edges.getContext('2d')!;
		edges_ctx.drawImage(canvas, 0, 0);
		edges_ctx.globalCompositeOperation = 'destination-out';
		const inset = Math.max(style.outline_width, 2);
		edges_ctx.filter = `blur(${inset / 2}px)`;
		edges_ctx.drawImage(canvas, 0, 0);
		ctx.clearRect(0, 0, width, height);
		ctx.drawImage(edges, 0, 0);
	}
	return canvas;
}
