import { json } from '@sveltejs/kit';
import { generateChatCompletion } from '$lib/server/llm';
import { updateGamification } from '$lib/server/gamification';
import { isClearlyCorrect } from '$lib/server/fuzzyGrade';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { question, userAnswer, sampleAnswer, awardXp, directXp } = await request.json();

		// directXp: skip LLM grading, just award this XP amount directly (used for MCQ batches)
		if (typeof directXp === 'number' && directXp > 0) {
			await updateGamification(locals.user.id, directXp);
			return json({ score: 1, feedback: '' });
		}

		if (!userAnswer?.trim()) {
			return json({ score: 0, feedback: 'No answer provided.' });
		}

		// Fast path: skip LLM if fuzzy matching is confident the answer is correct
		if (sampleAnswer && isClearlyCorrect(userAnswer, sampleAnswer)) {
			if (awardXp && typeof awardXp === 'number') {
				await updateGamification(locals.user.id, awardXp);
			}
			return json({ score: 1, feedback: '' });
		}

		const systemPrompt = `You are grading a reading comprehension answer for a language learning app.
The student read an authentic text in their target language and answered a question in English.
Output ONLY valid JSON: {"score": number, "feedback": string}
- score: 0.0 to 1.0 (1.0 = complete and accurate, 0.7 = mostly correct, 0.4 = partially correct, 0.0 = wrong/irrelevant)
- feedback: 1-2 sentences of constructive feedback in English. Mention what was good and what was missing if score < 1.0.
Be lenient with phrasing as long as the core meaning is correct. Accept synonyms and paraphrases.`;

		const userMessage = `Question: ${question}
Sample answer: ${sampleAnswer}
Student's answer: ${userAnswer}`;

		const response = await generateChatCompletion({
			userId: locals.user.id,
			messages: [{ role: 'user', content: userMessage }],
			systemPrompt,
			jsonMode: true,
			temperature: 0.1
		});

		const result = JSON.parse(response.choices[0].message.content);
		const score = typeof result.score === 'number' ? Math.max(0, Math.min(1, result.score)) : 0;

		// Award XP proportional to score
		if (awardXp && typeof awardXp === 'number' && score > 0) {
			const xpEarned = Math.round(awardXp * score);
			if (xpEarned > 0) {
				await updateGamification(locals.user.id, xpEarned);
			}
		}

		return json({ score, feedback: result.feedback || '' });
	} catch (error) {
		console.error('Immersion grade error:', error);
		return json({ score: 0, feedback: 'Could not grade your answer. Please try again.' });
	}
}
