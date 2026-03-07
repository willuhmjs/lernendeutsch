import { redirect } from '@sveltejs/kit';
import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		redirect(302, '/login');
	}

	const classes = await prisma.class.findMany({
		where: {
			members: {
				some: {
					userId: locals.user.id
				}
			}
		},
		include: {
			members: {
				include: {
					user: {
						select: {
							id: true,
							name: true,
							username: true
						}
					}
				}
			},
			assignments: true
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	const myGames = await prisma.game.findMany({
		where: { creatorId: locals.user.id },
		orderBy: { createdAt: 'desc' },
		include: {
			_count: { select: { questions: true } }
		}
	});

	const communityGames = await prisma.game.findMany({
		where: { isPublished: true },
		orderBy: { createdAt: 'desc' },
		include: {
			_count: { select: { questions: true } },
			creator: { select: { username: true } }
		}
	});

	return {
		classes,
		myGames,
		communityGames
	};
};
