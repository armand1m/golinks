import { lazy, Suspense } from 'react';
import { GetServerSideProps, NextApiRequest } from 'next';

import {
  Modal,
  Flex,
  Box,
  Dialog,
  PageWithHeader,
  Spinner,
  useToasts,
  Container,
  Button,
  Stack,
  Set,
  FieldStack,
} from 'bumbag';

import { TopNavigation } from '../components/TopNavigation';
import * as LinkForm from '../components/LinkForm';
import {
  Link,
  useGetAllLinksQuery,
} from '../lib/queries/getAllLinks.graphql';
import { useCreateLinkMutation } from '../lib/mutations/createLink.graphql';
import { useDeleteLinkMutation } from '../lib/mutations/deleteLink.graphql';

const LinkTable = lazy(() => import('../components/LinkTable'));

interface Props {
  logoname: string;
  hostname: string;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
  claims: {
    permissions: string[];
  };
}

const Loader = () => (
  <Flex alignX="center">
    <Spinner size="medium" />
  </Flex>
);

const Index: React.FC<Props> = ({
  logoname,
  hostname,
  claims,
  isAuthEnabled,
  isAuthenticated,
}) => {
  const toasts = useToasts();

  const [createLink, createLinkStatus] = useCreateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();
  const allLinks = useGetAllLinksQuery();

  const canEdit = claims.permissions.includes('update:golinks');
  const canCreate = claims.permissions.includes('create:golinks');
  const canDelete = claims.permissions.includes('delete:golinks');

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
      header={
        <TopNavigation
          logoname={logoname}
          hostname={hostname}
          isAuthEnabled={isAuthEnabled}
          isAuthenticated={isAuthenticated}
        />
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
                      <LinkForm.FormWrapper
                        initialValues={undefined}
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
                              <LinkForm.Fields />
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
                      </LinkForm.FormWrapper>
                    </Dialog.Modal>
                    <Modal.Disclosure use={Button}>
                      Create
                    </Modal.Disclosure>
                  </>
                )}
              </Modal.State>
            )}
          </Set>

          {allLinks.loading && <Loader />}

          {allLinks.data !== undefined && allLinks.data !== null && (
            <Suspense fallback={<Loader />}>
              <LinkTable
                data={allLinks.data}
                isEditEnabled={canEdit}
                isDeleteEnabled={canDelete}
                onEdit={onEditLink}
                onShare={onShareLink}
                onDelete={onDeleteLink}
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
  const { getUserClaimsFromRequest } = await import('../lib/auth');
  const { Config } = await import('../lib/config');
  const request = context?.req as NextApiRequest;
  const { claims, user } = await getUserClaimsFromRequest(request);
  const logoname = Config.metadata.logoname;
  const hostname = Config.metadata.hostname;
  const isAuthEnabled = Config.features.auth0;
  const isAuthenticated = user !== null;

  return {
    props: {
      claims,
      logoname,
      hostname,
      isAuthEnabled,
      isAuthenticated,
    },
  };
};
