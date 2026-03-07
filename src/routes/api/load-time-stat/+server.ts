import { json } from '@sveltejs/kit';
import { getAverageLoadTime, getSampleCount, recordLoadTime } from '$lib/server/loadTimeStat';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return json({
		averageMs: getAverageLoadTime(),
		sampleCount: getSampleCount()
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

		await recordLoadTime(loadTimeMs);
		return json({ success: true });
	} catch {
		return json({ error: 'Invalid payload' }, { status: 400 });
	}
}
