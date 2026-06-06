import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  CreateLinkAllowedEmailDocument,
  DeleteLinkAllowedEmailDocument,
} from '../../__generated__/graphql';
import { TOAST } from '../../utils/toast-messages';
import { apolloLogger } from '../../apollo-logger';

export interface AllowedEmail {
  id: string;
  email: string;
}

export function useAllowedEmails(initialEmails: AllowedEmail[] = []) {
  const [emails, setEmails] = useState<AllowedEmail[]>(initialEmails);
  const [addAllowedEmail] = useMutation(
    CreateLinkAllowedEmailDocument
  );
  const [removeAllowedEmail] = useMutation(
    DeleteLinkAllowedEmailDocument
  );

  const addEmail = async (linkId: string, email: string) => {
    try {
      const result = await addAllowedEmail({
        variables: { linkId, email },
      });
      const newEntry =
        result.data?.createLinkAllowedEmail?.linkAllowedEmail;
      if (newEntry) {
        setEmails((prev) => [
          ...prev,
          { id: newEntry.id, email: newEntry.email },
        ]);
      }
    } catch (error) {
      apolloLogger.error('allowedEmail.add.failed', {
        linkId,
        email,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(TOAST.EMAIL_ADD_FAILED.title, {
        description: TOAST.EMAIL_ADD_FAILED.description,
      });
    }
  };

  const removeEmail = async (emailId: string) => {
    try {
      await removeAllowedEmail({ variables: { id: emailId } });
      setEmails((prev) => prev.filter((e) => e.id !== emailId));
    } catch (error) {
      apolloLogger.error('allowedEmail.remove.failed', {
        emailId,
        error: error instanceof Error ? error.message : String(error),
      });
      toast.error(TOAST.EMAIL_REMOVE_FAILED.title, {
        description: TOAST.EMAIL_REMOVE_FAILED.description,
      });
    }
  };

  const resetEmails = (newEmails: AllowedEmail[]) => {
    setEmails(newEmails);
  };

  return {
    emails,
    addEmail,
    removeEmail,
    resetEmails,
  };
}
