import { prisma } from './prisma';

const SINGLETON_ID = 'singleton';

export async function getSiteSettings() {
	return prisma.siteSettings.upsert({
		where: { id: SINGLETON_ID },
		create: { id: SINGLETON_ID },
		update: {}
	});
}

export async function updateSiteSettings(data: { localLoginEnabled?: boolean }) {
	return prisma.siteSettings.upsert({
		where: { id: SINGLETON_ID },
		create: { id: SINGLETON_ID, ...data },
		update: data
	});
}
