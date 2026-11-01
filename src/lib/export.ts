import { initializers_file } from './system/initializers';
import { strToU8, zipSync } from 'fflate';
import { Option } from 'effect';
import { CANVAS_HEIGHT, CANVAS_WIDTH } from './constants';
import { generate_stellaris_galaxy } from './generate_galaxy_txt';
import type { Project } from './models/project';
import { version } from '../../package.json';
import { convert_data_url_to_blob } from './blob';

export const PAINT_A_GALAXY_WORKSHOP_URL =
	'https://steamcommunity.com/sharedfiles/filedetails/?id=3532904115';

export function slugify(name: string): string {
	const slug = name
		.normalize('NFD')
		.replace(/[̀-ͯ]/g, '')
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, '_')
		.replace(/^_+|_+$/g, '');
	return slug === '' ? 'forged_galaxy' : slug.slice(0, 48);
}

export type ImageStyle = {
	size: number;
	background: 'space' | 'transparent' | 'black';
	show_paint: boolean;
	show_hyperlanes: boolean;
	show_nebulas: boolean;
	show_spawns: boolean;
	show_title: boolean;
	accent: string;
};

export const DEFAULT_IMAGE_STYLE: ImageStyle = {
	size: 2048,
	background: 'space',
	show_paint: true,
	show_hyperlanes: true,
	show_nebulas: true,
	show_spawns: true,
	show_title: true,
	accent: '#e5322d',
};

function seeded(seed: number) {
	let a = seed >>> 0;
	return () => {
		a = (a + 0x6d2b79f5) >>> 0;
		let t = a;
		t = Math.imul(t ^ (t >>> 15), t | 1);
		t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
		return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
	};
}

