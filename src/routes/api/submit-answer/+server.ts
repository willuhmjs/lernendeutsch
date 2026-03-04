import { json } from '@sveltejs/kit';
import { buildEvaluationPrompt, parseEvaluationResponse, updateEloRatings } from '$lib/server/grader';
import { generateChatCompletion } from '$lib/server/llm';
import { prisma } from '$lib/server/prisma';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const body = await request.json();
		const { userInput, targetSentence, targetedVocabularyIds, targetedGrammarIds, gameMode: bodyGameMode } = body;
		const userId = locals.user.id;
		const gameMode = bodyGameMode || 'en-to-de';

		if (!userInput || !targetSentence) {
			return json({ error: 'Missing userInput or targetSentence' }, { status: 400 });
		}

		// Fetch the full objects for the targeted IDs, preserving client's order
		const targetedVocabRaw = await prisma.vocabulary.findMany({
			where: { id: { in: targetedVocabularyIds || [] } }
		});
		const targetedVocabulary = (targetedVocabularyIds || [])
			.map((id: string) => targetedVocabRaw.find(v => v.id === id))
			.filter(Boolean);

		const targetedGrammarRaw = await prisma.grammarRule.findMany({
			where: { id: { in: targetedGrammarIds || [] } }
		});
		const targetedGrammar = (targetedGrammarIds || [])
			.map((id: string) => targetedGrammarRaw.find(g => g.id === id))
			.filter(Boolean);

		// Fast-path for multiple choice: no LLM needed
		if (gameMode === 'multiple-choice') {
			const isCorrect = userInput.trim() === targetSentence.trim();
			const score = isCorrect ? 1.0 : 0.0;
			const evaluation = {
				globalScore: score,
				vocabularyUpdates: targetedVocabulary.map((v: { id: string }) => ({ id: v.id, score })),
				grammarUpdates: [],
				extraVocabLemmas: [],
				feedback: isCorrect ? 'Richtig!' : 'Falsch.',
				feedbackEnglish: isCorrect ? 'Correct!' : 'Incorrect.'
			};

			console.log('Sending payload to updateEloRatings:', JSON.stringify(evaluation, null, 2));
			await updateEloRatings(userId, evaluation, gameMode);

			return new Response(JSON.stringify(evaluation), {
				headers: {
					'Content-Type': 'application/json',
					'Cache-Control': 'no-cache'
				}
			});
		}

		// Build prompt and call LLM with streaming
		const userLevel = locals.user.cefrLevel || 'A1';
		const { systemPrompt, userMessage, idMap } = buildEvaluationPrompt(
			userInput,
			targetSentence,
			targetedVocabulary,
			targetedGrammar,
			gameMode,
			userLevel
		);

		const llmResponse = await generateChatCompletion({
			userId,
			messages: [{ role: 'user', content: userMessage }],
			systemPrompt,
			jsonMode: true,
			stream: true,
			signal: request.signal
		});

		let upstreamReader: ReadableStreamDefaultReader<Uint8Array> | null = null;

		const stream = new ReadableStream({
			async start(controller) {
				if (!llmResponse.body) {
					controller.close();
					return;
				}
				const reader = llmResponse.body.getReader();
				upstreamReader = reader;
				const decoder = new TextDecoder();
				let fullContent = '';
				let buffer = '';

				try {
					while (true) {
						const { done, value } = await reader.read();
						if (done) break;

						buffer += decoder.decode(value, { stream: true });
						const lines = buffer.split('\n');
						buffer = lines.pop() || '';

						for (const line of lines) {
							if (line.trim() === '' || line.startsWith(':')) continue;
							if (line.startsWith('data: ')) {
								const dataStr = line.slice(6);
								if (dataStr.trim() === '[DONE]') continue;
								try {
									const data = JSON.parse(dataStr);
									const content = data.choices[0]?.delta?.content;
									if (content) {
										fullContent += content;
										controller.enqueue(new TextEncoder().encode(content));
									}
								} catch {
									// partial SSE parse error
								}
							}
						}
					}
					// Process remaining buffer
					if (buffer) {
						const lines = buffer.split('\n');
						for (const line of lines) {
							if (line.startsWith('data: ')) {
								const dataStr = line.slice(6);
								if (dataStr.trim() !== '[DONE]') {
									try {
										const data = JSON.parse(dataStr);
										const content = data.choices[0]?.delta?.content;
										if (content) {
											fullContent += content;
											controller.enqueue(new TextEncoder().encode(content));
										}
									} catch {
										// partial SSE parse error
									}
								}
							}
						}
					}
				} catch (err) {
					console.error('Stream read error in submit-answer', err);
				}

				controller.close();

				// Background processing: parse response and update Elo/SRS
				try {
					const evaluation = parseEvaluationResponse(fullContent);
					// Remap short IDs (v0, g0, ...) back to real UUIDs
					evaluation.vocabularyUpdates = evaluation.vocabularyUpdates.map(u => ({
						...u,
						id: idMap[u.id] || u.id
					}));
					evaluation.grammarUpdates = evaluation.grammarUpdates.map(u => ({
						...u,
						id: idMap[u.id] || u.id
					}));
					console.log('Sending payload to updateEloRatings:', JSON.stringify(evaluation, null, 2));
					await updateEloRatings(userId, evaluation, gameMode);
				} catch (e) {
					console.error('Post-stream processing error in submit-answer:', e);
				}
			},
			cancel() {
				// Client disconnected — cancel upstream LLM reader
				upstreamReader?.cancel();
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'text/plain; charset=utf-8',
				'Cache-Control': 'no-cache'
			}
		});
	} catch (error) {
		console.error('Error submitting answer:', error);
		const message = error instanceof Error ? error.message : 'Unknown error';
		return json({ error: message }, { status: 500 });
	}
}
