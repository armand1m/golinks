import { toast } from 'sonner';
import { apolloLogger } from '../apollo-logger';

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
    apolloLogger.error('mutation.failed', {
      title: error.title,
      error: err instanceof Error ? err.message : String(err),
    });
    toast.error(error.title, { description: error.description });
  }
}
