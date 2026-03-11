/**
 * Fuzzy matching helpers for pre-checking answers before calling the LLM.
 * Uses token Jaccard similarity (handles word reordering/paraphrasing) and
 * normalized Levenshtein distance (catches near-identical strings with minor typos).
 *
 * Only returns true when confidence is high — conservative thresholds to avoid false positives.
 */

function normalizeForFuzzy(text: string): string {
	return text
		.toLowerCase()
		// Normalize German special characters so "ß"/"ss", "ä"/"ae", etc. compare equal
		.replace(/ß/g, 'ss')
		.replace(/ä/g, 'ae')
		.replace(/ö/g, 'oe')
		.replace(/ü/g, 'ue')
		.replace(/[^\w\s]/g, ' ')
		.replace(/\s+/g, ' ')
		.trim();
}

function jaccardSimilarity(a: string[], b: string[]): number {
	if (a.length === 0 && b.length === 0) return 1;
	const setA = new Set(a);
	const setB = new Set(b);
	let intersection = 0;
	for (const word of setA) {
		if (setB.has(word)) intersection++;
	}
	const union = setA.size + setB.size - intersection;
	return intersection / union;
}

function levenshteinSimilarity(a: string, b: string): number {
	if (a === b) return 1;
	const maxLen = Math.max(a.length, b.length);
	if (maxLen === 0) return 1;
	// Guard against very long strings where O(n*m) would be expensive
	if (maxLen > 500) return 0;
	const m = a.length,
		n = b.length;
	let prev = Array.from({ length: n + 1 }, (_, j) => j);
	for (let i = 1; i <= m; i++) {
		const curr = [i];
		for (let j = 1; j <= n; j++) {
			curr[j] =
				a[i - 1] === b[j - 1]
					? prev[j - 1]
					: 1 + Math.min(prev[j], curr[j - 1], prev[j - 1]);
		}
		prev = curr;
	}
	return 1 - prev[n] / maxLen;
}

/**
 * Returns true if the user's answer is clearly correct without needing LLM grading.
 * - Exact match after normalization → true
 * - Token Jaccard ≥ 0.85 (≥85% word overlap, order-independent) → true
 * - Normalized Levenshtein similarity ≥ 0.92 (near-identical strings) → true
 */
export function isClearlyCorrect(userAnswer: string, referenceAnswer: string): boolean {
	const normUser = normalizeForFuzzy(userAnswer);
	const normRef = normalizeForFuzzy(referenceAnswer);

	if (normUser === normRef) return true;

	const userTokens = normUser.split(' ').filter(Boolean);
	const refTokens = normRef.split(' ').filter(Boolean);

	if (jaccardSimilarity(userTokens, refTokens) >= 0.85) return true;
	if (levenshteinSimilarity(normUser, normRef) >= 0.92) return true;

	return false;
}
