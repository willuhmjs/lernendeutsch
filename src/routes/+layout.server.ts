import { prisma } from '$lib/server/prisma';
import type { LayoutServerLoad } from './$types';

export const load: LayoutServerLoad = async ({ locals }) => {
	const languages = await prisma.language.findMany();

	return {
		user: locals.user,
		languages
	};
};
