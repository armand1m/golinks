import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import * as LinkForm from './LinkForm';
import { useAllowedEmails } from '../lib/features/links/use-allowed-emails';
import { Link } from '../lib/__generated__/graphql';

interface EditLinkDialogProps {
  open: boolean;
  editingLink: Link | null;
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (
    values: { alias: string; url: string; isPrivate: boolean },
    form: { resetForm: () => void }
  ) => Promise<void>;
}

export function EditLinkDialog({
  open,
  editingLink,
  isAuthEnabled,
  isAuthenticated,
  isLoading,
  onOpenChange,
  onSubmit,
}: EditLinkDialogProps) {
  const { emails, addEmail, removeEmail, resetEmails } =
    useAllowedEmails();

  const handleOpenChange = (isOpen: boolean) => {
    if (isOpen && editingLink) {
      const allowedEmails =
        (
          editingLink as unknown as {
            linkAllowedEmails?: {
              nodes: { id: string; email: string }[];
            };
          }
        ).linkAllowedEmails?.nodes ?? [];
      resetEmails(allowedEmails);
    }
    onOpenChange(isOpen);
  };

  const handleSubmit = async (
    values: { alias: string; url: string; isPrivate: boolean },
    form: { resetForm: () => void }
  ) => {
    await onSubmit(values, form);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={handleOpenChange}>
      <DialogContent>
        <LinkForm.FormWrapper
          initialValues={
            editingLink
              ? {
                  alias: editingLink.alias,
                  url: editingLink.url,
                  isPrivate:
                    (
                      editingLink as unknown as {
                        isPrivate?: boolean;
                      }
                    ).isPrivate ?? false,
                }
              : undefined
          }
          onSubmit={handleSubmit}
        >
          <DialogHeader>
            <DialogTitle>Edit Link</DialogTitle>
          </DialogHeader>
          <div className="py-4">
            <LinkForm.Fields
              isAuthEnabled={isAuthEnabled}
              isAuthenticated={isAuthenticated}
              linkAllowedEmails={emails}
              onAddAllowedEmail={
                editingLink
                  ? (email: string) => addEmail(editingLink.id, email)
                  : undefined
              }
              onRemoveAllowedEmail={removeEmail}
            />
          </div>
          <DialogFooter className="flex justify-end gap-2">
            <Button
              type="reset"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Save
            </Button>
          </DialogFooter>
        </LinkForm.FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
