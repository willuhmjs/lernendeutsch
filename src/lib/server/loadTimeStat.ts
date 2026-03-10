/**
 * Rolling average tracker for generate-lesson response times.
 * Stores the last MAX_SAMPLES timings both in-memory and in the
 * SiteSettings singleton row so the average survives server restarts.
 */

import { prisma } from '$lib/server/prisma';

const MAX_SAMPLES = 20;

/** Default estimate (ms) when no data has been recorded yet. */
export const DEFAULT_LOAD_MS = 9000;

let publicSamples: number[] = [];
let localSamples: number[] = [];
let initialized = false;

/** Call once at server startup (e.g. from hooks.server.ts) to load stored samples. */
export async function initLoadTimeStat(): Promise<void> {
	if (initialized) return;
	try {
		const settings = await prisma.siteSettings.findUnique({
			where: { id: 'singleton' },
			select: { loadTimeSamples: true, localLoadTimeSamples: true }
		});
		if (settings?.loadTimeSamples?.length) {
			publicSamples = settings.loadTimeSamples.slice(-MAX_SAMPLES);
		}
		if (settings?.localLoadTimeSamples?.length) {
			localSamples = settings.localLoadTimeSamples.slice(-MAX_SAMPLES);
		}
		initialized = true;
		console.log(
			`[loadTimeStat] initialized with ${publicSamples.length} public stored sample(s), avg: ${getAverageLoadTime(false)}ms and ${localSamples.length} local stored sample(s), avg: ${getAverageLoadTime(true)}ms`
		);
	} catch (err) {
		console.error('[loadTimeStat] failed to load from DB, starting fresh:', err);
		initialized = true;
	}
}

export async function recordLoadTime(ms: number, isLocalMode: boolean = false): Promise<void> {
	const samples = isLocalMode ? localSamples : publicSamples;
	
	samples.push(ms);
	if (samples.length > MAX_SAMPLES) {
		samples.shift();
	}

	const avg = getAverageLoadTime(isLocalMode);
	console.log(
		`[loadTimeStat] recorded load time: ${ms}ms | rolling avg (${samples.length}/${MAX_SAMPLES} ${isLocalMode ? 'local' : 'public'} samples): ${avg}ms`
	);

	try {
		if (isLocalMode) {
			await prisma.siteSettings.upsert({
				where: { id: 'singleton' },
				update: { localLoadTimeSamples: samples },
				create: { id: 'singleton', localLoadTimeSamples: samples }
			});
		} else {
			await prisma.siteSettings.upsert({
				where: { id: 'singleton' },
				update: { loadTimeSamples: samples },
				create: { id: 'singleton', loadTimeSamples: samples }
			});
		}
	} catch (err) {
		console.error('[loadTimeStat] failed to persist load time:', err);
	}
}

/** Returns the rolling average in milliseconds, or DEFAULT_LOAD_MS if no samples yet. */
export function getAverageLoadTime(isLocalMode: boolean = false): number {
	const samples = isLocalMode ? localSamples : publicSamples;
	if (samples.length === 0) return DEFAULT_LOAD_MS;
	const avg = samples.reduce((a, b) => a + b, 0) / samples.length;
	return Math.round(avg);
}

export function getSampleCount(isLocalMode: boolean = false): number {
	const samples = isLocalMode ? localSamples : publicSamples;
	return samples.length;
}
