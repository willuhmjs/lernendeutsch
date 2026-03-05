import { json } from '@sveltejs/kit';
import { getAverageLoadTime, getSampleCount } from '$lib/server/loadTimeStat';

export async function GET({ locals }) {
	if (!locals.user) {
		return json({ error: 'Unauthorized' }, { status: 401 });
	}

	return json({
		averageMs: getAverageLoadTime(),
		sampleCount: getSampleCount()
	});
}
