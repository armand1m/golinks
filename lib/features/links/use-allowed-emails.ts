import { useState } from 'react';
import { useMutation } from '@apollo/client';
import { toast } from 'sonner';
import {
  CreateLinkAllowedEmailDocument,
  DeleteLinkAllowedEmailDocument,
} from '../../__generated__/graphql';
import { TOAST } from '../../utils/toast-messages';

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
      console.error('Failed to add allowed email:', error);
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
      console.error('Failed to remove allowed email:', error);
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
