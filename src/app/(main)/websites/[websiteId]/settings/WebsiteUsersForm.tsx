import {
  Button,
  Column,
  Form,
  FormButtons,
  FormField,
  FormSubmitButton,
  Icon,
  Label,
  ListItem,
  Loading,
  Row,
  Select,
  Text,
} from '@umami/react-zen';
import { useState } from 'react';
import { UserAddButton } from '@/app/(main)/admin/users/UserAddButton';
import {
  useDeleteQuery,
  useMessages,
  useModified,
  useUpdateQuery,
  useUsersQuery,
  useWebsite,
  useWebsiteUsersQuery,
} from '@/components/hooks';
import { Trash } from '@/components/icons';

function WebsiteUserRemoveButton({ websiteId, userId }: { websiteId: string; userId: string }) {
  const { formatMessage, labels } = useMessages();
  const { mutateAsync, isPending } = useDeleteQuery(`/websites/${websiteId}/users/${userId}`);
  const { touch } = useModified();

  const handleRemove = async () => {
    await mutateAsync(null, {
      onSuccess: () => {
        touch(`website:${websiteId}:users`);
        touch('websites');
      },
    });
  };

  return (
    <Button variant="quiet" isPending={isPending} onPress={handleRemove}>
      <Icon>
        <Trash />
      </Icon>
      <Text>{formatMessage(labels.remove)}</Text>
    </Button>
  );
}

export function WebsiteUsersForm({ websiteId }: { websiteId: string }) {
  const { formatMessage, labels, messages, getErrorMessage } = useMessages();
  const website = useWebsite();
  const [userId, setUserId] = useState<string>(null);
  const [search, setSearch] = useState('');
  const { touch } = useModified();
  const { data: users, isLoading: usersLoading } = useUsersQuery({ search, pageSize: 50 });
  const { data: websiteUsers, isLoading: websiteUsersLoading } = useWebsiteUsersQuery(websiteId, {
    pageSize: 100,
  });
  const { mutateAsync, error, isPending } = useUpdateQuery(`/websites/${websiteId}/users`);

  const sharedUsers = websiteUsers?.data || [];
  const sharedUserIds = new Set(sharedUsers.map(({ user }: any) => user.id));
  const availableUsers =
    users?.data?.filter(({ id }: any) => id !== website.userId && !sharedUserIds.has(id)) || [];

  const handleSubmit = async () => {
    await mutateAsync(
      { userId },
      {
        onSuccess: () => {
          setUserId(null);
          setSearch('');
          touch(`website:${websiteId}:users`);
          touch('websites');
        },
      },
    );
  };

  if (websiteUsersLoading) {
    return <Loading icon="dots" placement="center" />;
  }

  return (
    <Form onSubmit={handleSubmit} error={getErrorMessage(error)} values={{ userId }}>
      <Column gap>
        <Column gap="2">
          <Row alignItems="center" justifyContent="space-between" gap>
            <Label>{formatMessage(labels.users)}</Label>
            <UserAddButton />
          </Row>
          <Row alignItems="flex-end" gap>
            <FormField name="userId" style={{ flex: 1 }}>
              <Select
                items={availableUsers}
                selectedKey={userId}
                isLoading={usersLoading}
                allowSearch
                searchValue={search}
                onSearch={setSearch}
                onSelectionChange={key => setUserId(key as string)}
                listProps={{
                  renderEmptyState: () => (
                    <Text color="muted">{formatMessage(messages.noResultsFound)}</Text>
                  ),
                  style: { maxHeight: '400px' },
                }}
              >
                {({ id, username }: any) => (
                  <ListItem key={id} id={id}>
                    {username}
                  </ListItem>
                )}
              </Select>
            </FormField>
            <FormButtons>
              <FormSubmitButton variant="primary" isPending={isPending} isDisabled={!userId}>
                {formatMessage(labels.add)}
              </FormSubmitButton>
            </FormButtons>
          </Row>
        </Column>

        <Column gap="2">
          {sharedUsers.map(({ user }: any) => (
            <Row key={user.id} alignItems="center" justifyContent="space-between" border padding>
              <Column gap="1">
                <Text>{user.username}</Text>
                <Text color="muted">{formatMessage(labels.viewOnly)}</Text>
              </Column>
              <WebsiteUserRemoveButton websiteId={websiteId} userId={user.id} />
            </Row>
          ))}
          {sharedUsers.length === 0 && (
            <Text color="muted">{formatMessage(messages.noResultsFound)}</Text>
          )}
        </Column>
      </Column>
    </Form>
  );
}
