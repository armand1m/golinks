import { lazy, Suspense, useState } from 'react';
import { GetServerSideProps, NextApiRequest } from 'next';

import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

import { TopNavigation } from '../components/TopNavigation';
import { CreateLinkDialog } from '../components/CreateLinkDialog';
import { EditLinkDialog } from '../components/EditLinkDialog';
import { Link } from '../lib/__generated__/graphql';
import { useLinkSearch } from '../lib/features/links/use-link-search';
import { useLinkMutations } from '../lib/features/links/use-link-mutations';
import {
  getCommonPageProps,
  CommonPageProps,
} from '../lib/utils/get-common-server-side-props';

const LinkTable = lazy(() => import('../components/LinkTable'));

interface Props extends CommonPageProps {
  userEmail?: string | null;
  claims: {
    permissions: string[];
  };
}

const Loader = () => (
  <div className="flex justify-center">
    <svg
      className="h-6 w-6 animate-spin text-primary"
      xmlns="http://www.w3.org/2000/svg"
      fill="none"
      viewBox="0 0 24 24"
    >
      <circle
        className="opacity-25"
        cx="12"
        cy="12"
        r="10"
        stroke="currentColor"
        strokeWidth="4"
      />
      <path
        className="opacity-75"
        fill="currentColor"
        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
      />
    </svg>
  </div>
);

const Index: React.FC<Props> = ({
  logoname,
  baseUrl,
  claims,
  isAuthEnabled,
  isAuthenticated,
  userEmail,
}) => {
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);

  const {
    searchTerm,
    setSearchTerm,
    debouncedSearch,
    searchLinks,
    searchResults,
  } = useLinkSearch();
  const { allLinks, createLink, updateLink, deleteLink, shareLink } =
    useLinkMutations({ debouncedSearch, searchLinks, userEmail });

  const canEdit = claims.permissions.includes('update:golinks');
  const canCreate = claims.permissions.includes('create:golinks');
  const canDelete = claims.permissions.includes('delete:golinks');

  const links = debouncedSearch
    ? (searchResults.data?.searchLinks?.nodes ?? [])
    : (allLinks.data?.links?.nodes ?? []);

  const handleEdit = (linkId: string) => {
    const link = links.find((l: { id: string }) => l.id === linkId);
    if (!link) return;
    setEditingLink(link);
    setEditDialogOpen(true);
  };

  const handleUpdate = async (
    values: { alias: string; url: string; isPrivate: boolean },
    form: { resetForm: () => void }
  ) => {
    if (!editingLink) return;
    await updateLink(editingLink.id, values, {
      isPrivate: editingLink.isPrivate,
      createdByEmail: editingLink.createdByEmail,
    });
    form.resetForm();
  };

  return (
    <div className="min-h-screen">
      <TopNavigation
        logoname={logoname}
        baseUrl={baseUrl}
        isAuthEnabled={isAuthEnabled}
        isAuthenticated={isAuthenticated}
      />
      <div className="mx-auto max-w-7xl p-6">
        <div className="flex flex-col gap-4">
          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search links..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-9"
              />
            </div>
            {canCreate && (
              <CreateLinkDialog
                isAuthEnabled={isAuthEnabled}
                isAuthenticated={isAuthenticated}
                isLoading={allLinks.loading}
                onSubmit={createLink}
              />
            )}
            <EditLinkDialog
              open={editDialogOpen}
              editingLink={editingLink}
              isAuthEnabled={isAuthEnabled}
              isAuthenticated={isAuthenticated}
              isLoading={allLinks.loading}
              onOpenChange={(open) => {
                setEditDialogOpen(open);
                if (!open) setEditingLink(null);
              }}
              onSubmit={handleUpdate}
            />
          </div>

          {(allLinks.loading || searchResults.loading) && <Loader />}

          {!allLinks.loading && (
            <Suspense fallback={<Loader />}>
              <LinkTable
                baseUrl={baseUrl}
                links={links}
                isEditEnabled={canEdit}
                isDeleteEnabled={canDelete}
                onEdit={handleEdit}
                onShare={shareLink}
                onDelete={deleteLink}
              />
            </Suspense>
          )}
        </div>
      </div>
    </div>
  );
};

export default Index;

export const getServerSideProps: GetServerSideProps<Props> = async (
  context
) => {
  const { getUserClaimsFromRequest } = await import('../lib/auth');
  const request = context?.req as NextApiRequest;
  const { claims, user } = await getUserClaimsFromRequest(request);
  const common = await getCommonPageProps(context);

  return {
    props: {
      ...common,
      claims,
      userEmail: user?.email || null,
    },
  };
};
