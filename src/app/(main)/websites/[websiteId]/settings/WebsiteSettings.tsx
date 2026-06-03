import { Column } from '@umami/react-zen';
import { Panel } from '@/components/common/Panel';
import { useLoginQuery, useWebsite } from '@/components/hooks';
import { WebsiteData } from './WebsiteData';
import { WebsiteEditForm } from './WebsiteEditForm';
import { WebsiteShareForm } from './WebsiteShareForm';
import { WebsiteTrackingCode } from './WebsiteTrackingCode';
import { WebsiteUsersForm } from './WebsiteUsersForm';

export function WebsiteSettings({ websiteId }: { websiteId: string; openExternal?: boolean }) {
  const website = useWebsite();
  const { user } = useLoginQuery();
  const canManage = user.isAdmin || website.userId === user.id;

  if (!canManage) {
    return null;
  }

  return (
    <Column gap="6">
      <Panel>
        <WebsiteEditForm websiteId={websiteId} />
      </Panel>
      <Panel>
        <WebsiteTrackingCode websiteId={websiteId} />
      </Panel>
      <Panel>
        <WebsiteShareForm websiteId={websiteId} shareId={website.shareId} />
      </Panel>
      {user.isAdmin && (
        <Panel>
          <WebsiteUsersForm websiteId={websiteId} />
        </Panel>
      )}
      <Panel>
        <WebsiteData websiteId={websiteId} />
      </Panel>
    </Column>
  );
}
