import {
  Box,
  Table,
  Text,
  Link as FannyLink,
  Button,
  DropdownMenu,
  Icon,
} from 'bumbag';
import { GetAllLinksQuery } from '../../lib/queries/getAllLinks.graphql';
import { LinkMetricUsageGraph } from '../LinkMetricUsageGraph';

interface Props {
  data: GetAllLinksQuery;
  baseUrl: string;
  isEditEnabled: boolean;
  isDeleteEnabled: boolean;
  onEdit: (linkId: string) => void | Promise<void>;
  onShare: (linkUrl: string) => void | Promise<void>;
  onDelete: (linkId: string) => void | Promise<void>;
}

export const LinkTable: React.FC<Props> = ({
  data,
  baseUrl,
  isEditEnabled,
  isDeleteEnabled,
  onEdit,
  onShare,
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
    <Table isResponsive responsiveBreakpoint="tablet">
      <Table.Head>
        <Table.Row>
          <Table.HeadCell>Alias</Table.HeadCell>
          <Table.HeadCell>Destination</Table.HeadCell>
          <Table.HeadCell textAlign="center">
            Month Usage
          </Table.HeadCell>
          <Table.HeadCell textAlign="center">
            Total Usage
          </Table.HeadCell>
          <Table.HeadCell textAlign="right">Actions</Table.HeadCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <>
          {links?.nodes.map((link) => (
            <Table.Row key={link.id}>
              <Table.Cell>
                <FannyLink
                  href={new URL(link.alias, baseUrl).href}
                  style={{
                    display: 'block',
                    maxWidth: '350px',
                    whiteSpace: 'nowrap',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                  }}>
                  {link.alias}
                </FannyLink>
              </Table.Cell>
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
              <Table.Cell textAlign="center">
                <LinkMetricUsageGraph
                  linkUsageMetrics={link.linkUsageMetrics.nodes}
                />
              </Table.Cell>
              <Table.Cell textAlign="center">
                {link.linkUsageMetrics.totalCount}
              </Table.Cell>
              <Table.Cell textAlign="right">
                <DropdownMenu
                  menu={
                    <>
                      {isEditEnabled && (
                        <DropdownMenu.Item
                          disabled={!isEditEnabled}
                          iconBefore="solid-edit"
                          onClick={() => onEdit(link.id)}>
                          Edit
                        </DropdownMenu.Item>
                      )}
                      <DropdownMenu.Item
                        iconBefore="solid-share"
                        onClick={() => {
                          const url = new URL(
                            link.alias,
                            document.location.origin
                          ).toString();
                          onShare(url);
                        }}>
                        Share
                      </DropdownMenu.Item>
                      {isDeleteEnabled && (
                        <DropdownMenu.Item
                          disabled={!isDeleteEnabled}
                          iconBefore="solid-trash-alt"
                          color="danger"
                          onClick={() => {
                            onDelete(link.id);
                          }}>
                          Delete
                        </DropdownMenu.Item>
                      )}
                    </>
                  }>
                  <Button size="small">
                    <Icon icon="solid-edit" />
                  </Button>
                </DropdownMenu>
              </Table.Cell>
            </Table.Row>
          ))}
        </>
      </Table.Body>
    </Table>
  );
};

export default LinkTable;
