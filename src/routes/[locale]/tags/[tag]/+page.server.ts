import type { PageServerLoad } from './$types';
import { getFlatDocs } from '$lib/docs.server';
import type { Locale } from '$lib/config/locales';

export const load: PageServerLoad = async ({ params }) => {
	const { locale, tag } = params;

	// 🌟 复用 docs.server.ts 里的逻辑
	const allDocs = await getFlatDocs(locale as Locale);

	const matchedDocs = allDocs
		// 筛选包含该标签的文档
		.filter((doc) => doc.tags.includes(tag))
		.map((doc) => ({
			slug: doc.slug,
			title: doc.title,
			description: doc.description,
			published: doc.published,
			updated: doc.updated
		}));

	return {
		tag,
		docs: matchedDocs
	};
};