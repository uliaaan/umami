import { useApi } from '../useApi';
import { useModified } from '../useModified';
import { usePagedQuery } from '../usePagedQuery';

export function useUsersQuery(params?: Record<string, any>) {
  const { get } = useApi();
  const { modified } = useModified(`users`);

  return usePagedQuery({
    queryKey: ['users:admin', { modified, ...params }],
    queryFn: (pageParams: any) => {
      return get('/admin/users', {
        ...pageParams,
        ...params,
      });
    },
  });
}
