import type { PageServerLoad } from './$types';

export const load: PageServerLoad = async ({ locals }) => {
	const cefrLevel = locals.user?.cefrLevel || 'A1';
	return {
		cefrLevel
	};
};
