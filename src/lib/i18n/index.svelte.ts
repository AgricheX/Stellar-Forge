import { pt } from './pt';

type Locale = 'en' | 'pt';

const STORAGE_KEY = 'stellar-forge-locale';

function detect_locale(): Locale {
	const stored =
		typeof localStorage === 'undefined' ? null : (
			localStorage.getItem(STORAGE_KEY)
		);
	if (stored === 'en' || stored === 'pt') return stored;
	if (typeof navigator !== 'undefined') {
		const languages = navigator.languages ?? [navigator.language];
		if (languages.some((language) => language.toLowerCase().startsWith('pt')))
			return 'pt';
	}
	return 'en';
}

export const i18n = $state<{ locale: Locale }>({ locale: detect_locale() });

if (typeof document !== 'undefined') {
	document.documentElement.lang = i18n.locale === 'pt' ? 'pt-BR' : 'en';
}

export function set_locale(locale: Locale) {
	i18n.locale = locale;
	localStorage.setItem(STORAGE_KEY, locale);
	document.documentElement.lang = locale === 'pt' ? 'pt-BR' : 'en';
}

export function t(
	text: string,
	params?: Record<string, string | number>,
): string {
	let result = i18n.locale === 'pt' ? (pt[text] ?? text) : text;
	if (params) {
		for (const [key, value] of Object.entries(params)) {
			result = result.replaceAll(`{${key}}`, String(value));
		}
	}
	return result;
}

export function tr(en: string, pt: string): string {
	return i18n.locale === 'pt' ? pt : en;
}
