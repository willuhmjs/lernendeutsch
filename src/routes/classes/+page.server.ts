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

	return {
		classes
	};
};
