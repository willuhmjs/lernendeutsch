import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export const GET = async ({ url }: RequestEvent) => {
	const query = url.searchParams.get('q');

	if (!query || query.trim().length === 0) {
		return json({ results: [] });
	}

	// Very simple search implementation
	const results = await prisma.vocabulary.findMany({
		where: {
			OR: [
				{
					lemma: {
						contains: query,
						mode: 'insensitive'
					}
				},
				{
					meaning: {
						contains: query,
						mode: 'insensitive'
					}
				}
			]
		},
		take: 20
	});

	return json({ results });
};