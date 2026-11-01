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
		remote_file_id: text('remote_file_id'),
		tags,
	};
}

export async function open_mod_zip(file: File): Promise<OpenedMod> {
	const entries = unzipSync(new Uint8Array(await file.arrayBuffer()));
	const paths = Object.keys(entries).filter((path) => !path.endsWith('/'));
	const find = (test: (path: string) => boolean) => paths.find(test);

	const descriptor_path =
		find((path) => /^[^/]*\/?descriptor\.mod$/i.test(path)) ??
		find((path) => path.endsWith('descriptor.mod'));
	const descriptor =
		descriptor_path ?
			read_descriptor(strFromU8(entries[descriptor_path]!))
		:	null;
	const remote_file_id = descriptor?.remote_file_id ?? '';

	const project_path = find(
		(path) => path === PROJECT_FILE || path.endsWith(`/${PROJECT_FILE}`),
	);
	if (project_path) {
		const json = JSON.parse(strFromU8(entries[project_path]!));
		const main = await Project.from_json(json.project ?? json);
		const project = new Project({
			...main,
			mod_info: ModInfo.make({
				...main.mod_info,
				remote_file_id: main.mod_info.remote_file_id || remote_file_id,
			}),
		});
		return { project, source: 'project', file_name: file.name };
	}

	const map_paths = paths
		.filter((path) => /(^|\/)map\/setup_scenarios\/[^/]+\.txt$/i.test(path))
		.sort((a, b) => a.localeCompare(b));
	if (map_paths.length === 0) {
		throw new Error(
			'This zip has no map/setup_scenarios file, so it is not a galaxy map mod.',
		);
	}
	const root = map_paths[0]!.replace(/map\/setup_scenarios\/[^/]+$/i, '');

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

	const maps: Project[] = [];
	const used_names = new Set<string>();
	for (const path of map_paths) {
		let base: Project;
		try {
			base = await Project.from_txt(strFromU8(entries[path]!));
		} catch {
			continue;
		}
		let name = base.name;
		let n = 2;
		while (used_names.has(name)) name = `${base.name} ${n++}`;
		used_names.add(name);
		maps.push(new Project({ ...base, name }));
	}
	const [first, ...rest] = maps;
	if (!first) {
		throw new Error('Could not read the map files in this zip.');
	}

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
		...first,
		name: rest.length > 0 ? descriptor?.name?.trim() || first.name : first.name,
		map_name: rest.length > 0 ? first.name : '',
		maps: rest.map((map) => map.current_map()),
		map_index: 0,
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
			remote_file_id,
		}),
	});
	return { project, source: 'rebuilt', file_name: file.name };
}
