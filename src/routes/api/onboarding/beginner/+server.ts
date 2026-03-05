import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

/**
 * Absolute beginner onboarding endpoint.
 * Seeds the user's account with essential A1 starter vocabulary and grammar as LEARNING,
 * so the lesson generator immediately has material to teach them from scratch.
 */

// Core A1 grammar concepts to seed as LEARNING
const BEGINNER_GRAMMAR_TITLES = [
	'Present Tense (Präsens) - Regular Verbs',
	'Sein, Haben, Werden - Conjugation',
	'Definite Articles (Nominative)',
	'Personal Pronouns (Nominative)',
	'Word Order - Main Clause (Hauptsatz)',
];

export async function POST({ locals }: any) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = locals.user.id;
	const languageId = locals.user.activeLanguage!.id;

	try {
		// 1. Set user level to A1
		await prisma.userProgress.upsert({
			where: {
				userId_languageId: { userId, languageId }
			},
			create: {
				userId,
				languageId,
				hasOnboarded: true,
				cefrLevel: 'A1'
			},
			update: {
				hasOnboarded: true,
				cefrLevel: 'A1'
			}
		});

		// 2. Seed starter vocabulary as LEARNING dynamically
		const startingElo = 1000; // A1 base Elo
		let vocabSeeded = 0;

		const beginnerVocabularies = await prisma.vocabulary.findMany({
			where: {
				languageId,
				isBeginner: true
			}
		});

		for (const vocabulary of beginnerVocabularies) {
			await prisma.userVocabulary.upsert({
				where: {
					userId_vocabularyId: {
						userId,
						vocabularyId: vocabulary.id
					}
				},
				update: {},  // Don't overwrite if already exists
				create: {
					userId,
					vocabularyId: vocabulary.id,
					srsState: 'LEARNING',
					eloRating: startingElo
				}
			});
			vocabSeeded++;
		}

		// 3. Seed starter grammar as LEARNING
		let grammarSeeded = 0;

		for (const title of BEGINNER_GRAMMAR_TITLES) {
			const grammarRule = await prisma.grammarRule.findFirst({
				where: { title, languageId }
			});

			if (!grammarRule) continue;

			await prisma.userGrammarRule.upsert({
				where: {
					userId_grammarRuleId: {
						userId,
						grammarRuleId: grammarRule.id
					}
				},
				update: {},  // Don't overwrite if already exists
				create: {
					userId,
					grammarRuleId: grammarRule.id,
					srsState: 'LEARNING',
					eloRating: startingElo
				}
			});
			grammarSeeded++;
		}

		console.log(`[Beginner Onboarding] User ${userId}: seeded ${vocabSeeded} vocab, ${grammarSeeded} grammar as LEARNING at Elo ${startingElo}`);

		return json({
			success: true,
			level: 'A1',
			vocabSeeded,
			grammarSeeded,
			message: 'Welcome! We\'ve set you up as a complete beginner. Your lessons will start with the very basics — greetings, pronouns, and simple sentences. Let\'s begin your language journey!'
		});
	} catch (error: any) {
		console.error('Error in beginner onboarding API:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
