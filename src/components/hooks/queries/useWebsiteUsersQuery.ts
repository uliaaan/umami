import type { ReactQueryOptions } from '@/lib/types';
import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useWebsiteUsersQuery(
  websiteId: string,
  params?: Record<string, any>,
  options?: ReactQueryOptions,
) {
  const { get } = useApi();
  const { modified } = useModified(`website:${websiteId}:users`);

  return usePagedQuery({
    queryKey: ['website:users', { websiteId, modified, ...params }],
    queryFn: pageParams => {
      return get(`/websites/${websiteId}/users`, {
        ...pageParams,
        ...params,
      });
    },
    enabled: !!websiteId,
    ...options,
  });
}
