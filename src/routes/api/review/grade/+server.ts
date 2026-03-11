import { json } from '@sveltejs/kit';
import { generateChatCompletion } from '$lib/server/llm';
import { isClearlyCorrect } from '$lib/server/fuzzyGrade';

export async function POST({ request, locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { userAnswer, lemma, correctMeaning } = await request.json();

		if (!userAnswer?.trim()) {
			return json({ correct: false, score: 0 });
		}

		// Fast path: skip LLM if fuzzy matching is confident the answer is correct
		if (correctMeaning && isClearlyCorrect(userAnswer, correctMeaning)) {
			return json({ correct: true, score: 1.0 });
		}

		const systemPrompt = `You are grading a vocabulary flashcard review. The student was shown a word and typed their translation into English.
You must output ONLY valid JSON with no extra text: {"correct": boolean, "score": number}
- correct: true if the answer demonstrates understanding of the word's meaning (allow minor typos, alternate phrasings, synonyms, partial answers that capture the core meaning)
- score: 0.0 to 1.0 (1.0 = perfect match, 0.8 = correct with minor issues, 0.5 = partially correct, 0.0 = wrong or blank)
Be lenient with spelling variations and accept common synonyms.`;

		const userMessage = `Word: ${lemma}
Correct meaning: ${correctMeaning}
Student's answer: ${userAnswer}`;

		const response = await generateChatCompletion({
			userId: locals.user.id,
			messages: [{ role: 'user', content: userMessage }],
			systemPrompt,
			jsonMode: true,
			temperature: 0.1
		});

		const result = JSON.parse(response.choices[0].message.content);
		return json({
			correct: !!result.correct,
			score: typeof result.score === 'number' ? result.score : result.correct ? 1.0 : 0.0
		});
	} catch (error) {
		console.error('Failed to grade review answer', error);
		return json({ correct: false, score: 0 });
	}
}
