import { json } from '@sveltejs/kit';
import { SrsState } from '@prisma/client';
import { prisma } from '$lib/server/prisma';
import { generateChatCompletion } from '$lib/server/llm';

export type GameMode = 'en-to-de' | 'de-to-en' | 'fill-blank' | 'multiple-choice';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json().catch(() => ({}));
		const gameMode: GameMode = body.gameMode || 'en-to-de';
		const userId = locals.user.id;

		const cefrLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
		const userLevelIndex = cefrLevels.indexOf(locals.user.cefrLevel || 'A1');
		const allowedLevels = cefrLevels.slice(0, userLevelIndex + 1);

		// Target a larger pool (10-15 words) so the LLM has choices for thematic coherence
		const targetLearningCount = Math.min(15, Math.max(10, 5 + userLevelIndex * 2));

		const now = new Date();

		// 1 & 2 & 3. Fetch Mastered and Learning Vocabulary and Grammar concurrently
		// Fetch a larger pool, then we will shuffle and select a subset
		let [masteredVocabDb, learningVocabDb, masteredGrammarDb, allMasteredGrammarIdsQuery] = await Promise.all([
			prisma.userVocabulary.findMany({
				where: { 
					userId, 
					srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] },
					OR: [
						{ nextReviewDate: null },
						{ nextReviewDate: { lte: now } }
					],
					vocabulary: {
						meaning: { not: null }
					}
				},
				include: { vocabulary: true },
				take: 100
			}),
			prisma.userVocabulary.findMany({
				where: { 
					userId, 
					srsState: { in: [SrsState.UNSEEN, SrsState.LEARNING] },
					OR: [
						{ nextReviewDate: null },
						{ nextReviewDate: { lte: now } }
					],
					vocabulary: {
						meaning: { not: null }
					}
				},
				include: { vocabulary: true },
				take: 100
			}),
			prisma.userGrammarRule.findMany({
				where: { 
					userId, 
					srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] },
					OR: [
						{ nextReviewDate: null },
						{ nextReviewDate: { lte: now } }
					]
				},
				include: { grammarRule: true },
				take: 5
			}),
			prisma.userGrammarRule.findMany({
				where: {
					userId,
					srsState: { in: [SrsState.KNOWN, SrsState.MASTERED] }
				},
				select: { grammarRuleId: true }
			})
		]);

		const masteredGrammarIds = new Set(allMasteredGrammarIdsQuery.map(g => g.grammarRuleId));

		let learningGrammarDbQuery = await prisma.userGrammarRule.findMany({
			where: { 
				userId, 
				srsState: { in: [SrsState.UNSEEN, SrsState.LEARNING] },
				OR: [
					{ nextReviewDate: null },
					{ nextReviewDate: { lte: now } }
				],
				grammarRule: {
					level: { in: allowedLevels }
				}
			},
			include: { 
				grammarRule: {
					include: { dependencies: { select: { id: true } } }
				} 
			}
		});

		let learningGrammarDb = learningGrammarDbQuery.filter(ug => {
			return ug.grammarRule.dependencies.every(dep => masteredGrammarIds.has(dep.id));
		}).slice(0, 1);

		// Shuffle and take a random subset of words for the prompt to ensure diversity
		masteredVocabDb = masteredVocabDb.sort(() => 0.5 - Math.random()).slice(0, 10);
		learningVocabDb = learningVocabDb.sort(() => 0.5 - Math.random()).slice(0, targetLearningCount);

		// Always try to inject 1-2 new random words to keep the user learning
		const knownVocabIds = await prisma.userVocabulary.findMany({
			where: { userId },
			select: { vocabularyId: true }
		});
		
		const knownIdsArray = knownVocabIds.map(v => v.vocabularyId);
		
		// To get random unseen words, we can't easily order by random in standard Prisma findMany without fetching all.
		// A fast approximation is getting a random offset using count.
		const unseenCount = await prisma.vocabulary.count({
			where: { 
				id: { notIn: knownIdsArray },
				meaning: { not: null }
			}
		});

		if (unseenCount > 0 && learningVocabDb.length < targetLearningCount) {
			const needed = targetLearningCount - learningVocabDb.length;
			const randomSkip = Math.max(0, Math.floor(Math.random() * unseenCount) - needed);
			const unseenVocabs = await prisma.vocabulary.findMany({
				where: { 
					id: { notIn: knownIdsArray },
					meaning: { not: null }
				},
				skip: randomSkip,
				take: needed
			});
			
			// Push these directly into learning list so they get taught
			for (const uv of unseenVocabs) {
				// @ts-expect-error type inference
				learningVocabDb.push({ vocabulary: uv });
			}
		}

		// Fallback for new users: if no UserVocabulary exists, pick random Vocabulary
		if (masteredVocabDb.length === 0 && learningVocabDb.length === 0) {
			const allVocabs = await prisma.vocabulary.findMany({
				where: { meaning: { not: null } },
				take: 22
			});
			// @ts-expect-error type inference
			masteredVocabDb = allVocabs.slice(0, 20).map(v => ({ vocabulary: v }));
			// @ts-expect-error type inference
			learningVocabDb = allVocabs.slice(20, 22).map(v => ({ vocabulary: v }));
		}

		// If we still have no learning vocabulary, pick some unseen ones from the global list
		if (learningVocabDb.length === 0) {
			const knownVocabIds = await prisma.userVocabulary.findMany({
				where: { userId },
				select: { vocabularyId: true }
			});
			const unseenVocabs = await prisma.vocabulary.findMany({
				where: { 
					id: { notIn: knownVocabIds.map(v => v.vocabularyId) },
					meaning: { not: null }
				},
				take: 2
			});
			// @ts-expect-error type inference
			learningVocabDb = unseenVocabs.map(v => ({ vocabulary: v }));
		}

		// 3. Same for Grammar
		if (masteredGrammarDb.length === 0 && learningGrammarDb.length === 0) {
			const potentialNewGrammars = await prisma.grammarRule.findMany({ 
				where: { level: { in: allowedLevels } },
				include: { dependencies: { select: { id: true } } },
				take: 20
			});
			const eligibleGrammars = potentialNewGrammars.filter(rule => 
				rule.dependencies.every(dep => masteredGrammarIds.has(dep.id))
			);
			if (eligibleGrammars.length > 0) {
				// @ts-expect-error type inference
				masteredGrammarDb = eligibleGrammars.slice(0, Math.min(5, eligibleGrammars.length - 1)).map(g => ({ grammarRule: g }));
				if (eligibleGrammars.length > 5) {
					// @ts-expect-error type inference
					learningGrammarDb = eligibleGrammars.slice(5, 6).map(g => ({ grammarRule: g }));
				} else if (eligibleGrammars.length > 1) {
					// @ts-expect-error type inference
					learningGrammarDb = eligibleGrammars.slice(-1).map(g => ({ grammarRule: g }));
				}
			}
		}

		// If we still have no learning grammar, pick some unseen ones from the global list
		if (learningGrammarDb.length === 0) {
			const knownGrammarIds = await prisma.userGrammarRule.findMany({
				where: { userId },
				select: { grammarRuleId: true }
			});
			const knownIdsSet = new Set(knownGrammarIds.map(g => g.grammarRuleId));

			const potentialNewGrammars = await prisma.grammarRule.findMany({
				where: { 
					id: { notIn: Array.from(knownIdsSet) },
					level: { in: allowedLevels }
				},
				include: { dependencies: { select: { id: true } } },
				take: 20
			});
			
			const eligibleGrammars = potentialNewGrammars.filter(rule => 
				rule.dependencies.every(dep => masteredGrammarIds.has(dep.id))
			);

			if (eligibleGrammars.length > 0) {
				// @ts-expect-error type inference
				learningGrammarDb = [ { grammarRule: eligibleGrammars[0] } ];
			}
		}

		const masteredVocab = masteredVocabDb.map(uv => uv.vocabulary);
		const learningVocab = learningVocabDb.map(uv => uv.vocabulary);
		const masteredGrammar = masteredGrammarDb.map(ug => ug.grammarRule);
		const learningGrammar = learningGrammarDb.map(ug => ug.grammarRule);

		// Build short ID maps for LLM (saves tokens & prevents UUID garbling)
		const idMap: Record<string, string> = {}; // short -> real UUID
		learningVocab.forEach((v, i) => { idMap[`v${i}`] = v.id; });
		learningGrammar.forEach((g, i) => { idMap[`g${i}`] = g.id; });

		// Format for prompt
		const formatVocab = (v: { lemma: string, meaning: string | null, gender?: string | null, plural?: string | null }) => `- ${v.gender ? v.gender + ' ' : ''}${v.lemma}${v.plural ? ' (pl: ' + v.plural + ')' : ''} (${v.meaning})`;
		const masteredVocabList = masteredVocab.map(v => formatVocab(v as unknown as Parameters<typeof formatVocab>[0])).join('\n');
		const learningVocabList = learningVocab.map((v, i) => `${formatVocab(v as unknown as Parameters<typeof formatVocab>[0])} - ID: v${i}`).join('\n');
		const masteredGrammarList = masteredGrammar.map(g => `- ${g.title} (${g.description})`).join('\n');
		const learningGrammarList = learningGrammar.map((g, i) => `- ${g.title} (${g.description}) - ID: g${i}`).join('\n');

		const userLevel = locals.user.cefrLevel || 'A1';
		const isBeginner = userLevel === 'A1' || userLevel === 'A2';
		const isAbsoluteBeginner = userLevel === 'A1' && masteredVocabDb.length <= 5;

		const sentenceConstraint = isAbsoluteBeginner
			? `Generate EXACTLY ONE very simple German sentence (3-6 words, no run-ons) suitable for someone who is just starting to learn German. Use only basic vocabulary like greetings, pronouns, simple verbs (sein, haben, heißen, kommen), and common nouns. Keep it extremely simple.`
			: isBeginner
			? `Generate EXACTLY ONE simple, natural German sentence (no run-ons/semi-colons) as a challenge.`
			: `Generate a natural German challenge (complex sentence or exactly 2 STRICTLY related, narrative sentences forming a micro-story) suitable for ${userLevel}.`;

		// Build mode-specific prompt parts
		let modeInstruction: string;
		let vocabTagInstruction: string;
		let jsonFormatBlock: string;
		let jsonSchemaObj: Record<string, unknown>;

		if (gameMode === 'fill-blank') {
			modeInstruction = `This is a FILL IN THE BLANK exercise. Generate a German sentence, then create the "challengeText" by replacing targeted vocabulary words with blanks "___". The "targetSentence" must be the complete German sentence with no blanks. Provide a "hints" array with one object per blank: each has the "vocabId" and a "hint" string (the English meaning of the missing word).`;
			vocabTagInstruction = `Do NOT use <vocab> tags. Instead, replace targeted words with "___" in challengeText. The targetSentence has the full correct German sentence.`;
			jsonFormatBlock = `JSON format:
{
  "challengeText": "<German sentence with ___ for blanked words>",
  "targetSentence": "<Complete German sentence>",
  "hints": [{ "vocabId": "<id>", "hint": "<English meaning>" }],
  "targetedVocabularyIds": ["<id1>"],
  "targetedGrammarIds": ["<id1>"]
}`;
			jsonSchemaObj = {
				type: "object",
				properties: {
					challengeText: { type: "string", description: "German sentence with ___ blanks" },
					targetSentence: { type: "string", description: "Complete German sentence" },
					hints: {
						type: "array",
						items: {
							type: "object",
							properties: {
								vocabId: { type: "string" },
								hint: { type: "string" }
							},
							required: ["vocabId", "hint"],
							additionalProperties: false
						},
						description: "Hints for each blank"
					},
					targetedVocabularyIds: { type: "array", items: { type: "string" } },
					targetedGrammarIds: { type: "array", items: { type: "string" } }
				},
				required: ["challengeText", "targetSentence", "hints", "targetedVocabularyIds", "targetedGrammarIds"],
				additionalProperties: false
			};
		} else if (gameMode === 'multiple-choice') {
			modeInstruction = `This is a MULTIPLE CHOICE exercise. Generate a German sentence as "challengeText". Provide the correct English translation as "targetSentence". Also provide exactly 3 plausible but INCORRECT English translations as "distractors". The distractors should be similar enough to be challenging but clearly wrong.`;
			vocabTagInstruction = `CRITICAL: In the "challengeText" (which is German), you MUST wrap the German lemma form of targeted vocabulary words in a <vocab id="VOCAB_ID">...</vocab> tag. For example, if targeting vocabulary ID "123" with lemma "Hund", write: "Der <vocab id="123">Hund</vocab> bellt."`;
			jsonFormatBlock = `JSON format:
{
  "challengeText": "<German sentence with vocab tags>",
  "targetSentence": "<Correct English translation>",
  "distractors": ["<wrong1>", "<wrong2>", "<wrong3>"],
  "targetedVocabularyIds": ["<id1>"],
  "targetedGrammarIds": ["<id1>"]
}`;
			jsonSchemaObj = {
				type: "object",
				properties: {
					challengeText: { type: "string", description: "German sentence to translate" },
					targetSentence: { type: "string", description: "Correct English translation" },
					distractors: {
						type: "array",
						items: { type: "string" },
						description: "3 plausible but incorrect English translations"
					},
					targetedVocabularyIds: { type: "array", items: { type: "string" } },
					targetedGrammarIds: { type: "array", items: { type: "string" } }
				},
				required: ["challengeText", "targetSentence", "distractors", "targetedVocabularyIds", "targetedGrammarIds"],
				additionalProperties: false
			};
		} else if (gameMode === 'de-to-en') {
			modeInstruction = `User translates FROM German TO English ("challengeText"=German, "targetSentence"=English).`;
			vocabTagInstruction = `CRITICAL: In the "challengeText" (which is German), you MUST wrap the German lemma form of targeted vocabulary words in a <vocab id="VOCAB_ID">...</vocab> tag. For example, if targeting vocabulary ID "123" with lemma "Hund", write: "Der <vocab id="123">Hund</vocab> bellt."`;
			jsonFormatBlock = `JSON format:
{
  "challengeText": "<German text>",
  "targetSentence": "<English translation>",
  "targetedVocabularyIds": ["<id1>", "<id2>"],
  "targetedGrammarIds": ["<id1>"]
}`;
			jsonSchemaObj = {
				type: "object",
				properties: {
					challengeText: { type: "string", description: "The German text to translate" },
					targetSentence: { type: "string", description: "The English translation" },
					targetedVocabularyIds: { type: "array", items: { type: "string" } },
					targetedGrammarIds: { type: "array", items: { type: "string" } }
				},
				required: ["challengeText", "targetSentence", "targetedVocabularyIds", "targetedGrammarIds"],
				additionalProperties: false
			};
		} else {
			// en-to-de (default)
			modeInstruction = `User translates FROM English TO German ("challengeText"=English, "targetSentence"=German).`;
			vocabTagInstruction = `CRITICAL: In the "challengeText" (which is English), you MUST use the ENGLISH meaning of the targeted vocabulary word and wrap it in a <vocab id="VOCAB_ID">...</vocab> tag. For example, if targeting vocabulary ID "123" with lemma "Hund" and meaning "dog", write: "The <vocab id="123">dog</vocab> is barking." Do NOT put German words in the English challengeText.`;
			jsonFormatBlock = `JSON format:
{
  "challengeText": "<English text>",
  "targetSentence": "<German translation>",
  "targetedVocabularyIds": ["<id1>", "<id2>"],
  "targetedGrammarIds": ["<id1>"]
}`;
			jsonSchemaObj = {
				type: "object",
				properties: {
					challengeText: { type: "string", description: "The English text to translate" },
					targetSentence: { type: "string", description: "The German translation" },
					targetedVocabularyIds: { type: "array", items: { type: "string" } },
					targetedGrammarIds: { type: "array", items: { type: "string" } }
				},
				required: ["challengeText", "targetSentence", "targetedVocabularyIds", "targetedGrammarIds"],
				additionalProperties: false
			};
		}

		// 4. Construct System Prompt
		const beginnerGuidance = isAbsoluteBeginner
			? `\nABSOLUTE BEGINNER MODE: This student is just starting to learn German. They may know almost nothing.
- Use extremely simple vocabulary (greetings, personal pronouns, basic verbs like sein/haben/heißen)
- Sentences should be 3-6 words maximum
- For en-to-de mode: use simple English sentences like "I am a man", "The child is small", "I have a book"
- For de-to-en mode: use simple German like "Ich bin gut", "Das Kind ist klein"
- For fill-blank: blank only ONE very basic word
- For multiple-choice: make distractors clearly different from the correct answer
- Focus on building confidence — correctness over complexity\n`
			: '';

		const systemPrompt = `Act as an expert German tutor for a ${userLevel} student. Output ONLY strictly valid JSON, no markdown or extra text.
${beginnerGuidance}

${sentenceConstraint}
Compose the German text focusing on the "Mastered" and "Learning" vocabulary provided below. You are ALLOWED to use other natural German vocabulary appropriate for a ${userLevel} student, even if it is not in the provided lists. However, you MUST ABSOLUTELY AVOID using any custom or user-provided words that are not explicitly present in the provided vocabulary lists below. If you think the user might have learned a specific obscure word elsewhere but it is not in these lists, do not use it.
CRITICAL THEMATIC INJECTION: The "Learning Concepts" list below is a POOL of words. You MUST choose ONE word from it to establish a central theme. Then, try to incorporate other words from the Learning list ONLY if they fit naturally within that theme.
CRITICAL QUALITY INSTRUCTION: Prioritize sentence quality, natural flow, and logic over using every single word provided in the lists. Do NOT try to force or jam words together if they don't make sense. You DO NOT have to use all the words provided, just pick the ones that fit naturally and make logical sense.
${modeInstruction}

${vocabTagInstruction}

Mastered Vocab:
${masteredVocabList || "Basic"}

Mastered Grammar:
${masteredGrammarList || "Basic"}

Learning Concepts (USE WHAT FITS NATURALLY):
Vocab:
${learningVocabList || "None"}
Grammar:
${learningGrammarList || "None"}

${jsonFormatBlock}`;

		// 5. Call LLM
		const llmResponse = await generateChatCompletion({
			userId,
			messages: [{ role: 'user', content: 'Generate the next challenge based on my current level.' }],
			systemPrompt,
			jsonSchema: jsonSchemaObj,
			stream: true,
			signal: request.signal
		});

		// Calculate targeted concepts beforehand, assuming LLM will use all of them if fallback is needed.
		// Since we're streaming, we send the full learning lists as the targeted concepts immediately.
		// The client could filter them at the end based on targetedIds, but sending them all is safe 
		// because we only gave it 1-2 learning concepts anyway.
		const targetedVocabulary = learningVocab;
		const targetedGrammar = learningGrammar;

		let upstreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

		const stream = new ReadableStream({
			async start(controller) {
				// Send metadata first
				controller.enqueue(
					new TextEncoder().encode(
						JSON.stringify({
							type: 'metadata',
							data: {
								userId,
								targetedVocabulary,
								targetedGrammar,
								allVocabulary: [...masteredVocab, ...learningVocab],
								gameMode,
								idMap,
								userLevel,
								isAbsoluteBeginner
							}
						}) + '\n'
					)
				);

				const reader = llmResponse.body?.getReader();
				if (!reader) {
					controller.close();
					return;
				}

				// Store reader reference for cancel handler
				upstreamReader = reader;

				const decoder = new TextDecoder();
				let buffer = '';
				let fullContent = '';
				
				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;
						
						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split('\n');
						buffer = lines.pop() || '';

						for (const line of lines) {
							const trimmedLine = line.trim();
							if (trimmedLine.startsWith('data: ') && trimmedLine !== 'data: [DONE]') {
								try {
									const data = JSON.parse(trimmedLine.slice(6));
									const content = data.choices[0]?.delta?.content || '';
									if (content) {
										fullContent += content;
										controller.enqueue(
											new TextEncoder().encode(
												JSON.stringify({ type: 'chunk', content }) + '\n'
											)
										);
									}
								} catch {
									// ignore partial JSON parse errors
								}
							}
						}
					}
					
					if (buffer.trim().startsWith('data: ') && buffer.trim() !== 'data: [DONE]') {
						try {
							const data = JSON.parse(buffer.trim().slice(6));
							const content = data.choices[0]?.delta?.content || '';
							if (content) {
								fullContent += content;
								controller.enqueue(
									new TextEncoder().encode(
										JSON.stringify({ type: 'chunk', content }) + '\n'
									)
								);
							}
						} catch {
							// ignore parse errors
						}
					}

					// Vocab enrichment: look up words from generated text in the full Vocabulary table
					try {
						let cleaned = fullContent;
						const firstBrace = cleaned.indexOf('{');
						const lastBrace = cleaned.lastIndexOf('}');
						if (firstBrace !== -1 && lastBrace !== -1) {
							cleaned = cleaned.slice(firstBrace, lastBrace + 1);
						}
						const parsedResponse = JSON.parse(cleaned);

						// Extract all text that may contain German words
						const allText = [
							parsedResponse.challengeText || '',
							parsedResponse.targetSentence || ''
						].join(' ');

						const rawWords = allText
							.replace(/<[^>]+>/g, '')
							.split(/\s+/)
							.map((w: string) => w.replace(/[.,!?;:'"|()/[\]{}\-\u2014\u2013]/g, '').trim())
							.filter((w: string) => w.length > 0);

						const existingIds = new Set(
							[...masteredVocab, ...learningVocab].map(v => v.id)
						);

						const candidates = new Set<string>();
						for (const word of rawWords) {
							const lower = word.toLowerCase();
							candidates.add(lower);
							candidates.add(lower.charAt(0).toUpperCase() + lower.slice(1));

							// Basic German stemming: strip inflectional suffixes
							const suffixes = ['ung', 'te', 'ten', 'tet', 'test', 'en', 'er', 'es', 'em', 'et', 'st', 'e', 't', 'n', 's'];
							for (const suffix of suffixes) {
								if (lower.length > suffix.length + 2 && lower.endsWith(suffix)) {
									const stem = lower.slice(0, -suffix.length);
									candidates.add(stem);
									candidates.add(stem.charAt(0).toUpperCase() + stem.slice(1));
									if (suffix !== 'en') {
										candidates.add(stem + 'en');
										candidates.add((stem + 'en').charAt(0).toUpperCase() + (stem + 'en').slice(1));
									}
								}
							}

							// Past participle: ge-...-t or ge-...-en
							if (lower.startsWith('ge') && lower.length > 4) {
								const rest = lower.slice(2);
								candidates.add(rest);
								candidates.add(rest.charAt(0).toUpperCase() + rest.slice(1));
								if (rest.endsWith('t') && rest.length > 2) {
									const pStem = rest.slice(0, -1);
									candidates.add(pStem + 'en');
									candidates.add((pStem + 'en').charAt(0).toUpperCase() + (pStem + 'en').slice(1));
								}
								if (rest.endsWith('en') && rest.length > 3) {
									candidates.add(rest);
									candidates.add(rest.charAt(0).toUpperCase() + rest.slice(1));
								}
							}

							// zu-infinitive: aufzugeben → aufgeben
							const zuMatch = lower.match(/^(.+?)zu(.+)$/);
							if (zuMatch && zuMatch[1].length >= 2 && zuMatch[2].length >= 2) {
								const combined = zuMatch[1] + zuMatch[2];
								candidates.add(combined);
								candidates.add(combined.charAt(0).toUpperCase() + combined.slice(1));
							}
						}

						if (candidates.size > 0) {
							const enrichmentVocab = await prisma.vocabulary.findMany({
								where: {
									lemma: { in: Array.from(candidates) },
									id: { notIn: Array.from(existingIds) }
								}
							});

							if (enrichmentVocab.length > 0) {
								controller.enqueue(
									new TextEncoder().encode(
										JSON.stringify({
											type: 'vocab_enrichment',
											data: enrichmentVocab
										}) + '\n'
									)
								);
							}
						}
					} catch (enrichErr) {
						console.error('Vocab enrichment failed:', enrichErr);
					}
					
					controller.close();
				} catch (e) {
					controller.error(e);
				}
			},
			cancel() {
				// Client disconnected — cancel upstream LLM reader
				upstreamReader?.cancel();
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'application/x-ndjson',
				'Cache-Control': 'no-cache'
			}
		});
	} catch (error) {
		console.error('Error generating lesson:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
}