export async function render_map_image(
	project: Project,
	style: ImageStyle = DEFAULT_IMAGE_STYLE,
): Promise<Blob> {
	const size = style.size;
	const scale = size / CANVAS_WIDTH;
	const canvas = new OffscreenCanvas(size, size);
	const ctx = canvas.getContext('2d')!;
	if (style.background !== 'transparent') {
		ctx.fillStyle = '#0d0d0f';
		ctx.fillRect(0, 0, size, size);
	}
	if (style.background === 'space') {
		const glow = ctx.createRadialGradient(
			size / 2,
			size / 2,
			0,
			size / 2,
			size / 2,
			size * 0.7,
		);
		glow.addColorStop(0, 'rgba(229,50,45,0.10)');
		glow.addColorStop(1, 'rgba(229,50,45,0)');
		ctx.fillStyle = glow;
		ctx.fillRect(0, 0, size, size);
		const rng = seeded(1234);
		for (let i = 0; i < size * 0.6; i++) {
			ctx.fillStyle = `rgba(255,255,255,${0.15 + rng() * 0.35})`;
			const r = rng() * 1.2 * scale;
			ctx.beginPath();
			ctx.arc(rng() * size, rng() * size, r, 0, Math.PI * 2);
			ctx.fill();
		}
	}
	ctx.save();
	ctx.scale(scale, scale);
	if (style.show_paint) {
		const bitmap = await createImageBitmap(project.canvas);
		ctx.save();
		ctx.globalAlpha = 0.22;
		ctx.globalCompositeOperation = 'screen';
		ctx.filter = 'blur(6px)';
		ctx.drawImage(bitmap, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT);
		ctx.restore();
	}
	if (style.show_nebulas) {
		for (const nebula of project.nebulas) {
			const gradient = ctx.createRadialGradient(
				nebula.coordinate.x,
				nebula.coordinate.y,
				0,
				nebula.coordinate.x,
				nebula.coordinate.y,
				nebula.radius,
			);
			gradient.addColorStop(0, 'rgba(141,109,251,0.35)');
			gradient.addColorStop(1, 'rgba(141,109,251,0)');
			ctx.fillStyle = gradient;
			ctx.beginPath();
			ctx.arc(
				nebula.coordinate.x,
				nebula.coordinate.y,
				nebula.radius,
				0,
				Math.PI * 2,
			);
			ctx.fill();
		}
	}
	const by_id = new Map(
		project.solar_systems.map((system) => [system.id, system]),
	);
	if (style.show_hyperlanes) {
		ctx.lineWidth = 0.8;
		ctx.strokeStyle = 'rgba(242,242,242,0.35)';
		ctx.beginPath();
		for (const lane of project.hyperlanes) {
			const a = by_id.get(lane.a);
			const b = by_id.get(lane.b);
			if (!a || !b) continue;
			ctx.moveTo(a.coordinate.x, a.coordinate.y);
			ctx.lineTo(b.coordinate.x, b.coordinate.y);
		}
		ctx.stroke();
		ctx.setLineDash([3, 3]);
		ctx.strokeStyle = 'rgba(166,140,255,0.8)';
		ctx.beginPath();
		for (const lane of project.wormholes) {
			const a = by_id.get(lane.a);
			const b = by_id.get(lane.b);
			if (!a || !b) continue;
			ctx.moveTo(a.coordinate.x, a.coordinate.y);
			ctx.lineTo(b.coordinate.x, b.coordinate.y);
		}
		ctx.stroke();
		ctx.setLineDash([]);
	}
	for (const system of project.solar_systems) {
		const { x, y } = system.coordinate;
		const is_spawn = style.show_spawns && system.is_spawn;
		const is_named =
			Option.isSome(system.resolve_initializer()) ||
			Option.isSome(system.resolve_name());
		const glow = ctx.createRadialGradient(x, y, 0, x, y, is_spawn ? 7 : 4);
		glow.addColorStop(
			0,
			is_spawn ? style.accent + 'cc' : 'rgba(255,255,255,0.55)',
		);
		glow.addColorStop(1, 'rgba(255,255,255,0)');
		ctx.fillStyle = glow;
		ctx.beginPath();
		ctx.arc(x, y, is_spawn ? 7 : 4, 0, Math.PI * 2);
		ctx.fill();
		ctx.fillStyle =
			is_spawn ? style.accent
			: is_named ? '#f0b43c'
			: '#ffffff';
		ctx.beginPath();
		ctx.arc(x, y, is_spawn ? 2.4 : 1.4, 0, Math.PI * 2);
		ctx.fill();
	}
	ctx.restore();
	if (style.show_title) {
		const pad = size * 0.03;
		ctx.fillStyle = 'rgba(13,13,15,0.75)';
		ctx.font = `700 ${size * 0.032}px Inter, sans-serif`;
		const title = project.mod_info.name.trim() || project.name;
		const width = ctx.measureText(title).width;
		ctx.fillRect(
			pad,
			size - pad - size * 0.075,
			width + size * 0.04,
			size * 0.075,
		);
		ctx.fillStyle = style.accent;
		ctx.fillRect(pad, size - pad - size * 0.075, size * 0.006, size * 0.075);
		ctx.fillStyle = '#f2f2f2';
		ctx.textBaseline = 'middle';
		ctx.fillText(title, pad + size * 0.022, size - pad - size * 0.045);
		ctx.font = `500 ${size * 0.013}px "JetBrains Mono", monospace`;
		ctx.fillStyle = '#9a9a9a';
		ctx.fillText(
			`${project.solar_systems.length} SYSTEMS · STELLAR FORGE`,
			pad + size * 0.022,
			size - pad - size * 0.016,
		);
	}
	return canvas.convertToBlob({ type: 'image/png' });
}

export const PROJECT_FILE = 'stellar_forge.json';

export function mod_display_name(project: Project) {
	return (project.mod_info.name.trim() || project.name).replaceAll('"', "'");
}

export function mod_folder(project: Project) {
	return `stellar_forge_${slugify(mod_display_name(project))}`;
}

