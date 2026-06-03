import { parseRequest } from '@/lib/request';
import { ok, unauthorized } from '@/lib/response';
import { deleteWebsiteUser, getWebsiteUser } from '@/queries/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ websiteId: string; userId: string }> },
) {
  const { auth, error } = await parseRequest(request);

  if (error) {
    return error();
  }

  if (!auth.user.isAdmin) {
    return unauthorized();
  }

  const { websiteId, userId } = await params;

  if (await getWebsiteUser(websiteId, userId)) {
    await deleteWebsiteUser(websiteId, userId);
  }

  return ok();
}
