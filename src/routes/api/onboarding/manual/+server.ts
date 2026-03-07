import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function POST({ request, locals }: any) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { level } = body;
		const userId = locals.user.id;

		if (!level || !['A1', 'A2', 'B1', 'B2', 'C1', 'C2'].includes(level)) {
			return json({ error: 'Invalid or missing CEFR level' }, { status: 400 });
		}

		console.log(`[Manual Onboarding Complete] User ${userId} placed at level ${level}.`);

		await prisma.userProgress.upsert({
			where: {
				userId_languageId: { userId, languageId: locals.user.activeLanguage!.id }
			},
			create: {
				userId,
				languageId: locals.user.activeLanguage!.id,
				hasOnboarded: true,
				cefrLevel: level
			},
			update: {
				hasOnboarded: true,
				cefrLevel: level
			}
		});

		console.log('Successfully completed manual onboarding');

		return json({ success: true, level });
	} catch (error: any) {
		console.error('Error in manual onboarding API:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
