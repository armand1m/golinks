import { lazy, Suspense, useState, useEffect, useRef } from 'react';
import { GetServerSideProps, NextApiRequest } from 'next';
import { toast } from 'sonner';
import { useQuery, useMutation, useLazyQuery } from '@apollo/client';

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search } from 'lucide-react';

import { TopNavigation } from '../components/TopNavigation';
import * as LinkForm from '../components/LinkForm';
import {
  Link,
  GetAllLinksDocument,
  CreateLinkDocument,
  CreateLinkAllowedEmailDocument,
  DeleteLinkAllowedEmailDocument,
  DeleteLinkDocument,
  UpdateLinkDocument,
  SearchLinksDocument,
} from '../lib/__generated__/graphql';

const LinkTable = lazy(() => import('../components/LinkTable'));

interface Props {
  logoname: string;
  baseUrl: string;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
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
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingLink, setEditingLink] = useState<Link | null>(null);
  const [editAllowedEmails, setEditAllowedEmails] = useState<
    Array<{ id: string; email: string }>
  >([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const debounceTimerRef =
    useRef<ReturnType<typeof setTimeout>>(undefined);

  const [createLink, createLinkStatus] = useMutation(
    CreateLinkDocument
  );
  const [updateLink] = useMutation(UpdateLinkDocument);
  const [deleteLink] = useMutation(DeleteLinkDocument);
  const [createLinkAllowedEmail] = useMutation(
    CreateLinkAllowedEmailDocument
  );
  const [deleteLinkAllowedEmail] = useMutation(
    DeleteLinkAllowedEmailDocument
  );
  const allLinks = useQuery(GetAllLinksDocument);
  const [searchLinks, searchResults] = useLazyQuery(
    SearchLinksDocument
  );

  useEffect(() => {
    if (debounceTimerRef.current) {
      clearTimeout(debounceTimerRef.current);
    }

    if (searchTerm.trim() === '') {
      setDebouncedSearch('');
      return;
    }

    debounceTimerRef.current = setTimeout(() => {
      setDebouncedSearch(searchTerm);
    }, 300);

    return () => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
    };
  }, [searchTerm]);

  useEffect(() => {
    if (debouncedSearch) {
      searchLinks({ variables: { search: debouncedSearch } });
    }
  }, [debouncedSearch, searchLinks]);

  const canEdit = claims.permissions.includes('update:golinks');
  const canCreate = claims.permissions.includes('create:golinks');
  const canDelete = claims.permissions.includes('delete:golinks');

  const onCreateLink = async (
    values: Pick<Link, 'alias' | 'url'> & { isPrivate: boolean }
  ) => {
    try {
      await createLink({
        variables: {
          alias: values.alias,
          url: values.url,
          isPrivate: values.isPrivate,
          createdByEmail: values.isPrivate ? userEmail : undefined,
        },
      });

      await allLinks.refetch();

      if (debouncedSearch) {
        searchLinks({ variables: { search: debouncedSearch } });
      }

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

  const onEditLink = async (linkId: string) => {
    const links = debouncedSearch
      ? (searchResults.data?.searchLinks?.nodes ?? [])
      : (allLinks.data?.links?.nodes ?? []);
    const link = links.find((l: { id: string }) => l.id === linkId);
    if (!link) return;
    setEditingLink(link);
    setEditAllowedEmails(
      (link as any).linkAllowedEmails?.nodes ?? []
    );
    setEditDialogOpen(true);
  };

  const onUpdateLink = async (
    values: Pick<Link, 'alias' | 'url'> & { isPrivate: boolean }
  ) => {
    if (!editingLink) return;
    try {
      const patch: Record<string, any> = {
        alias: values.alias,
        url: values.url,
      };
      if (values.isPrivate !== (editingLink as any).isPrivate) {
        patch.isPrivate = values.isPrivate;
        if (
          values.isPrivate &&
          !(editingLink as any).createdByEmail
        ) {
          patch.createdByEmail = userEmail;
        }
      }

      await updateLink({
        variables: {
          id: editingLink.id,
          patch,
        },
      });

      await allLinks.refetch();

      if (debouncedSearch) {
        searchLinks({ variables: { search: debouncedSearch } });
      }

      toast.success('Link Updated', {
        description: 'Link was successfully updated.',
      });
    } catch (error) {
      console.error('Failed to update Link, details: ', error);
      toast.error('Failed to update Link', {
        description: 'An unexpected error occurred.',
      });
    }
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

      if (debouncedSearch) {
        searchLinks({ variables: { search: debouncedSearch } });
      }

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
                      <LinkForm.Fields
                        isAuthEnabled={isAuthEnabled}
                        isAuthenticated={isAuthenticated}
                      />
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
            <Dialog
              open={editDialogOpen}
              onOpenChange={(open) => {
                setEditDialogOpen(open);
                if (!open) setEditingLink(null);
              }}
            >
              <DialogContent>
                <LinkForm.FormWrapper
                  initialValues={
                    editingLink
                      ? {
                          alias: editingLink.alias,
                          url: editingLink.url,
                          isPrivate:
                            (editingLink as any).isPrivate ?? false,
                        }
                      : undefined
                  }
                  onSubmit={async (values, form) => {
                    await onUpdateLink(values);
                    setEditDialogOpen(false);
                    setEditingLink(null);
                    setEditAllowedEmails([]);
                    form.resetForm();
                  }}
                >
                  <DialogHeader>
                    <DialogTitle>Edit Link</DialogTitle>
                  </DialogHeader>
                  <div className="py-4">
                    <LinkForm.Fields
                      isAuthEnabled={isAuthEnabled}
                      isAuthenticated={isAuthenticated}
                      linkAllowedEmails={editAllowedEmails}
                      onAddAllowedEmail={async (email) => {
                        if (!editingLink) return;
                        try {
                          const result = await createLinkAllowedEmail(
                            {
                              variables: {
                                linkId: editingLink.id,
                                email,
                              },
                            }
                          );
                          const newEntry =
                            result.data?.createLinkAllowedEmail
                              ?.linkAllowedEmail;
                          if (newEntry) {
                            setEditAllowedEmails((prev) => [
                              ...prev,
                              {
                                id: newEntry.id,
                                email: newEntry.email,
                              },
                            ]);
                          }
                        } catch (error) {
                          console.error(
                            'Failed to add allowed email:',
                            error
                          );
                          toast.error('Failed to add email', {
                            description:
                              'An unexpected error occurred.',
                          });
                        }
                      }}
                      onRemoveAllowedEmail={async (emailId) => {
                        try {
                          await deleteLinkAllowedEmail({
                            variables: { id: emailId },
                          });
                          setEditAllowedEmails((prev) =>
                            prev.filter((e) => e.id !== emailId)
                          );
                        } catch (error) {
                          console.error(
                            'Failed to remove allowed email:',
                            error
                          );
                          toast.error('Failed to remove email', {
                            description:
                              'An unexpected error occurred.',
                          });
                        }
                      }}
                    />
                  </div>
                  <DialogFooter className="flex justify-end gap-2">
                    <Button
                      type="reset"
                      variant="outline"
                      onClick={() => {
                        setEditDialogOpen(false);
                        setEditingLink(null);
                      }}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={allLinks.loading}>
                      Save
                    </Button>
                  </DialogFooter>
                </LinkForm.FormWrapper>
              </DialogContent>
            </Dialog>
          </div>

          {(allLinks.loading || searchResults.loading) && <Loader />}

          {!allLinks.loading && (
            <Suspense fallback={<Loader />}>
              <LinkTable
                baseUrl={baseUrl}
                links={
                  debouncedSearch
                    ? (searchResults.data?.searchLinks?.nodes ?? [])
                    : (allLinks.data?.links?.nodes ?? [])
                }
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
      userEmail: user?.email || null,
    },
  };
};
