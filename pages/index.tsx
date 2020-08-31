import {
  GetServerSideProps,
  NextApiRequest,
  NextApiResponse,
} from 'next';
import {
  Modal,
  Dialog,
  Flex,
  PageContent,
  Card,
  Stack,
  Heading,
  Button,
  Spinner,
  useToasts,
} from 'bumbag';

import { IClaims } from '../lib/auth';
import { LinkTable } from '../components/LinkTable';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { useGetAllLinksQuery } from '../lib/queries/getAllLinks.graphql';
import { useCreateLinkMutation } from '../lib/mutations/createLink.graphql';
import { useDeleteLinkMutation } from '../lib/mutations/deleteLink.graphql';

interface Props {
  user: IClaims;
  grants: {
    permissions: string[];
  };
}

const Index: React.FC<Props> = ({ grants }) => {
  const [createLink] = useCreateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();
  const { loading, data, refetch } = useGetAllLinksQuery();
  const createLinkModal = Modal.useState();
  const toasts = useToasts();

  const canEdit = grants.permissions.includes('update:golinks');
  const canCreate = grants.permissions.includes('create:golinks');
  const canDelete = grants.permissions.includes('delete:golinks');

  return (
    <PageContent>
      <Stack spacing="major-2">
        <Flex alignItems="center" justifyContent="space-between">
          <Heading>go.armand1m.dev</Heading>
          <Flex alignItems="center">
            <Button
              variant="ghost"
              palette="primary"
              onClick={() => window.location.replace('/api/logout')}>
              Logout
            </Button>
          </Flex>
        </Flex>

        <Card>
          <Stack>
            {canCreate && (
              <>
                <Modal.Disclosure use={Button} {...createLinkModal}>
                  Create
                </Modal.Disclosure>
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
              </>
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
                    console.error(
                      'Failed to Copy Link, details: ',
                      e
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
                  } catch (e) {
                    console.error(
                      'Failed to delete Link, details: ',
                      e
                    );
                    toasts.danger({
                      title: 'Failed to delete Link',
                      message: 'An unexpected error occurred.',
                    });
                  }
                }}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    </PageContent>
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

  if (user) {
    return {
      props: {
        user,
        grants,
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
