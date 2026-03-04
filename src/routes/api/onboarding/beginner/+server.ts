import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

/**
 * Absolute beginner onboarding endpoint.
 * Seeds the user's account with essential A1 starter vocabulary and grammar as LEARNING,
 * so the lesson generator immediately has material to teach them from scratch.
 */

// Essential starter words for someone with zero German knowledge
const BEGINNER_VOCAB_LEMMAS = [
	// Greetings & basics
	'hallo', 'ja', 'nein', 'danke', 'bitte',
	// Core pronouns
	'ich', 'du', 'er', 'sie', 'es', 'wir',
	// Articles
	'der', 'die', 'das', 'ein', 'eine',
	// Essential verbs
	'sein', 'haben', 'heißen', 'kommen', 'sprechen', 'wohnen', 'machen', 'gehen',
	// Essential nouns
	'Mann', 'Frau', 'Kind', 'Haus', 'Wasser', 'Buch', 'Tag', 'Name',
	// Essential adjectives
	'gut', 'groß', 'klein', 'neu', 'alt',
	// Basic adverbs/particles
	'nicht', 'auch', 'hier', 'sehr',
	// Numbers
	'eins', 'zwei', 'drei',
	// Question words
	'was', 'wer', 'wo', 'wie', 'warum',
];

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

	try {
		// 1. Set user level to A1
		await prisma.user.update({
			where: { id: userId },
			data: { hasOnboarded: true, cefrLevel: 'A1' }
		});

		// 2. Seed starter vocabulary as LEARNING
		const startingElo = 1000; // A1 base Elo
		let vocabSeeded = 0;

		for (const lemma of BEGINNER_VOCAB_LEMMAS) {
			const vocabulary = await prisma.vocabulary.findFirst({
				where: { lemma: { equals: lemma, mode: 'insensitive' } }
			});

			if (!vocabulary) continue;

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
				where: { title }
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
			message: 'Welcome! We\'ve set you up as a complete beginner. Your lessons will start with the very basics — greetings, pronouns, and simple sentences. Let\'s begin your German journey!'
		});
	} catch (error: any) {
		console.error('Error in beginner onboarding API:', error);
		return json({ error: error.message }, { status: 500 });
	}
}
