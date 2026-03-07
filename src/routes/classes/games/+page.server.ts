import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

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
		myGames,
		communityGames
	};
};
