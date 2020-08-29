import { Box, Table, Text, Link as FannyLink, Button } from 'bumbag';

import { GetAllLinksQuery } from '../../lib/queries/getAllLinks.graphql';

interface Props {
  data: GetAllLinksQuery;
  isDeleteEnabled: boolean;
  onDelete: (linkId: string) => void | Promise<void>;
}

export const LinkTable: React.FC<Props> = ({
  data,
  isDeleteEnabled,
  onDelete,
}) => {
  const links = data?.links;

  if (links?.nodes.length === 0) {
    return (
      <Box>
        <Text>There are no golinks available.</Text>
      </Box>
    );
  }

  return (
    <Table isResponsive>
      <Table.Head>
        <Table.Row>
          <Table.HeadCell>Alias</Table.HeadCell>
          <Table.HeadCell>Destination</Table.HeadCell>
          <Table.HeadCell textAlign="right">Usage</Table.HeadCell>
          {isDeleteEnabled && (
            <Table.HeadCell textAlign="right">Actions</Table.HeadCell>
          )}
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <>
          {links?.nodes.map((link) => {
            return (
              <Table.Row key={link.id}>
                <Table.Cell>{link.alias}</Table.Cell>
                <Table.Cell>
                  <FannyLink
                    href={link.url}
                    style={{
                      display: 'block',
                      maxWidth: '350px',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}>
                    {link.url}
                  </FannyLink>
                </Table.Cell>
                <Table.Cell textAlign="right">
                  {link.linkUsageMetrics.totalCount}
                </Table.Cell>
                {isDeleteEnabled && (
                  <Table.Cell textAlign="right">
                    <Button
                      palette="danger"
                      onClick={() => onDelete(link.id)}>
                      Delete
                    </Button>
                  </Table.Cell>
                )}
              </Table.Row>
            );
          })}
        </>
      </Table.Body>
    </Table>
  );
};
