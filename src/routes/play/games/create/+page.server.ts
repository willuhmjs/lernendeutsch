import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const languages = await prisma.language.findMany({
		orderBy: { name: 'asc' }
	});

	return {
		languages
	};
};
