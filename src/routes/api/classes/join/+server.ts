import { json } from '@sveltejs/kit';
import type { RequestHandler } from './$types';
import { prisma } from '$lib/server/prisma';

export const POST: RequestHandler = async ({ request, locals }) => {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { inviteCode } = await request.json();

		if (!inviteCode || typeof inviteCode !== 'string') {
			return json({ error: 'Invite code is required' }, { status: 400 });
		}

		const targetClass = await prisma.class.findUnique({
			where: { inviteCode },
			include: {
				members: {
					where: {
						userId: locals.user.id
					}
				}
			}
		});

		if (!targetClass) {
			return json({ error: 'Invalid invite code' }, { status: 404 });
		}

		if (targetClass.members.length > 0) {
			return json({ error: 'You are already a member of this class' }, { status: 400 });
		}

		const classMember = await prisma.classMember.create({
			data: {
				classId: targetClass.id,
				userId: locals.user.id,
				role: 'STUDENT'
			}
		});

		return json({ success: true, class: targetClass });
	} catch (error) {
		console.error('Failed to join class:', error);
		return json({ error: 'Failed to join class' }, { status: 500 });
	}
};
