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
} from 'bumbag';

import {
  auth0,
  getPermissionsFromSession,
  IClaims,
} from '../lib/auth';
import { useGetAllLinksQuery } from '../lib/queries/getAllLinks.graphql';
import { useCreateLinkMutation } from '../lib/mutations/createLink.graphql';
import { useDeleteLinkMutation } from '../lib/mutations/deleteLink.graphql';
import { CreateLinkForm } from '../components/CreateLinkForm';
import { LinkTable } from '../components/LinkTable';

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

  const canCreate = grants.permissions.includes('create:golinks');
  const canDelete = grants.permissions.includes('delete:golinks');

  return (
    <PageContent>
      <Stack spacing="major-2">
        <Flex alignItems="center" justifyContent="space-between">
          <Heading>go.armand1m.dev</Heading>
          <Flex alignItems="center">
            <Button
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
                      await createLink({
                        variables: values,
                      });

                      await refetch();

                      createLinkModal.hide();

                      form.resetForm();
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
                onDelete={async (linkId) => {
                  await deleteLink({
                    variables: {
                      id: linkId,
                    },
                  });

                  await refetch();
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

  const res = context?.res as NextApiResponse;

  res.writeHead(302, {
    Location: '/api/login',
  });

  res.end();

  return {
    props: {},
  };
};
