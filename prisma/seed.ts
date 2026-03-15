import { PrismaClient } from '@prisma/client';
import { PrismaPg } from '@prisma/adapter-pg';
import pg from 'pg';
import 'dotenv/config';
import { getFrequencyRank, estimateFrequencyRank } from '../src/lib/frequency/index.ts';

const connectionString = process.env.DATABASE_URL;

const pool = new pg.Pool({ connectionString });
const adapter = new PrismaPg(pool);

const prisma = new PrismaClient({ adapter });

import { verbs as deVerbs } from './german_vocab/verbs';
import { nouns as deNouns } from './german_vocab/nouns';
import { adverbs as deAdverbs } from './german_vocab/adverbs';
import { adjectives as deAdjectives } from './german_vocab/adjectives';
import { conjunctions as deConjunctions } from './german_vocab/conjunctions';
import { prepositions as dePrepositions } from './german_vocab/prepositions';
import { pronouns as dePronouns } from './german_vocab/pronouns';
import { particles as deParticles } from './german_vocab/particles';
import { interjections as deInterjections } from './german_vocab/interjections';
import { articles as deArticles } from './german_vocab/articles';

import { verbs as esVerbs } from './spanish_vocab/verbs';
import { nouns as esNouns } from './spanish_vocab/nouns';
import { adverbs as esAdverbs } from './spanish_vocab/adverbs';
import { adjectives as esAdjectives } from './spanish_vocab/adjectives';
import { conjunctions as esConjunctions } from './spanish_vocab/conjunctions';
import { prepositions as esPrepositions } from './spanish_vocab/prepositions';
import { pronouns as esPronouns } from './spanish_vocab/pronouns';
import { particles as esParticles } from './spanish_vocab/particles';
import { interjections as esInterjections } from './spanish_vocab/interjections';
import { articles as esArticles } from './spanish_vocab/articles';

import { verbs as frVerbs } from './french_vocab/verbs';
import { nouns as frNouns } from './french_vocab/nouns';
import { adverbs as frAdverbs } from './french_vocab/adverbs';
import { adjectives as frAdjectives } from './french_vocab/adjectives';
import { conjunctions as frConjunctions } from './french_vocab/conjunctions';
import { prepositions as frPrepositions } from './french_vocab/prepositions';
import { pronouns as frPronouns } from './french_vocab/pronouns';
import { particles as frParticles } from './french_vocab/particles';
import { interjections as frInterjections } from './french_vocab/interjections';
import { articles as frArticles } from './french_vocab/articles';
import { frenchGrammarRules } from './french_vocab/grammar';
import { germanGrammarRules } from './german_vocab/grammar';
import { spanishGrammarRules } from './spanish_vocab/grammar';

const germanVocabulary = [
	...deArticles,
	...deVerbs,
	...deNouns,
	...deAdverbs,
	...deAdjectives,
	...deConjunctions,
	...dePrepositions,
	...dePronouns,
	...deParticles,
	...deInterjections
];

const spanishVocabulary = [
	...esArticles,
	...esVerbs,
	...esNouns,
	...esAdverbs,
	...esAdjectives,
	...esConjunctions,
	...esPrepositions,
	...esPronouns,
	...esParticles,
	...esInterjections
];

const frenchVocabulary = [
	...frArticles,
	...frVerbs,
	...frNouns,
	...frAdverbs,
	...frAdjectives,
	...frConjunctions,
	...frPrepositions,
	...frPronouns,
	...frParticles,
	...frInterjections
];

