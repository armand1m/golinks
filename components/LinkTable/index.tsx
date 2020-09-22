import {
  Box,
  Table,
  Text,
  Link as FannyLink,
  Button,
  DropdownMenu,
  Icon,
} from 'bumbag';
import { Sparklines, SparklinesLine } from 'react-sparklines';
import { compareAsc, eachDayOfInterval, sub } from 'date-fns';
import { formatWithOptions } from 'date-fns/fp';
import { nl } from 'date-fns/locale';
import {
  GetAllLinksQuery,
  LinkUsageMetric,
} from '../../lib/queries/getAllLinks.graphql';

interface Props {
  data: GetAllLinksQuery;
  isDeleteEnabled: boolean;
  isEditEnabled: boolean;
  onDelete: (linkId: string) => void | Promise<void>;
  onShare: (linkUrl: string) => void | Promise<void>;
  onAnalytics: (linkId: string) => void | Promise<void>;
  onEdit: (linkId: string) => void | Promise<void>;
}

const dateToString = formatWithOptions({ locale: nl }, 'dd/MM/yyyy');

const convertMetricsToLineChartData = (
  linkUsageMetrics: Pick<LinkUsageMetric, 'accessedAt'>[]
) => {
  const days = eachDayOfInterval({
    end: new Date(),
    start: sub(new Date(), {
      days: 14,
    }),
  });

  const dates = [
    ...linkUsageMetrics.map((metric) => new Date(metric.accessedAt)),
    ...days,
  ].sort(compareAsc);

  const countPerDate = dates.map(dateToString).reduce(
    (acc, date) => ({
      ...acc,
      [date]: (acc[date] || 0) + 1,
    }),
    {} as Record<string, number>
  );

  return Object.values(countPerDate);
};

export const LinkTable: React.FC<Props> = ({
  data,
  isDeleteEnabled,
  isEditEnabled,
  onDelete,
  onEdit,
  onShare,
  onAnalytics,
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
          <Table.HeadCell textAlign="center">
            Usage <Text use="sub">(14 days)</Text>
          </Table.HeadCell>
          <Table.HeadCell textAlign="right">Actions</Table.HeadCell>
        </Table.Row>
      </Table.Head>
      <Table.Body>
        <>
          {links?.nodes.map((link) => (
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
              <Table.Cell textAlign="center">
                <Sparklines
                  data={convertMetricsToLineChartData(
                    link.linkUsageMetrics.nodes
                  )}
                  limit={14}
                  style={{ minWidth: '120px', maxWidth: '170px' }}>
                  <SparklinesLine
                    style={{ stroke: '#574feb', fill: '#eeedfd' }}
                  />
                </Sparklines>
                <br />
                <Text use="sub">
                  Total Usage: {link.linkUsageMetrics.totalCount}
                </Text>
              </Table.Cell>
              <Table.Cell textAlign="right">
                <DropdownMenu
                  menu={
                    <>
                      <DropdownMenu.Item
                        disabled={!isEditEnabled}
                        iconBefore="solid-edit"
                        onClick={() => onEdit(link.id)}>
                        Edit
                      </DropdownMenu.Item>
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
                      <DropdownMenu.Item
                        iconBefore="solid-chart-bar"
                        onClick={() => onAnalytics(link.id)}>
                        Analytics
                      </DropdownMenu.Item>
                      <DropdownMenu.Item
                        disabled={!isDeleteEnabled}
                        iconBefore="solid-trash-alt"
                        color="danger"
                        onClick={() => {
                          onDelete(link.id);
                        }}>
                        Delete
                      </DropdownMenu.Item>
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
