import { hasPermission } from '@/lib/auth';
import { PERMISSIONS } from '@/lib/constants';
import type { Auth } from '@/lib/types';
import { getLink, getPixel, getWebsite, getWebsiteUser } from '@/queries/prisma';

export async function canViewWebsite({ user, shareToken }: Auth, websiteId: string) {
  if (user?.isAdmin) {
    return true;
  }

  if (shareToken?.websiteId === websiteId) {
    return true;
  }

  const website = await getWebsite(websiteId);
  const link = await getLink(websiteId);
  const pixel = await getPixel(websiteId);

  const entity = website || link || pixel;

  if (!entity) {
    return false;
  }

  if (entity.userId && user.id === entity.userId) {
    return true;
  }

  if (website) {
    const websiteUser = await getWebsiteUser(website.id, user.id);

    return !!websiteUser;
  }

  if (entity.userId) {
    return false;
  }

  return false;
}

export async function canViewAllWebsites({ user }: Auth) {
  return user.isAdmin;
}

export async function canCreateWebsite({ user }: Auth) {
  if (user.isAdmin) {
    return true;
  }

  return hasPermission(user.role, PERMISSIONS.websiteCreate);
}

export async function canUpdateWebsite({ user }: Auth, websiteId: string) {
  if (user.isAdmin) {
    return true;
  }

  const website = await getWebsite(websiteId);

  if (!website) {
    return false;
  }

  if (website.userId) {
    return user.id === website.userId;
  }

  return false;
}

export async function canDeleteWebsite({ user }: Auth, websiteId: string) {
  if (user.isAdmin) {
    return true;
  }

  const website = await getWebsite(websiteId);

  if (!website) {
    return false;
  }

  if (website.userId) {
    return user.id === website.userId;
  }

  return false;
}

export async function canTransferWebsiteToUser(_auth: Auth, _websiteId: string, _userId: string) {
  return false;
}

export async function canTransferWebsiteToTeam(_auth: Auth, _websiteId: string, _teamId: string) {
  return false;
}
