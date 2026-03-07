import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestHandler } from './$types';

export const POST: RequestHandler = async ({ request, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { title, description, language } = await request.json();

		if (!title || !language) {
			return json({ error: 'Title and language are required' }, { status: 400 });
		}

		const game = await prisma.game.create({
			data: {
				title,
				description,
				language,
				creatorId: session.user.id,
			}
		});

		return json({ game });
	} catch (error) {
		console.error('Failed to create game:', error);
		return json({ error: 'Failed to create game' }, { status: 500 });
	}
};
