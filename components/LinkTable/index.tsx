import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Button } from '@/components/ui/button';
import { Pencil, Share2, Trash2 } from 'lucide-react';
import { GetAllLinksQuery } from '../../lib/__generated__/graphql';
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
      <div>
        <p>There are no golinks available.</p>
      </div>
    );
  }

  return (
    <div className="w-full overflow-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Alias</TableHead>
            <TableHead>Destination</TableHead>
            <TableHead className="text-center">Month Usage</TableHead>
            <TableHead className="text-center">Total Usage</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {links?.nodes.map((link) => (
            <TableRow key={link.id}>
              <TableCell>
                <a
                  href={new URL(link.alias, baseUrl).href}
                  className="block max-w-[350px] truncate text-primary underline"
                >
                  {link.alias}
                </a>
              </TableCell>
              <TableCell>
                <a
                  href={link.url}
                  className="block max-w-[350px] truncate text-primary underline"
                >
                  {link.url}
                </a>
              </TableCell>
              <TableCell className="text-center">
                <LinkMetricUsageGraph
                  linkUsageMetrics={link.recentUsageMetrics.nodes}
                />
              </TableCell>
              <TableCell className="text-center">
                {link.linkUsageMetrics.totalCount}
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button size="sm" variant="ghost">
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {isEditEnabled && (
                      <DropdownMenuItem
                        onClick={() => onEdit(link.id)}
                      >
                        <Pencil className="mr-2 h-4 w-4" />
                        Edit
                      </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                      onClick={() => {
                        const url = new URL(
                          link.alias,
                          document.location.origin
                        ).toString();
                        onShare(url);
                      }}
                    >
                      <Share2 className="mr-2 h-4 w-4" />
                      Share
                    </DropdownMenuItem>
                    {isDeleteEnabled && (
                      <DropdownMenuItem
                        className="text-destructive"
                        onClick={() => onDelete(link.id)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};

export default LinkTable;
