import { redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export const load = async ({ params, locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const game = await prisma.game.findUnique({
		where: { id: params.id },
		include: {
			questions: {
				orderBy: { order: 'asc' }
			}
		}
	});

	if (!game) {
		throw redirect(302, '/games');
	}

	if (game.creatorId !== locals.user.id && locals.user.role !== 'ADMIN' && !game.isPublished) {
		throw redirect(302, '/games');
	}

	return {
		game
	};
};
