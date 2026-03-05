import type { PageServerLoad } from './$types';
import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	let cefrLevel = 'A1';

	if (locals.user.activeLanguage?.id) {
		const progress = await prisma.userProgress.findUnique({
			where: {
				userId_languageId: {
					userId: locals.user.id,
					languageId: locals.user.activeLanguage.id
				}
			}
		});

		if (progress) {
			if (!progress.hasOnboarded) {
				throw redirect(302, '/onboarding');
			}
			cefrLevel = progress.cefrLevel;
		} else {
			throw redirect(302, '/onboarding');
		}
	} else {
		throw redirect(302, '/onboarding');
	}

	return {
		cefrLevel,
		language: locals.user.activeLanguage
	};
};
