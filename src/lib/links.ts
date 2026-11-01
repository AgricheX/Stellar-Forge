export const LINKS = {
	discord: 'https://discord.gg/s3EbgNSsJW',
	github: 'https://github.com/AgricheX/Stellar-Forge',
	issues: 'https://github.com/AgricheX/Stellar-Forge/issues',
	nexus: 'https://agrichex.github.io/Nexus/',
	workshop: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3532904115',
	steam: 'https://steamcommunity.com/sharedfiles/filedetails/?id=3831829510',
	paint_a_galaxy: 'https://github.com/oatmealproblem/paint-a-galaxy',
	solar_system_editor:
		'https://github.com/KillyBlame/Stellaris_Solarsystem_Editor',
	stellarmaps: 'https://stellarmaps.app',
} as const;

export function hash_query(url: URL) {
	const hash = url.hash.slice(1);
	const index = hash.indexOf('?');
	return new URLSearchParams(index === -1 ? '' : hash.slice(index + 1));
}
