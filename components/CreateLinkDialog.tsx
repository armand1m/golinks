import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import * as LinkForm from './LinkForm';

interface CreateLinkDialogProps {
  isAuthEnabled: boolean;
  isAuthenticated: boolean;
  isLoading: boolean;
  onSubmit: (values: {
    alias: string;
    url: string;
    isPrivate: boolean;
  }) => Promise<void>;
}

export function CreateLinkDialog({
  isAuthEnabled,
  isAuthenticated,
  isLoading,
  onSubmit,
}: CreateLinkDialogProps) {
  const [open, setOpen] = useState(false);

  const handleSubmit = async (
    values: { alias: string; url: string; isPrivate: boolean },
    form: { resetForm: () => void }
  ) => {
    await onSubmit(values);
    setOpen(false);
    form.resetForm();
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>Create</Button>
      </DialogTrigger>
      <DialogContent>
        <LinkForm.FormWrapper
          initialValues={undefined}
          onSubmit={handleSubmit}
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
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              Create
            </Button>
          </DialogFooter>
        </LinkForm.FormWrapper>
      </DialogContent>
    </Dialog>
  );
}
