import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { SM2_CONFIG, SRS_STATE_CONFIG } from '$lib/server/srsConfig';

export async function POST(event) {
	const { params, locals } = event;

	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const grammarRuleId = params.id;
	const userId = locals.user.id;

	const grammarRule = await prisma.grammarRule.findUnique({
		where: { id: grammarRuleId },
		include: { dependencies: true }
	});

	if (!grammarRule) {
		return json({ error: 'Grammar rule not found' }, { status: 404 });
	}

	// Server-side validate all prerequisites are mastered
	if (grammarRule.dependencies.length > 0) {
		const prereqStatuses = await prisma.userGrammarRule.findMany({
			where: {
				userId,
				grammarRuleId: { in: grammarRule.dependencies.map((d) => d.id) }
			},
			select: { grammarRuleId: true, srsState: true }
		});

		const allMastered = grammarRule.dependencies.every((dep) => {
			const status = prereqStatuses.find((s) => s.grammarRuleId === dep.id);
			return status?.srsState === 'MASTERED';
		});

		if (!allMastered) {
			return json(
				{ error: 'All prerequisites must be mastered before marking this rule as mastered.' },
				{ status: 403 }
			);
		}
	}

	// Set SM-2 progress values that correspond to MASTERED state
	const masteredInterval = SRS_STATE_CONFIG.MASTERED_INTERVAL_DAYS;
	const nextReviewDate = new Date();
	nextReviewDate.setDate(nextReviewDate.getDate() + masteredInterval);

	const sm2Data = {
		interval: masteredInterval,
		easeFactor: SM2_CONFIG.DEFAULT_EASE_FACTOR,
		consecutiveCorrect: SRS_STATE_CONFIG.KNOWN_THRESHOLD + 1,
		nextReviewDate
	};

	await prisma.userGrammarRuleProgress.upsert({
		where: { userId_grammarRuleId: { userId, grammarRuleId } },
		create: { userId, grammarRuleId, ...sm2Data },
		update: sm2Data
	});

	await prisma.userGrammarRule.upsert({
		where: { userId_grammarRuleId: { userId, grammarRuleId } },
		create: {
			userId,
			grammarRuleId,
			eloRating: 1200,
			srsState: 'MASTERED',
			nextReviewDate
		},
		update: {
			srsState: 'MASTERED',
			eloRating: 1200,
			nextReviewDate
		}
	});

	return json({ success: true });
}
