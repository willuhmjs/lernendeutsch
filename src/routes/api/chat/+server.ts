import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { generateChatCompletion, type ChatMessage } from '$lib/server/llm';
import { chatPracticeRateLimiter } from '$lib/server/ratelimit';
import { updateEloRatings } from '$lib/server/grader';

export async function POST(event) {
	// Apply rate limiting
	if (await chatPracticeRateLimiter.isLimited(event)) {
		return json({ error: 'Rate limit exceeded. Please try again later.' }, { status: 429 });
	}

	const session = await event.locals.auth();
	if (!session?.user?.id) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const userId = session.user.id;
	const { sessionId, message, persona, language, assignmentId } = await event.request.json();

	if (!message) {
		return json({ error: 'Message is required' }, { status: 400 });
	}

	const normalizedMessage = message
		.replace(/ß/g, 'ss')
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/Ä/g, 'Ae')
		.replace(/Ö/g, 'Oe')
		.replace(/Ü/g, 'Ue');

	let currentSessionId = sessionId;
	let currentSession;

	// Create a new session if one doesn't exist
	if (!currentSessionId) {
		if (!persona || !language) {
			return json(
				{ error: 'Persona and language are required for a new session' },
				{ status: 400 }
			);
		}

		currentSession = await prisma.conversationSession.create({
			data: {
				userId,
				language,
				persona,
				assignmentId: assignmentId || null
			}
		});
		currentSessionId = currentSession.id;
	} else {
		currentSession = await prisma.conversationSession.findUnique({
			where: { id: currentSessionId, userId }
		});
		if (!currentSession) {
			return json({ error: 'Session not found' }, { status: 404 });
		}
	}

	let assignmentTopic = null;
	let assignmentGoalTurns = null;
	if (currentSession.assignmentId) {
		const assignment = await prisma.assignment.findUnique({
			where: { id: currentSession.assignmentId }
		});
		if (assignment) {
			assignmentTopic = assignment.topic;
			assignmentGoalTurns = assignment.targetScore || 5;
		}
	}

	// Fetch user's vocabulary that needs review
	const activeLanguageName = language || currentSession.language;
	const activeLanguage = await prisma.language.findFirst({
		where: { name: { equals: activeLanguageName, mode: 'insensitive' } }
	});

	let userVocabList = '';
	const vocabIdMap: Record<string, string> = {};
	if (activeLanguage) {
		const userVocabs = await prisma.userVocabulary.findMany({
			where: {
				userId,
				vocabulary: { languageId: activeLanguage.id }
			},
			include: { vocabulary: true },
			take: 20, // get some recent/active vocab
			orderBy: { nextReviewDate: 'asc' }
		});

		userVocabs.forEach((uv, i) => {
			vocabIdMap[`v${i}`] = uv.vocabulary.id;
			userVocabList += `- ${uv.vocabulary.lemma} (ID: v${i})\n`;
		});
	}

	// Save the user's message
	await prisma.message.create({
		data: {
			sessionId: currentSessionId,
			role: 'user',
			content: normalizedMessage
		}
	});

	// Fetch conversation history
	const history = await prisma.message.findMany({
		where: { sessionId: currentSessionId },
		orderBy: { createdAt: 'asc' }
	});

	const chatMessages: ChatMessage[] = history.map((m) => ({
		role: m.role as 'user' | 'assistant',
		content: m.content
	}));

	const userMessageCount = history.filter(m => m.role === 'user').length;
	
	let assignmentPrompt = '';
	if (currentSession.assignmentId && assignmentTopic) {
		assignmentPrompt = `\nIMPORTANT ASSIGNMENT INSTRUCTIONS:
The user is completing an assignment. The required topic of conversation is: "${assignmentTopic}".
You must steer the conversation towards this topic naturally.
The user has completed ${userMessageCount} out of ${assignmentGoalTurns} required turns.
Set "assignmentCompleted" to true if the user has reached at least ${assignmentGoalTurns} turns and has successfully discussed the topic. Otherwise set it to false.\n`;
	}

	const systemPrompt = `You are an AI fully immersed in a live-action roleplay (LARP). You are completely taking on the persona of a "${currentSession.persona}". The user is practicing the "${currentSession.language}" language.
You must embody this character completely, down to your personality, quirks, and worldview. NEVER break character, never refer to yourself as an AI, and respond exactly as this character naturally would in ${currentSession.language}. 
Keep your responses relatively short, realistic, and conversational, suitable for an authentic dialogue.

In addition to your reply, you must act as a grader. Evaluate the user's last message.
Provide brief feedback in English ("feedbackEnglish") on their grammar and vocabulary usage.
If the user correctly used any of their targeted vocabulary, or if you can evaluate words they used, provide a score (0.0 to 1.0) for them in "vocabularyUpdates".
If they used OTHER ${currentSession.language} words correctly by coincidence, list their base forms (lemmas) in lowercase in "extraVocabLemmas".
${assignmentPrompt}

Targeted Vocabulary the user is learning:
${userVocabList || '(None currently active)'}

Return your response as a JSON object with the following structure:
{
  "message": "Your response as the persona in ${currentSession.language}",
  "feedbackEnglish": "Brief English feedback on the user's grammar/vocabulary usage in their last message",
  "vocabularyUpdates": [ { "id": "<vocabulary ID from the list>", "score": <number (0.0 to 1.0)> } ],
  "extraVocabLemmas": ["<lemma1>", "<lemma2>"]${currentSession.assignmentId ? ',\n  "assignmentCompleted": <boolean>' : ''}
}`;

	try {
		const response = await generateChatCompletion({
			userId,
			messages: chatMessages,
			systemPrompt,
			jsonMode: true,
			stream: true,
			signal: event.request.signal
		});

		const stream = new ReadableStream({
			async start(controller) {
				// Send metadata first
				controller.enqueue(
					new TextEncoder().encode(
						JSON.stringify({
							type: 'metadata',
							sessionId: currentSessionId
						}) + '\n'
					)
				);

				const reader = response.body?.getReader();
				if (!reader) {
					controller.close();
					return;
				}

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
							if (trimmedLine.startsWith('data:') && !trimmedLine.includes('[DONE]')) {
								try {
									const dataStr = trimmedLine.slice(5).trim();
									const data = JSON.parse(dataStr);
									const content = data.choices[0]?.delta?.content || data.choices[0]?.message?.content || '';
									if (content) {
										fullContent += content;
										controller.enqueue(
											new TextEncoder().encode(JSON.stringify({ type: 'chunk', content }) + '\n')
										);
									}
								} catch {
									// ignore partial JSON parse errors
								}
							}
						}
					}

					const finalBufferTrimmed = buffer.trim();
					if (finalBufferTrimmed.startsWith('data:') && !finalBufferTrimmed.includes('[DONE]')) {
						try {
							const dataStr = finalBufferTrimmed.slice(5).trim();
							const data = JSON.parse(dataStr);
							const content = data.choices[0]?.delta?.content || '';
							if (content) {
								fullContent += content;
								controller.enqueue(
									new TextEncoder().encode(JSON.stringify({ type: 'chunk', content }) + '\n')
								);
							}
						} catch {
							// ignore parse errors
						}
					}

					let parsedResponse;
					try {
						parsedResponse = JSON.parse(fullContent);
					} catch (error) {
						console.error('Failed to parse LLM response as JSON:', fullContent, error);
						parsedResponse = { message: fullContent, feedbackEnglish: null, vocabularyUpdates: [], extraVocabLemmas: [] };
					}

					// Update DB based on parsed response
					const replyMessage = parsedResponse.message || parsedResponse.reply || '';
					const aiMessage = await prisma.message.create({
						data: {
							sessionId: currentSessionId,
							role: 'assistant',
							content: replyMessage,
							correction: parsedResponse.feedbackEnglish
						}
					});

					// Map vocabulary IDs back
					const mappedVocabUpdates = (parsedResponse.vocabularyUpdates || []).map((u: { id: string, score: number }) => ({
						id: vocabIdMap[u.id] || u.id,
						score: u.score
					}));

					const evaluationPayload = {
						globalScore: 1.0,
						vocabularyUpdates: mappedVocabUpdates,
						grammarUpdates: [],
						extraVocabLemmas: parsedResponse.extraVocabLemmas || [],
						feedback: '',
						feedbackEnglish: parsedResponse.feedbackEnglish || ''
					};

					if (mappedVocabUpdates.length > 0 || evaluationPayload.extraVocabLemmas.length > 0) {
						await updateEloRatings(userId, evaluationPayload, 'native-to-target');
					}

					if (currentSession.assignmentId && parsedResponse.assignmentCompleted) {
						await prisma.assignmentScore.upsert({
							where: {
								assignmentId_userId: {
									assignmentId: currentSession.assignmentId,
									userId
								}
							},
							create: {
								assignmentId: currentSession.assignmentId,
								userId,
								score: 100,
								passed: true
							},
							update: {
								score: 100,
								passed: true
							}
						});
					}

					controller.enqueue(
						new TextEncoder().encode(JSON.stringify({ type: 'done', message: aiMessage, grading: parsedResponse }) + '\n')
					);

					controller.close();
				} catch (e) {
					controller.error(e);
				}
			}
		});

		return new Response(stream, {
			headers: {
				'Content-Type': 'application/x-ndjson',
				'Cache-Control': 'no-cache'
			}
		});
	} catch (error) {
		console.error('Error generating chat response:', error);
		return json({ error: 'Failed to generate response' }, { status: 500 });
	}
}
