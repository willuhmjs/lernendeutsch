import { prisma } from './prisma';

function getDateInTimezone(date: Date, timezone: string | null): Date {
	if (!timezone) {
		return new Date(date.getFullYear(), date.getMonth(), date.getDate());
	}
	const parts = new Intl.DateTimeFormat('en-US', {
		timeZone: timezone,
		year: 'numeric',
		month: '2-digit',
		day: '2-digit'
	}).formatToParts(date);

	const year = parseInt(parts.find(p => p.type === 'year')!.value);
	const month = parseInt(parts.find(p => p.type === 'month')!.value) - 1;
	const day = parseInt(parts.find(p => p.type === 'day')!.value);

	return new Date(year, month, day);
}

export async function updateGamification(userId: string, xpToAdd: number) {
	const user = await prisma.user.findUnique({
		where: { id: userId },
		select: {
			currentStreak: true,
			longestStreak: true,
			lastActivityDate: true,
			totalXp: true,
			timezone: true
		}
	});

	if (!user) {
		throw new Error('User not found');
	}

	const now = new Date();
	let newStreak = user.currentStreak;
	let newLongestStreak = user.longestStreak;

	if (user.lastActivityDate) {
		const today = getDateInTimezone(now, user.timezone);
		const lastActiveDay = getDateInTimezone(new Date(user.lastActivityDate), user.timezone);

		const diffTime = Math.abs(today.getTime() - lastActiveDay.getTime());
		const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

		if (diffDays === 0) {
			// Same day - maintain current streak
			newStreak = user.currentStreak;
		} else if (diffDays === 1) {
			// Consecutive day - increment streak
			newStreak += 1;
		} else if (diffDays > 1) {
			// Streak broken - reset to 1
			newStreak = 1;
		}
	} else {
		// First activity ever
		newStreak = 1;
	}

	if (newStreak > newLongestStreak) {
		newLongestStreak = newStreak;
	}

	return await prisma.user.update({
		where: { id: userId },
		data: {
			totalXp: { increment: xpToAdd },
			currentStreak: newStreak,
			longestStreak: newLongestStreak,
			lastActivityDate: now
		}
	});
}
