import {
  Modal,
  Dialog,
  Box,
  PageContent,
  Card,
  Stack,
  Heading,
  Button,
} from 'bumbag'

import { useGetAllLinksQuery } from '../lib/queries/getAllLinks.graphql'
import { useCreateLinkMutation } from '../lib/mutations/createLink.graphql'
import { useDeleteLinkMutation } from '../lib/mutations/deleteLink.graphql'
import { CreateLinkForm } from '../components/CreateLinkForm';
import { LinkTable } from '../components/LinkTable';

const Index = () => {
  const [createLink] = useCreateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();
  const { data, refetch } = useGetAllLinksQuery();
  const createLinkModal = Modal.useState();


  return (
    <PageContent>
      <Stack spacing="major-2">
        <Box>
          <Heading>go.armand1m.dev</Heading>
        </Box>

        <Card>
          <Stack>
            <>
              <Modal.Disclosure use={Button} {...createLinkModal}>
                Create
              </Modal.Disclosure>
              <Dialog.Modal showCloseButton title="Create Go Link" {...createLinkModal}>
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

            {data !== undefined && data !== null && (
              <LinkTable
                data={data}
                onDelete={async (linkId) => {
                  await deleteLink({
                    variables: {
                      id: linkId
                    }
                  });

                  await refetch();
                }}
              />
            )}
          </Stack>
        </Card>
      </Stack>
    </PageContent>
  )
}

export default Index
