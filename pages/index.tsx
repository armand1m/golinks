import { lazy, Suspense, useState } from 'react';
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
  Heading,
  Spinner,
  useToasts,
  Container,
  Button,
  Stack,
  Set,
} from 'bumbag';

import { IClaims } from '../lib/auth';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { useGetAllLinksQuery } from '../lib/queries/getAllLinks.graphql';
import { useCreateLinkMutation } from '../lib/mutations/createLink.graphql';
import { useDeleteLinkMutation } from '../lib/mutations/deleteLink.graphql';

const LinkCards = lazy(() => import('../components/LinkCards'));
const LinkTable = lazy(() => import('../components/LinkTable'));

interface Props {
  logoname: string;
  hostname: string;
  user: IClaims;
  grants: {
    permissions: string[];
  };
}

const Index: React.FC<Props> = ({ logoname, hostname, grants }) => {
  const [createLink] = useCreateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();
  const { loading, data, refetch } = useGetAllLinksQuery();
  const createLinkModal = Modal.useState();
  const toasts = useToasts();

  const canEdit = grants.permissions.includes('update:golinks');
  const canCreate = grants.permissions.includes('create:golinks');
  const canDelete = grants.permissions.includes('delete:golinks');

  const [viewType, setViewType] = useState<'card' | 'table'>('card');

  const toggleViewType = () =>
    setViewType((currentViewType) =>
      currentViewType === 'card' ? 'table' : 'card'
    );

  const LinkViewComponent =
    viewType === 'card' ? LinkCards : LinkTable;

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
          </TopNav.Section>
          <TopNav.Section>
            <TopNav.Item>
              <Button
                iconBefore="solid-sign-out-alt"
                variant="link"
                onClick={() =>
                  window.location.replace('/api/logout')
                }>
                Logout
              </Button>
            </TopNav.Item>
          </TopNav.Section>
        </TopNav>
      }>
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
              } catch (error) {
                console.error(
                  'Failed to create Link, details: ',
                  error
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

      <Container padding="major-3">
        <Stack>
          <Set>
            {canCreate && (
              <Modal.Disclosure
                use={Button}
                {...createLinkModal}
                disabled={!canCreate}>
                Create
              </Modal.Disclosure>
            )}

            <Button onClick={toggleViewType}>Toggle View Type</Button>
          </Set>

          {loading && (
            <Flex alignX="center">
              <Spinner size="medium" />
            </Flex>
          )}

          {data !== undefined && data !== null && (
            <Suspense
              fallback={
                <Flex alignX="center">
                  <Spinner size="medium" />
                </Flex>
              }>
              <LinkViewComponent
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
                  } catch (error) {
                    console.error(
                      'Failed to Copy Link, details: ',
                      error
                    );
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
                  } catch (error) {
                    console.error(
                      'Failed to delete Link, details: ',
                      error
                    );
                    toasts.danger({
                      title: 'Failed to delete Link',
                      message: 'An unexpected error occurred.',
                    });
                  }
                }}
              />
            </Suspense>
          )}
        </Stack>
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
