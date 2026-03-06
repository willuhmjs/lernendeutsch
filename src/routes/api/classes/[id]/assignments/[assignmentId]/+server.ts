import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';

export const DELETE: RequestHandler = async ({ params, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const classId = params.id;
		const assignmentId = params.assignmentId;

		// Verify the user is a TEACHER in this class
		const member = await prisma.classMember.findUnique({
			where: {
				classId_userId: {
					classId,
					userId: locals.user.id
				}
			}
		});

		if (!member || member.role !== 'TEACHER') {
			return json({ error: 'Forbidden' }, { status: 403 });
		}

		// Delete the assignment
		await prisma.assignment.delete({
			where: {
				id: assignmentId,
				classId: classId
			}
		});

		return json({ success: true });
	} catch (error) {
		console.error('Failed to delete assignment:', error);
		return json({ error: 'Failed to delete assignment' }, { status: 500 });
	}
};