export async function build_mod_zip(project: Project): Promise<Blob> {
	const info = project.mod_info;
	const name = mod_display_name(project);
	const slug = slugify(name);
	const folder = mod_folder(project);
	const galaxy_txt = generate_stellaris_galaxy(project);
	const tags = info.tags.length > 0 ? info.tags : ['Galaxy Generation'];
	const descriptor_lines = [
		`version="${info.version.trim().replaceAll('"', '') || '1.0.0'}"`,
		'tags={',
		...tags.map((tag) => `\t"${tag}"`),
		'}',
		`name="${name}"`,
		`supported_version="${info.supported_version.trim().replaceAll('"', '') || 'v4.*'}"`,
		'dependencies={',
		'\t"Paint a Galaxy"',
		'}',
	];
	if (info.thumbnail) descriptor_lines.push('picture="thumbnail.png"');
	const descriptor = descriptor_lines.join('\n') + '\n';
	const outer_mod = descriptor + `path="mod/${folder}"\n`;
	const readme = [
		`${name} · v${info.version}`,
		'',
		...(info.description.trim() ? [info.description.trim(), ''] : []),
		'Made with Stellar Forge: https://agrichex.github.io/Stellar-Forge/',
		'',
		'HOW TO INSTALL',
		'1. Subscribe to "Paint a Galaxy" on the Steam Workshop (required):',
		`   ${PAINT_A_GALAXY_WORKSHOP_URL}`,
		'2. Extract this zip into your Stellaris mod folder:',
		'   Windows: Documents\\Paradox Interactive\\Stellaris\\mod',
		'   Linux: ~/.local/share/Paradox Interactive/Stellaris/mod',
		'   macOS: ~/Documents/Paradox Interactive/Stellaris/mod',
		`   You should end up with "${folder}.mod" and the "${folder}" folder side by side.`,
		'3. Open the launcher, enable "Paint a Galaxy" and this mod in your playset.',
		`4. Start a new game, choose the "Elliptical" shape and "${project.name}" as the galaxy size.`,
		'',
		'COMO INSTALAR',
		'1. Inscreva-se no "Paint a Galaxy" na Steam Workshop (obrigatório):',
		`   ${PAINT_A_GALAXY_WORKSHOP_URL}`,
		'2. Extraia este zip na pasta de mods do Stellaris:',
		'   Windows: Documentos\\Paradox Interactive\\Stellaris\\mod',
		'   Linux: ~/.local/share/Paradox Interactive/Stellaris/mod',
		'   macOS: ~/Documents/Paradox Interactive/Stellaris/mod',
		`   Os arquivos "${folder}.mod" e a pasta "${folder}" devem ficar lado a lado.`,
		'3. Abra o launcher e ative o "Paint a Galaxy" e este mod no seu playset.',
		`4. Comece um jogo novo, escolha o formato "Elliptical" e "${project.name}" como tamanho da galáxia.`,
		'',
	].join('\n');
	const files: Record<string, Uint8Array> = {
		[`${folder}.mod`]: strToU8(outer_mod),
		[`${folder}/descriptor.mod`]: strToU8(descriptor),
		[`${folder}/map/setup_scenarios/${slug}.txt`]: strToU8(galaxy_txt),
		[`${folder}/${PROJECT_FILE}`]: strToU8(
			JSON.stringify({
				stellar_forge: version,
				project: await project.to_json(),
			}),
		),
		'README.txt': strToU8(readme),
	};
	if (project.custom_systems.length > 0) {
		files[`${folder}/common/solar_system_initializers/${folder}_systems.txt`] =
			strToU8(
				initializers_file(
					project.custom_systems,
					`${name} · custom systems made with Stellar Forge`,
				),
			);
	}
	if (info.thumbnail) {
		const thumbnail =
			info.icon ?
				await convert_data_url_to_blob(info.icon)
			:	await render_map_image(project, { ...DEFAULT_IMAGE_STYLE, size: 512 });
		files[`${folder}/thumbnail.png`] = new Uint8Array(
			await thumbnail.arrayBuffer(),
		);
	}
	const zipped = zipSync(files, { level: 6 });
	return new Blob([zipped.buffer as ArrayBuffer], { type: 'application/zip' });
}
