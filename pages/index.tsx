import { lazy, Suspense, useState } from 'react';
import { GetServerSideProps, NextApiRequest } from 'next';
import { toast } from 'sonner';
import { useQuery, useMutation } from '@apollo/client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

import { TopNavigation } from '../components/TopNavigation';
import * as LinkForm from '../components/LinkForm';
import {
  Link,
  GetAllLinksDocument,
  CreateLinkDocument,
  DeleteLinkDocument,
} from '../lib/__generated__/graphql';

const LinkTable = lazy(() => import('../components/LinkTable'));

interface Props {
  logoname: string;
  baseUrl: string;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
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
}) => {
  const [dialogOpen, setDialogOpen] = useState(false);

  const [createLink, createLinkStatus] = useMutation(CreateLinkDocument);
  const [deleteLink] = useMutation(DeleteLinkDocument);
  const allLinks = useQuery(GetAllLinksDocument);

  const canEdit = claims.permissions.includes('update:golinks');
  const canCreate = claims.permissions.includes('create:golinks');
  const canDelete = claims.permissions.includes('delete:golinks');

  const onCreateLink = async (
    values: Pick<Link, 'alias' | 'url'>
  ) => {
    try {
      await createLink({
        variables: values,
      });

      await allLinks.refetch();

      toast.success('Link Created', {
        description: 'Link was successfully created.',
      });
    } catch (error) {
      console.error('Failed to create Link, details: ', error);
      toast.error('Failed to create Link', {
        description: 'An unexpected error occurred.',
      });
    }
  };

  const onEditLink = async (_linkId: string) => {
    /** Open EditLinkForm with data prefilled. */
  };

  const onShareLink = async (linkUrl: string) => {
    try {
      if (navigator.clipboard) {
        await navigator.clipboard.writeText(linkUrl);
      } else {
        const textarea = document.createElement('textarea');
        textarea.value = linkUrl;
        textarea.style.position = 'fixed';
        textarea.style.opacity = '0';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
      }

      toast.success('Link Copied', {
        description: 'Link is in your clipboard.',
      });
    } catch (error) {
      console.error(
        'Failed to copy Link to the clipboard, details: ',
        error
      );
      toast.error('Failed to copy Link', {
        description: 'An unexpected error occurred.',
      });
    }
  };

  const onDeleteLink = async (linkId: string) => {
    try {
      await deleteLink({
        variables: {
          id: linkId,
        },
      });

      await allLinks.refetch();

      toast.success('Link Deleted', {
        description: 'Link was successfully deleted.',
      });
    } catch (error) {
      console.error('Failed to delete Link, details: ', error);
      toast.error('Failed to delete Link', {
        description: 'An unexpected error occurred.',
      });
    }
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
            {canCreate && (
              <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogTrigger asChild>
                  <Button>Create</Button>
                </DialogTrigger>
                <DialogContent>
                  <LinkForm.FormWrapper
                    initialValues={undefined}
                    onSubmit={async (values, form) => {
                      await onCreateLink(values);
                      setDialogOpen(false);
                      form.resetForm();
                    }}
                  >
                    <DialogHeader>
                      <DialogTitle>Create Link</DialogTitle>
                    </DialogHeader>
                    <div className="py-4">
                      <LinkForm.Fields />
                    </div>
                    <DialogFooter className="flex justify-end gap-2">
                      <Button
                        type="reset"
                        variant="outline"
                        onClick={() => setDialogOpen(false)}
                      >
                        Cancel
                      </Button>
                      <Button
                        type="submit"
                        disabled={
                          createLinkStatus.loading || allLinks.loading
                        }
                      >
                        Create
                      </Button>
                    </DialogFooter>
                  </LinkForm.FormWrapper>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {allLinks.loading && <Loader />}

          {allLinks.data !== undefined && allLinks.data !== null && (
            <Suspense fallback={<Loader />}>
              <LinkTable
                baseUrl={baseUrl}
                data={allLinks.data}
                isEditEnabled={canEdit}
                isDeleteEnabled={canDelete}
                onEdit={onEditLink}
                onShare={onShareLink}
                onDelete={onDeleteLink}
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
  const { Config } = await import('../lib/config');
  const request = context?.req as NextApiRequest;
  const { claims, user } = await getUserClaimsFromRequest(request);
  const logoname = Config.metadata.logoname;
  const baseUrl = Config.metadata.baseUrl;
  const isAuthEnabled = Config.features.auth0;
  const isAuthenticated = user !== null;

  return {
    props: {
      claims,
      logoname,
      baseUrl,
      isAuthEnabled,
      isAuthenticated,
    },
  };
};
