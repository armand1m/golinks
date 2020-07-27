import {
  Modal,
  DialogModal,
  Box,
  Page,
  Card,
  LayoutSet,
  Heading,
  Button,
} from 'fannypack'

import { useGetAllLinksQuery } from '../lib/queries/getAllLinks.graphql'
import { useCreateLinkMutation } from '../lib/mutations/createLink.graphql'
import { useDeleteLinkMutation } from '../lib/mutations/deleteLink.graphql'
import { CreateLinkForm } from '../components/CreateLinkForm';
import { LinkTable } from '../components/LinkTable';

const Index = () => {
  const [createLink] = useCreateLinkMutation();
  const [deleteLink] = useDeleteLinkMutation();
  const { data, refetch } = useGetAllLinksQuery();

  return (
    <Page.Content>
      <LayoutSet spacing="major-2">
        <Box>
          <Heading>go.armand1m.dev</Heading>
        </Box>

        <Card>
          <LayoutSet>
            <Modal.Container>
              {modal => (
                <Box>
                  <Button use={Modal.Show} {...modal}>
                    Create
                  </Button>
                  <DialogModal showCloseButton title="Create Go Link" {...modal}>
                    <CreateLinkForm
                      onSubmit={async (values, form) => {
                        await createLink({
                          variables: values,
                        });

                        await refetch();

                        /** @ts-ignore */
                        modal.hide();

                        form.resetForm();
                      }}
                    />
                  </DialogModal>
                </Box>
              )}
            </Modal.Container>

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
          </LayoutSet>
        </Card>
      </LayoutSet>
    </Page.Content>
  )
}

export default Index
