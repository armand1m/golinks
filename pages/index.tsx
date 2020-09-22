import {
  GetServerSideProps,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import {
  Modal,
  Dialog,
  Flex,
  TopNav,
  PageWithHeader,
  DropdownMenu,
  Avatar,
  Heading,
  Spinner,
  useToasts,
  Container,
} from 'bumbag';

import { IClaims } from '../lib/auth';
import { LinkTable } from '../components/LinkTable';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { useGetAllLinksQuery } from '../lib/queries/getAllLinks.graphql';
import { useCreateLinkMutation } from '../lib/mutations/createLink.graphql';
import { useDeleteLinkMutation } from '../lib/mutations/deleteLink.graphql';

interface Props {
  logoname: string;
  hostname: string;
  user: IClaims;
  grants: {
    permissions: string[];
  };
}

const Index: React.FC<Props> = ({
  user,
  logoname,
  hostname,
  grants,
}) => {
  const [createLink] = useCreateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();
  const { loading, data, refetch } = useGetAllLinksQuery();
  const createLinkModal = Modal.useState();
  const toasts = useToasts();

  const canEdit = grants.permissions.includes('update:golinks');
  const canCreate = grants.permissions.includes('create:golinks');
  const canDelete = grants.permissions.includes('delete:golinks');

  return (
    <PageWithHeader
      headerHeight="80px"
      border="default"
      header={
        <TopNav>
          <TopNav.Section>
            <TopNav.Item href={hostname} fontWeight="semibold">
              <Heading>{logoname}</Heading>
            </TopNav.Item>
            <Modal.Disclosure
              use={TopNav.Item}
              {...createLinkModal}
              disabled={!canCreate}>
              Create
            </Modal.Disclosure>
          </TopNav.Section>
          <TopNav.Section marginRight="major-2">
            <DropdownMenu
              menu={
                <>
                  <DropdownMenu.Item
                    iconBefore="solid-sign-out-alt"
                    onClick={() =>
                      window.location.replace('/api/logout')
                    }>
                    Logout
                  </DropdownMenu.Item>
                </>
              }>
              <TopNav.Item>
                <Avatar
                  marginLeft="major-1"
                  variant="circle"
                  src={user.picture}
                  alt={`Avatar of ${user.name}`}
                  size="small"
                />
              </TopNav.Item>
            </DropdownMenu>
          </TopNav.Section>
        </TopNav>
      }>
      <Container padding="major-3">
        {canCreate && (
          <Dialog.Modal
            showCloseButton
            title="Create Go Link"
            {...createLinkModal}>
            <CreateLinkForm
              onSubmit={async (values, form) => {
                try {
                  await createLink({
                    variables: values,
                  });

                  toasts.success({
                    title: 'Link Created',
                    message: 'Link was successfully created.',
                  });

                  createLinkModal.hide();
                  form.resetForm();
                  refetch();
                } catch (e) {
                  console.error(
                    'Failed to create Link, details: ',
                    e
                  );
                  toasts.danger({
                    title: 'Failed to create Link',
                    message: 'An unexpected error occurred.',
                  });
                }
              }}
            />
          </Dialog.Modal>
        )}

        {loading && (
          <Flex alignX="center">
            <Spinner size="medium" />
          </Flex>
        )}

        {data !== undefined && data !== null && (
          <LinkTable
            data={data}
            isDeleteEnabled={canDelete}
            isEditEnabled={canEdit}
            onEdit={async (_linkId) => {
              /** Open EditLinkForm with data prefilled. */
            }}
            onShare={async (linkUrl) => {
              try {
                await navigator.clipboard.writeText(linkUrl);

                toasts.success({
                  title: 'Link Copied',
                  message: 'Link is in your clipboard.',
                });
              } catch (e) {
                console.error('Failed to Copy Link, details: ', e);
                toasts.danger({
                  title: 'Failed to Copy Link',
                  message: 'An unexpected error occurred.',
                });
              }
            }}
            onAnalytics={async (_linkId) => {
              /** Open Analytics Modal */
            }}
            onDelete={async (linkId) => {
              try {
                await deleteLink({
                  variables: {
                    id: linkId,
                  },
                });

                toasts.success({
                  title: 'Link Deleted',
                  message: 'Link was successfully deleted.',
                });

                refetch();
              } catch (e) {
                console.error('Failed to delete Link, details: ', e);
                toasts.danger({
                  title: 'Failed to delete Link',
                  message: 'An unexpected error occurred.',
                });
              }
            }}
          />
        )}
      </Container>
    </PageWithHeader>
  );
};

export default Index;

export const getServerSideProps: GetServerSideProps = async (
  context
) => {
  const { auth0, getPermissionsFromSession } = require('../lib/auth');
  const request = context?.req as NextApiRequest;
  const session = await auth0.getSession(request);
  const grants = await getPermissionsFromSession(session);
  const user = session?.user;
  const logoname = process.env.LOGONAME;
  const hostname = process.env.HOSTNAME;

  if (user) {
    return {
      props: {
        user,
        grants,
        logoname,
        hostname,
      },
    };
  }

  const response = context?.res as NextApiResponse;

  response.writeHead(302, {
    Location: '/api/login',
  });

  response.end();

  return {
    props: {},
  };
};
