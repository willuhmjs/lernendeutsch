import { json } from '@sveltejs/kit';
import { getAverageLoadTime, getSampleCount, recordLoadTime } from '$lib/server/loadTimeStat';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	const isLocalMode = !!locals.user.useLocalLlm;

	return json({
		averageMs: getAverageLoadTime(isLocalMode),
		sampleCount: getSampleCount(isLocalMode),
		isLocalMode
	});
}

export async function POST({ locals, request }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	try {
		const { loadTimeMs } = await request.json();

		if (
			typeof loadTimeMs !== 'number' ||
			isNaN(loadTimeMs) ||
			loadTimeMs < 0 ||
			loadTimeMs > 60000
		) {
			return json({ error: 'Invalid load time value' }, { status: 400 });
		}

		const isLocalMode = !!locals.user.useLocalLlm;
		await recordLoadTime(loadTimeMs, isLocalMode);
		return json({ success: true, isLocalMode });
	} catch {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}
}
