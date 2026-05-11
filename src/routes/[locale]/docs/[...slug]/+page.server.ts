import { loadDoc } from '$lib/docs.server';
import type { PageServerLoad } from './$types';
import type { Locale } from '$lib/config/locales';

export const load: PageServerLoad = async ({ params }) => {
	const locale = params.locale as Locale;
	const slug = params.slug;

	const doc = await loadDoc(locale, slug);

	return {
		locale,
		...doc
	};
};