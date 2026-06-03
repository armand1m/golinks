import { toast } from 'sonner';

interface ToastMessage {
  title: string;
  description: string;
}

export async function withMutationFeedback(
  mutation: () => Promise<unknown>,
  success: ToastMessage,
  error: ToastMessage
): Promise<void> {
  try {
    await mutation();
    toast.success(success.title, {
      description: success.description,
    });
  } catch (err) {
    console.error(`${error.title}: `, err);
    toast.error(error.title, { description: error.description });
  }
}
