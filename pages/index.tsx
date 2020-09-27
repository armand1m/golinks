import { lazy, Suspense, useState } from 'react';
import {
  GetServerSideProps,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import {
  Modal,
  Flex,
  Box,
  Dialog,
  TopNav,
  PageWithHeader,
  Heading,
  Spinner,
  useToasts,
  Container,
  Button,
  Stack,
  Set,
  FieldStack,
} from 'bumbag';

import { IClaims } from '../lib/auth';
import * as CreateLinkForm from '../components/CreateLinkForm';
import {
  useGetAllLinksQuery,
  Link,
} from '../lib/queries/getAllLinks.graphql';
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

type ViewType = 'card' | 'table';

const Loader = () => (
  <Flex alignX="center">
    <Spinner size="medium" />
  </Flex>
);

const Index: React.FC<Props> = ({ logoname, hostname, grants }) => {
  const toasts = useToasts();

  const [createLink, createLinkStatus] = useCreateLinkMutation();
  const [deleteLink, deleteLinkStatus] = useDeleteLinkMutation();
  const allLinks = useGetAllLinksQuery();

  const canEdit = grants.permissions.includes('update:golinks');
  const canCreate = grants.permissions.includes('create:golinks');
  const canDelete = grants.permissions.includes('delete:golinks');

  const [viewType, setViewType] = useState<ViewType>('card');

  const toggleViewType = () =>
    setViewType((currentViewType) =>
      currentViewType === 'card' ? 'table' : 'card'
    );

  const LinkViewComponent =
    viewType === 'card' ? LinkCards : LinkTable;

  const onCreateLink = async (
    values: Pick<Link, 'alias' | 'url'>
  ) => {
    try {
      await createLink({
        variables: values,
      });

      await allLinks.refetch();

      toasts.success({
        title: 'Link Created',
        message: 'Link was successfully created.',
      });
    } catch (error) {
      console.error('Failed to create Link, details: ', error);
      toasts.danger({
        title: 'Failed to create Link',
        message: 'An unexpected error occurred.',
      });
    }
  };

  const onEditLink = async (_linkId: string) => {
    /** Open EditLinkForm with data prefilled. */
  };

  const onViewLinkAnalytics = async (_linkId: string) => {
    /** Open Analytics Modal */
  };

  const onShareLink = async (linkUrl: string) => {
    try {
      await navigator.clipboard.writeText(linkUrl);

      toasts.success({
        title: 'Link Copied',
        message: 'Link is in your clipboard.',
      });
    } catch (error) {
      console.error('Failed to Copy Link, details: ', error);
      toasts.danger({
        title: 'Failed to Copy Link',
        message: 'An unexpected error occurred.',
      });
    }
  };

  const onDeleteLink = async (linkId: string) => {
    try {
      await deleteLink({
        variables: {
          id: linkId,
        },
      });

      await allLinks.refetch();

      toasts.success({
        title: 'Link Deleted',
        message: 'Link was successfully deleted.',
      });
    } catch (error) {
      console.error('Failed to delete Link, details: ', error);
      toasts.danger({
        title: 'Failed to delete Link',
        message: 'An unexpected error occurred.',
      });
    }
  };

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
      <Container padding="major-3">
        <Stack>
          <Set>
            {canCreate && (
              <Modal.State>
                {(modal) => (
                  <>
                    <Dialog.Modal
                      {...modal}
                      baseId="create-link-modal"
                      title="Create Link"
                      standalone>
                      <CreateLinkForm.FormWrapper
                        onSubmit={async (values, form) => {
                          await onCreateLink(values);
                          modal.hide();
                          form.resetForm();
                        }}>
                        <Dialog.Content>
                          <Box>
                            <Dialog.Header>
                              <Dialog.Title>Create Link</Dialog.Title>
                            </Dialog.Header>
                            <FieldStack>
                              <CreateLinkForm.Fields />
                            </FieldStack>
                          </Box>
                        </Dialog.Content>
                        <Dialog.Footer justifyContent="flex-end">
                          <Set>
                            <Button type="reset" onClick={modal.hide}>
                              Cancel
                            </Button>
                            <Button
                              palette="primary"
                              isLoading={
                                createLinkStatus.loading ||
                                allLinks.loading
                              }
                              type="submit">
                              Create
                            </Button>
                          </Set>
                        </Dialog.Footer>
                      </CreateLinkForm.FormWrapper>
                    </Dialog.Modal>
                    <Modal.Disclosure use={Button}>
                      Create
                    </Modal.Disclosure>
                  </>
                )}
              </Modal.State>
            )}

            <Button onClick={toggleViewType}>Toggle View Type</Button>
          </Set>

          {allLinks.loading && <Loader />}

          {allLinks.data !== undefined && allLinks.data !== null && (
            <Suspense fallback={<Loader />}>
              <LinkViewComponent
                data={allLinks.data}
                isDeleteEnabled={canDelete}
                isEditEnabled={canEdit}
                onEdit={onEditLink}
                onShare={onShareLink}
                onAnalytics={onViewLinkAnalytics}
                onDelete={onDeleteLink}
                isDeleting={deleteLinkStatus.loading}
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
