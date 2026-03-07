import { error, redirect } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ params, locals }) => {
	const session = await locals.auth();
	if (!session?.user?.id) {
		throw redirect(303, '/login');
	}

	const classId = params.id;

	// Verify teacher access
	const classMember = await prisma.classMember.findFirst({
		where: {
			classId,
			userId: session.user.id,
			role: 'TEACHER'
		}
	});

	if (!classMember) {
		throw error(403, 'Only teachers can access this page');
	}

	// Fetch available games for the teacher to select
	const games = await prisma.game.findMany({
		where: {
			OR: [
				{ creatorId: session.user.id },
				{ isPublished: true }
			]
		},
		include: {
			_count: {
				select: { questions: true }
			}
		},
		orderBy: {
			createdAt: 'desc'
		}
	});

	return {
		games: games.filter(g => g._count.questions > 0) // Only return games with questions
	};
};
