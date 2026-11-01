import { strFromU8, unzipSync } from 'fflate';
import { Project } from './models/project';
import { ModInfo } from './models/mod_info';
import { import_initializers } from './system/import';
import { convert_blob_to_data_url } from './blob';
import { PROJECT_FILE } from './export';

export type OpenedMod = {
	project: Project;
	source: 'project' | 'rebuilt';
	file_name: string;
};

function read_descriptor(txt: string) {
	const text = (key: string) =>
		txt.match(new RegExp(`^\\s*${key}\\s*=\\s*"([^"]*)"`, 'm'))?.[1];
	const tags_block = txt.match(/^\s*tags\s*=\s*\{([^}]*)\}/m)?.[1] ?? '';
	const tags = [...tags_block.matchAll(/"([^"]+)"/g)].map((m) => m[1]!);
	return {
		name: text('name'),
		version: text('version'),
		supported_version: text('supported_version'),
		picture: text('picture'),
		tags,
	};
}

export async function open_mod_zip(file: File): Promise<OpenedMod> {
	const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
	const paths = Object.keys(entries).filter((path) => !path.endsWith('/'));
	const find = (test: (path: string) => boolean) => paths.find(test);

	const project_path = find(
		(path) => path === PROJECT_FILE || path.endsWith(`/${PROJECT_FILE}`),
	);
	if (project_path) {
		const json = JSON.parse(strFromU8(entries[project_path]!));
		const project = await Project.from_json(json.project ?? json);
		return { project, source: 'project', file_name: file.name };
	}

	const map_path = find((path) =>
		/(^|\/)map\/setup_scenarios\/[^/]+\.txt$/i.test(path),
	);
	if (!map_path) {
		throw new Error(
			'This zip has no map/setup_scenarios file, so it is not a galaxy map mod.',
		);
	}
	const root = map_path.replace(/map\/setup_scenarios\/[^/]+$/i, '');
	const base = await Project.from_txt(strFromU8(entries[map_path]!));

	const custom_systems = paths
		.filter((path) =>
			/(^|\/)common\/solar_system_initializers\/[^/]+\.txt$/i.test(path),
		)
		.flatMap((path) => {
			try {
				return import_initializers(strFromU8(entries[path]!));
			} catch {
				return [];
			}
		});

	const descriptor_path =
		find((path) => path === `${root}descriptor.mod`) ??
		find((path) => path.endsWith('descriptor.mod'));
	const descriptor =
		descriptor_path ?
			read_descriptor(strFromU8(entries[descriptor_path]!))
		:	null;

	let icon = '';
	const picture = descriptor?.picture ?? 'thumbnail.png';
	const picture_path =
		find((path) => path === `${root}${picture}`) ??
		find((path) => path.endsWith(`/${picture}`) || path === picture);
	if (picture_path) {
		const bytes = entries[picture_path]!;
		if (bytes.length < 1_500_000) {
			icon = await convert_blob_to_data_url(
				new Blob([bytes.slice().buffer as ArrayBuffer], { type: 'image/png' }),
			);
		}
	}

	const project = new Project({
		...base,
		custom_systems,
		mod_info: ModInfo.make({
			name: descriptor?.name ?? '',
			version: descriptor?.version ?? '1.0.0',
			supported_version: descriptor?.supported_version ?? 'v4.*',
			tags:
				descriptor && descriptor.tags.length > 0 ?
					descriptor.tags
				:	['Galaxy Generation'],
			icon,
			thumbnail: picture_path != null,
		}),
	});
	return { project, source: 'rebuilt', file_name: file.name };
}
