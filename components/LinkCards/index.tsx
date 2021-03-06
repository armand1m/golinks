import {
  Box,
  Label,
  Text,
  Link as FannyLink,
  Button,
  Set,
  Icon,
  Stack,
  Card,
} from 'bumbag';
import { GetAllLinksQuery } from '../../lib/queries/getAllLinks.graphql';
import { LinkMetricUsageGraph } from '../LinkMetricUsageGraph';

interface Props {
  data: GetAllLinksQuery;
  isDeleteEnabled: boolean;
  isEditEnabled: boolean;
  onDelete: (linkId: string) => void | Promise<void>;
  onShare: (linkUrl: string) => void | Promise<void>;
  onAnalytics: (linkId: string) => void | Promise<void>;
  onEdit: (linkId: string) => void | Promise<void>;
  isDeleting: boolean;
}

export const LinkCards: React.FC<Props> = ({
  data,
  isDeleteEnabled,
  // isEditEnabled,
  onDelete,
  // onEdit,
  onShare,
  // onAnalytics,
  isDeleting,
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
    <Stack direction="column">
      {links?.nodes.map((link) => {
        return (
          <Card
            key={link.id}
            title={link.alias}
            headerAddon={
              <Set>
                <Button
                  size="small"
                  palette="primary"
                  onClick={() => {
                    const url = new URL(
                      link.alias,
                      document.location.origin
                    ).toString();
                    onShare(url);
                  }}>
                  <Icon icon="solid-share" />
                </Button>
                {isDeleteEnabled && (
                  <Button
                    size="small"
                    palette="danger"
                    isLoading={isDeleting}
                    onClick={() => {
                      onDelete(link.id);
                    }}>
                    <Icon icon="solid-trash-alt" />
                  </Button>
                )}
              </Set>
            }>
            <Stack spacing="major-2">
              <Set
                orientation="vertical"
                spacing="minor-1"
                style={{ lineBreak: 'anywhere' }}>
                <Label>URL</Label>
                <FannyLink href={link.url}>{link.url}</FannyLink>
              </Set>

              <Set orientation="vertical" spacing="minor-1">
                <Label>Month Usage</Label>
                <LinkMetricUsageGraph
                  linkUsageMetrics={link.linkUsageMetrics.nodes}
                />
              </Set>
            </Stack>
          </Card>
        );
      })}
    </Stack>
  );
};

export default LinkCards;