export async function runSeed(client: PrismaClient = prisma, override: boolean = false) {
	// 1. Check if we need to seed
	const count = await client.vocabulary.count();
	if (count > 0 && !override) {
		console.log('Database already seeded. Skipping...');
		return;
	}

	console.log('Start seeding...');

	// 1.5 Create Languages
	console.log('Creating languages...');
	const german = await client.language.upsert({
		where: { code: 'de' },
		update: {},
		create: { code: 'de', name: 'German', flag: '🇩🇪' }
	});

	const spanish = await client.language.upsert({
		where: { code: 'es' },
		update: {},
		create: { code: 'es', name: 'Spanish', flag: '🇪🇸' }
	});

	const french = await client.language.upsert({
		where: { code: 'fr' },
		update: {},
		create: { code: 'fr', name: 'French', flag: '🇫🇷' }
	});

	// 2. Insert Vocabulary
	console.log('Seeding vocabulary...');
	for (const vocab of germanVocabulary) {
		let gender: any = (vocab as any).gender;
		if (gender === 'der') gender = 'MASCULINE';
		else if (gender === 'die') gender = 'FEMININE';
		else if (gender === 'das') gender = 'NEUTER';

		const existing = await client.vocabulary.findFirst({
			where: { lemma: vocab.lemma, languageId: german.id }
		});

		const { meaning, partOfSpeech, ...vocabData } = vocab as any;
		const frequency = getFrequencyRank(vocab.lemma, 'German') ?? estimateFrequencyRank(vocab.lemma);

		if (existing) {
			await client.vocabulary.update({
				where: { id: existing.id },
				data: {
					...vocabData,
					gender,
					partOfSpeech,
					frequency,
					meanings: {
						create: meaning ? [{ value: meaning, partOfSpeech }] : []
					}
				}
			});
		} else {
			await client.vocabulary.create({
				data: {
					...vocabData,
					gender,
					partOfSpeech,
					frequency,
					languageId: german.id,
					meanings: {
						create: meaning ? [{ value: meaning, partOfSpeech }] : []
					}
				}
			});
		}
	}
	console.log(`Seeded ${germanVocabulary.length} vocabulary words for German.`);

	console.log('Seeding Spanish vocabulary...');
	for (const vocab of spanishVocabulary) {
		// eslint-disable-next-line prefer-const
		let gender: any = (vocab as any).gender;

		const existing = await client.vocabulary.findFirst({
			where: { lemma: vocab.lemma, languageId: spanish.id }
		});

		const { meaning, partOfSpeech, ...vocabData } = vocab as any;
		const frequency =
			getFrequencyRank(vocab.lemma, 'Spanish') ?? estimateFrequencyRank(vocab.lemma);

		if (existing) {
			await client.vocabulary.update({
				where: { id: existing.id },
				data: {
					...vocabData,
					gender,
					partOfSpeech,
					frequency,
					meanings: {
						create: meaning ? [{ value: meaning, partOfSpeech }] : []
					}
				}
			});
		} else {
			await client.vocabulary.create({
				data: {
					...vocabData,
					gender,
					partOfSpeech,
					frequency,
					languageId: spanish.id,
					meanings: {
						create: meaning ? [{ value: meaning, partOfSpeech }] : []
					}
				}
			});
		}
	}
	console.log(`Seeded ${spanishVocabulary.length} vocabulary words for Spanish.`);

	console.log('Seeding French vocabulary...');
	for (const vocab of frenchVocabulary) {
		// eslint-disable-next-line prefer-const
		let gender: any = (vocab as any).gender;
		const lemma = (vocab as any).word;

		const existing = await client.vocabulary.findFirst({
			where: { lemma, languageId: french.id }
		});

		const frequency = getFrequencyRank(lemma, 'French') ?? estimateFrequencyRank(lemma);

		if (existing) {
			await client.vocabulary.update({
				where: { id: existing.id },
				data: {
					lemma,
					isBeginner: (vocab as any).isBeginner,
					gender,
					frequency,
					meanings: {
						create: (vocab as any).translation ? [{ value: (vocab as any).translation }] : []
					}
				}
			});
		} else {
			await client.vocabulary.create({
				data: {
					lemma,
					isBeginner: (vocab as any).isBeginner,
					gender,
					frequency,
					languageId: french.id,
					meanings: {
						create: (vocab as any).translation ? [{ value: (vocab as any).translation }] : []
					}
				}
			});
		}
	}
	console.log(`Seeded ${frenchVocabulary.length} vocabulary words for French.`);

	// 3. Insert Grammar Rules (First Pass: Create without dependencies)
	console.log('Seeding grammar rules (First Pass)...');
	for (const rule of germanGrammarRules) {
		const existing = await client.grammarRule.findFirst({
			where: { title: rule.title, languageId: german.id }
		});
		if (existing) {
			await client.grammarRule.update({
				where: { id: existing.id },
				data: {
					description: rule.description,
					guide: rule.guide,
					level: rule.level,
					ruleType: rule.ruleType ?? null,
					targetForms: rule.targetForms ?? []
				}
			});
		} else {
			await client.grammarRule.create({
				data: {
					title: rule.title,
					description: rule.description,
					guide: rule.guide,
					level: rule.level,
					ruleType: rule.ruleType ?? null,
					targetForms: rule.targetForms ?? [],
					languageId: german.id
				}
			});
		}
	}

	for (const rule of spanishGrammarRules) {
		const existing = await client.grammarRule.findFirst({
			where: { title: rule.title, languageId: spanish.id }
		});
		if (existing) {
			await client.grammarRule.update({
				where: { id: existing.id },
				data: {
					description: rule.description,
					guide: rule.guide,
					level: rule.level,
					ruleType: rule.ruleType ?? null,
					targetForms: rule.targetForms ?? []
				}
			});
		} else {
			await client.grammarRule.create({
				data: {
					title: rule.title,
					description: rule.description,
					guide: rule.guide,
					level: rule.level,
					ruleType: rule.ruleType ?? null,
					targetForms: rule.targetForms ?? [],
					languageId: spanish.id
				}
			});
		}
	}

	for (const rule of frenchGrammarRules) {
		const existing = await client.grammarRule.findFirst({
			where: { title: rule.name, languageId: french.id }
		});
		const level = rule.difficulty === 1 ? 'A1' : rule.difficulty === 2 ? 'A2' : 'B1';
		if (existing) {
			await client.grammarRule.update({
				where: { id: existing.id },
				data: {
					description: rule.description,
					guide: rule.description,
					level,
					ruleType: rule.ruleType ?? null,
					targetForms: rule.targetForms ?? []
				}
			});
		} else {
			await client.grammarRule.create({
				data: {
					title: rule.name,
					description: rule.description,
					guide: rule.description,
					level,
					ruleType: rule.ruleType ?? null,
					targetForms: rule.targetForms ?? [],
					languageId: french.id
				}
			});
		}
	}

	console.log(
		`Seeded ${germanGrammarRules.length} German grammar rules, ${spanishGrammarRules.length} Spanish grammar rules, and ${frenchGrammarRules.length} French grammar rules.`
	);

	// 4. Update Grammar Rules (Second Pass: Connect dependencies)
	console.log('Connecting grammar rule dependencies (Second Pass)...');
	for (const rule of germanGrammarRules) {
		if (rule.dependencies && rule.dependencies.length > 0) {
			const parentRules = await client.grammarRule.findMany({
				where: { title: { in: rule.dependencies }, languageId: german.id }
			});

			const currentRule = await client.grammarRule.findFirst({
				where: { title: rule.title, languageId: german.id }
			});

			if (parentRules.length > 0 && currentRule) {
				await client.grammarRule.update({
					where: { id: currentRule.id },
					data: {
						dependencies: {
							connect: parentRules.map((parent) => ({ id: parent.id }))
						}
					}
				});
			}
		}
	}

	for (const rule of spanishGrammarRules) {
		if (rule.dependencies && rule.dependencies.length > 0) {
			const parentRules = await client.grammarRule.findMany({
				where: { title: { in: rule.dependencies }, languageId: spanish.id }
			});

			const currentRule = await client.grammarRule.findFirst({
				where: { title: rule.title, languageId: spanish.id }
			});

			if (parentRules.length > 0 && currentRule) {
				await client.grammarRule.update({
					where: { id: currentRule.id },
					data: {
						dependencies: {
							connect: parentRules.map((parent) => ({ id: parent.id }))
						}
					}
				});
			}
		}
	}

	for (const rule of frenchGrammarRules) {
		if (rule.dependencies && rule.dependencies.length > 0) {
			const parentRules = await client.grammarRule.findMany({
				where: { title: { in: rule.dependencies }, languageId: french.id }
			});

			const currentRule = await client.grammarRule.findFirst({
				where: { title: rule.name, languageId: french.id }
			});

			if (parentRules.length > 0 && currentRule) {
				await client.grammarRule.update({
					where: { id: currentRule.id },
					data: {
						dependencies: {
							connect: parentRules.map((parent) => ({ id: parent.id }))
						}
					}
				});
			}
		}
	}

	console.log('Connected grammar rule dependencies.');

	console.log('Seeding finished.');

	// Apply frequency ranks to all vocabulary
	console.log('Applying frequency ranks...');
	const LANG_NAME_MAP: Record<string, string> = {
		German: 'German',
		Spanish: 'Spanish',
		French: 'French'
	};
	const languages = await client.language.findMany({ select: { id: true, name: true } });
	for (const lang of languages) {
		const freqLang = LANG_NAME_MAP[lang.name];
		if (!freqLang) continue;
		console.log(`  Processing ${lang.name}...`);
		const vocab = await client.vocabulary.findMany({
			where: { languageId: lang.id },
			select: { id: true, lemma: true }
		});
		const BATCH = 500;
		let updated = 0;
		for (let i = 0; i < vocab.length; i += BATCH) {
			const batch = vocab.slice(i, i + BATCH);
			await Promise.all(
				batch.map((v) =>
					client.vocabulary.update({
						where: { id: v.id },
						data: {
							frequency: getFrequencyRank(v.lemma, freqLang) ?? estimateFrequencyRank(v.lemma)
						}
					})
				)
			);
			updated += batch.length;
			process.stdout.write(`\r    Updated ${updated}/${vocab.length}`);
		}
		console.log(`\n    Done.`);
	}
	console.log('Frequency ranks applied.');
}

async function main() {
	await runSeed(prisma);
}

import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);

if (process.argv[1] === new URL(import.meta.url).pathname || process.argv[1] === __filename) {
	main()
		.catch((e) => {
			console.error(e);
			process.exit(1);
		})
		.finally(async () => {
			await prisma.$disconnect();
		});
}
