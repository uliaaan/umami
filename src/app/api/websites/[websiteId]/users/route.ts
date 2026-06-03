import { z } from 'zod';
import { uuid } from '@/lib/crypto';
import { getQueryFilters, parseRequest } from '@/lib/request';
import { badRequest, json, unauthorized } from '@/lib/response';
import { pagingParams, searchParams } from '@/lib/schema';
import { createWebsiteUser, getWebsite, getWebsiteUser, getWebsiteUsers } from '@/queries/prisma';
import { getUser } from '@/queries/prisma/user';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const schema = z.object({
    ...pagingParams,
    ...searchParams,
  });
  const { auth, query, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!auth.user.isAdmin) {
    return unauthorized();
  }

  const { websiteId } = await params;
  const filters = await getQueryFilters(query);

  return json(await getWebsiteUsers(websiteId, filters));
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ websiteId: string }> },
) {
  const schema = z.object({
    userId: z.uuid(),
  });
  const { auth, body, error } = await parseRequest(request, schema);

  if (error) {
    return error();
  }

  if (!auth.user.isAdmin) {
    return unauthorized();
  }

  const { websiteId } = await params;
  const website = await getWebsite(websiteId);
  const user = await getUser(body.userId);

  if (!website || !user) {
    return badRequest();
  }

  if (website.userId === body.userId) {
    return badRequest({ message: 'User already owns this website.' });
  }

  if (await getWebsiteUser(websiteId, body.userId)) {
    return badRequest({ message: 'User already has access to this website.' });
  }

  const websiteUser = await createWebsiteUser({
    id: uuid(),
    websiteId,
    userId: body.userId,
  });

  return json(websiteUser);
}
