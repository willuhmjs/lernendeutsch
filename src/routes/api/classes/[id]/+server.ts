import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const classId = params.id;
		const userId = locals.user.id;

		const member = await prisma.classMember.findUnique({
			where: {
				classId_userId: { classId, userId }
			}
		});

		if (!member || member.role !== 'TEACHER') {
			return json({ error: 'Unauthorized: Only teachers can delete a class' }, { status: 403 });
		}

		await prisma.class.delete({
			where: { id: classId }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete class:', error);
		return json({ error: 'Failed to delete class' }, { status: 500 });
	}
};
