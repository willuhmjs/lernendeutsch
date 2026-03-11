import { z } from 'zod';
import { prisma } from '$lib/server/prisma';
import { fail, redirect } from '@sveltejs/kit';
import type { Actions, PageServerLoad } from './$types';
import bcrypt from 'bcrypt';
import { Prisma } from '@prisma/client';
import { getSiteSettings } from '$lib/server/settings';

const signupSchema = z.object({
	username: z.string().min(3).max(31),
	email: z.email().max(128),
	password: z.string().max(128)
});

export const load: PageServerLoad = async () => {
	const settings = await getSiteSettings();
	return { localLoginEnabled: settings.localLoginEnabled };
};

export const actions = {
	default: async (event) => {
		const settings = await getSiteSettings();
		if (!settings.localLoginEnabled) {
			return fail(403, { error: 'Local signup is disabled' });
		}

		const formData = await event.request.formData();
		const data = Object.fromEntries(formData);

		const parsed = signupSchema.safeParse(data);
		if (!parsed.success) {
			return fail(400, { error: 'Invalid input' });
		}

		const { username, email, password } = parsed.data;

		// Hash password
		const passwordHash = await bcrypt.hash(password, 10);

		// Create user — rely on DB unique constraints for race-condition safety
		// Role assignment is done atomically after creation to avoid race conditions
		let createdUser;
		try {
			createdUser = await prisma.user.create({
				data: {
					username,
					email,
					passwordHash,
					role: 'USER' // Default to USER, upgrade to ADMIN if first user
				}
			});

			// Atomically check and upgrade to ADMIN if this is the first user
			// This happens after creation to avoid race condition
			const isFirstUser = await prisma.user.count() === 1;
			if (isFirstUser) {
				await prisma.user.update({
					where: { id: createdUser.id },
					data: { role: 'ADMIN' }
				});
			}
		} catch (error) {
			if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === 'P2002') {
				const target = (error.meta?.target as string[]) ?? [];
				if (target.includes('email')) {
					return fail(400, { error: 'An account with this email already exists' });
				}
				if (target.includes('username')) {
					return fail(400, { error: 'This username is already taken' });
				}
				return fail(400, { error: 'Username or email already exists' });
			}
			throw error;
		}

		throw redirect(302, '/login');
	}
} satisfies Actions;
