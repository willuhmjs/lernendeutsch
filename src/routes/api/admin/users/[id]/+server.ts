import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import type { RequestEvent } from '@sveltejs/kit';

export async function PUT({ params, request, locals }: RequestEvent) {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { id } = params;

	try {
		const body = await request.json();
		const { username, email, role, cefrLevel } = body;

		// Validate role
		if (role && !['USER', 'ADMIN'].includes(role)) {
			return json({ error: 'Invalid role. Must be USER or ADMIN.' }, { status: 400 });
		}

		// Validate CEFR level
		const validLevels = ['A1', 'A2', 'B1', 'B2', 'C1', 'C2'];
		if (cefrLevel && !validLevels.includes(cefrLevel)) {
			return json({ error: 'Invalid CEFR level.' }, { status: 400 });
		}

		// Prevent admin from removing their own admin role
		if (id === locals.user!.id && role && role !== 'ADMIN') {
			return json({ error: 'You cannot remove your own admin role.' }, { status: 400 });
		}

		const updateData: Record<string, string> = {};
		if (username !== undefined) updateData.username = username;
		if (email !== undefined) updateData.email = email;
		if (role !== undefined) updateData.role = role;
		if (cefrLevel !== undefined) updateData.cefrLevel = cefrLevel;

		const user = await prisma.user.update({
			where: { id },
			data: updateData,
			select: {
				id: true,
				username: true,
				email: true,
				role: true,
				cefrLevel: true,
				createdAt: true
			}
		});

		return json({ user });
	} catch (error: unknown) {
		if (error && typeof error === 'object' && 'code' in error) {
			const prismaError = error as { code: string; meta?: { target?: string[] } };
			if (prismaError.code === 'P2002') {
				const target = prismaError.meta?.target?.[0] || 'field';
				return json({ error: `A user with that ${target} already exists.` }, { status: 409 });
			}
			if (prismaError.code === 'P2025') {
				return json({ error: 'User not found.' }, { status: 404 });
			}
		}
		console.error('Failed to update user:', error);
		return json({ error: 'Failed to update user.' }, { status: 500 });
	}
}

export async function DELETE({ params, locals }: RequestEvent) {
	if (!locals.user || locals.user.role !== 'ADMIN') {
		return json({ error: 'Forbidden' }, { status: 403 });
	}

	const { id } = params;

	// Prevent admin from deleting themselves
	if (id === locals.user!.id) {
		return json({ error: 'You cannot delete your own account.' }, { status: 400 });
	}

	try {
		await prisma.user.delete({ where: { id } });
		return json({ success: true });
	} catch (error: unknown) {
		if (error && typeof error === 'object' && 'code' in error) {
			const prismaError = error as { code: string };
			if (prismaError.code === 'P2025') {
				return json({ error: 'User not found.' }, { status: 404 });
			}
		}
		console.error('Failed to delete user:', error);
		return json({ error: 'Failed to delete user.' }, { status: 500 });
	}
}
