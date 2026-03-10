import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { redirect } from '@sveltejs/kit';
import { CefrService } from '$lib/server/cefrService';

export const load: PageServerLoad = async ({ locals }) => {
	if (!locals.user) {
		throw redirect(302, '/login');
	}

	const user = locals.user;

	if (user.activeLanguage?.id) {
		const progress = await prisma.userProgress.findUnique({
			where: {
				userId_languageId: {
					userId: user.id,
					languageId: user.activeLanguage.id
				}
			}
		});

		if (!progress?.hasOnboarded) {
			throw redirect(302, '/onboarding');
		}
	} else {
		throw redirect(302, '/onboarding');
	}

	const vocabularies = await prisma.userVocabulary.findMany({
		where: {
			userId: user.id,
			vocabulary: { languageId: user.activeLanguage?.id }
		},
		include: { vocabulary: true },
		orderBy: { eloRating: 'desc' }
	});

	const grammarRules = await prisma.userGrammarRule.findMany({
		where: {
			userId: user.id,
			grammarRule: { languageId: user.activeLanguage?.id }
		},
		include: { grammarRule: true },
		orderBy: { eloRating: 'desc' }
	});

	const allGrammarRules = await prisma.grammarRule.findMany({
		where: { languageId: user.activeLanguage?.id },
		include: { dependencies: true },
		orderBy: { level: 'asc' }
	});

	const [dueVocabReviewCount, dueGrammarReviewCount] = await Promise.all([
		prisma.userVocabularyProgress.count({
			where: {
				userId: user.id,
				nextReviewDate: { lte: new Date() }
			}
		}),
		prisma.userGrammarRuleProgress.count({
			where: {
				userId: user.id,
				nextReviewDate: { lte: new Date() }
			}
		})
	]);

	const dueReviewCount = dueVocabReviewCount + dueGrammarReviewCount;

	const cefrProgress = user.activeLanguage?.id 
		? await CefrService.getCefrProgress(user.id, user.activeLanguage.id)
		: null;

	return {
		vocabularies,
		grammarRules,
		allGrammarRules,
		dueReviewCount,
		cefrProgress
	};
};
