import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const PUT: RequestHandler = async ({ params, request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { title, description, isPublished } = await request.json();

		const game = await prisma.game.findUnique({
			where: { id: params.id }
		});

		if (!game) {
			return json({ error: 'Game not found' }, { status: 404 });
		}

		if (game.creatorId !== session.user.id) {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		const updatedGame = await prisma.game.update({
			where: { id: params.id },
			data: {
				title: title !== undefined ? title : game.title,
				description: description !== undefined ? description : game.description,
				isPublished: isPublished !== undefined ? isPublished : game.isPublished,
			}
		});

		return json({ game: updatedGame });
	} catch (error) {
		console.error('Failed to update game:', error);
		return json({ error: 'Failed to update game' }, { status: 500 });
	}
};
