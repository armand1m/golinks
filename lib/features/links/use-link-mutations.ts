import { useMutation, useQuery } from '@apollo/client';
import {
  GetAllLinksDocument,
  CreateLinkDocument,
  UpdateLinkDocument,
  DeleteLinkDocument,
} from '../../__generated__/graphql';
import { copyToClipboard } from '../../utils/copy-to-clipboard';
import { withMutationFeedback } from '../../utils/mutation-feedback';
import { TOAST } from '../../utils/toast-messages';

interface UseLinkMutationsOptions {
  debouncedSearch: string;
  searchLinks: (options: {
    variables: { search: string };
  }) => Promise<unknown>;
  userEmail?: string | null;
}

export function useLinkMutations({
  debouncedSearch,
  searchLinks,
  userEmail,
}: UseLinkMutationsOptions) {
  const [createLinkMutation] = useMutation(CreateLinkDocument);
  const [updateLinkMutation] = useMutation(UpdateLinkDocument);
  const [deleteLinkMutation] = useMutation(DeleteLinkDocument);
  const allLinks = useQuery(GetAllLinksDocument);

  const refetchLinks = async () => {
    await allLinks.refetch();
    if (debouncedSearch) {
      searchLinks({ variables: { search: debouncedSearch } });
    }
  };

  const createLink = async (values: {
    alias: string;
    url: string;
    isPrivate: boolean;
  }) => {
    await withMutationFeedback(
      async () => {
        await createLinkMutation({
          variables: {
            alias: values.alias,
            url: values.url,
            isPrivate: values.isPrivate,
            createdByEmail: values.isPrivate ? userEmail : undefined,
          },
        });
        await refetchLinks();
      },
      TOAST.LINK_CREATED,
      TOAST.LINK_CREATE_FAILED
    );
  };

  const updateLink = async (
    id: string,
    values: { alias: string; url: string; isPrivate: boolean },
    previousValues?: {
      isPrivate: boolean;
      createdByEmail?: string | null;
    }
  ) => {
    const patch: Record<string, unknown> = {
      alias: values.alias,
      url: values.url,
    };

    if (
      previousValues &&
      values.isPrivate !== previousValues.isPrivate
    ) {
      patch.isPrivate = values.isPrivate;
      if (values.isPrivate && !previousValues.createdByEmail) {
        patch.createdByEmail = userEmail;
      }
    }

    await withMutationFeedback(
      async () => {
        await updateLinkMutation({
          variables: { id, patch },
        });
        await refetchLinks();
      },
      TOAST.LINK_UPDATED,
      TOAST.LINK_UPDATE_FAILED
    );
  };

  const deleteLink = async (id: string) => {
    await withMutationFeedback(
      async () => {
        await deleteLinkMutation({ variables: { id } });
        await refetchLinks();
      },
      TOAST.LINK_DELETED,
      TOAST.LINK_DELETE_FAILED
    );
  };

  const shareLink = async (linkUrl: string) => {
    await withMutationFeedback(
      async () => {
        await copyToClipboard(linkUrl);
      },
      TOAST.LINK_COPIED,
      TOAST.LINK_COPY_FAILED
    );
  };

  return {
    allLinks,
    createLink,
    updateLink,
    deleteLink,
    shareLink,
  };
}
