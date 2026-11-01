import adapter from '@sveltejs/adapter-static';
import { vitePreprocess } from '@sveltejs/vite-plugin-svelte';

/** @type {import('@sveltejs/kit').Config} */
const config = {
	// Consult https://svelte.dev/docs/kit/integrations
	// for more information about preprocessors
	preprocess: vitePreprocess(),
	kit: {
		router: { resolution: 'client', type: 'hash' },
		paths: {
			base: process.env.BASE_PATH ?? '',
		},
		output: {
			bundleStrategy: 'inline',
		},
		adapter: adapter({
			fallback: 'index.html',
		}),
	},
	compilerOptions: {
		experimental: {
			async: true,
		},
	},
};

export default config;
