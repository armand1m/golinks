import { useField } from 'formik';
import * as Yup from 'yup';
import { Formik, Form, FormikHelpers } from 'formik';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Lock, Plus, X } from 'lucide-react';
import { useState } from 'react';

const MAX_ALIAS_LENGTH = 24;

const CreateLinkSchema = Yup.object().shape({
  alias: Yup.string()
    .matches(/^[a-z0-9//]+$/i)
    .max(MAX_ALIAS_LENGTH, 'Too long for an alias.')
    .required('An alias is required.'),
  url: Yup.string()
    .url('It must be a valid url.')
    .required('An url is required.'),
  isPrivate: Yup.boolean().default(false),
});

interface LinkFormValues {
  alias: string;
  url: string;
  isPrivate: boolean;
}

interface AllowedEmail {
  id: string;
  email: string;
}

interface PrivateLinkFieldsProps {
  isAuthEnabled?: boolean;
  isAuthenticated?: boolean;
  linkAllowedEmails?: AllowedEmail[];
  onAddAllowedEmail?: (email: string) => void | Promise<void>;
  onRemoveAllowedEmail?: (emailId: string) => void | Promise<void>;
}

const PrivateLinkFields: React.FC<PrivateLinkFieldsProps> = ({
  isAuthEnabled,
  isAuthenticated,
  linkAllowedEmails = [],
  onAddAllowedEmail,
  onRemoveAllowedEmail,
}) => {
  const [field] = useField({ name: 'isPrivate', type: 'checkbox' });
  const [newEmail, setNewEmail] = useState('');

  if (!isAuthEnabled || !isAuthenticated) return null;

  const handleAddEmail = () => {
    const trimmed = newEmail.trim().toLowerCase();
    if (trimmed && onAddAllowedEmail) {
      onAddAllowedEmail(trimmed);
      setNewEmail('');
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="isPrivate"
          name="isPrivate"
          checked={field.value}
          onChange={field.onChange}
          onBlur={field.onBlur}
          className="h-4 w-4 rounded border-input"
        />
        <Label
          htmlFor="isPrivate"
          className="flex items-center gap-1.5 cursor-pointer"
        >
          <Lock className="h-3.5 w-3.5" />
          Private link
        </Label>
      </div>

      {field.value && (
        <div className="space-y-2 pl-6">
          <p className="text-sm text-muted-foreground">
            Only you and the specified users can view and access this
            link.
          </p>
          <div className="flex gap-2">
            <Input
              placeholder="user@example.com"
              value={newEmail}
              onChange={(e) => setNewEmail(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  e.preventDefault();
                  handleAddEmail();
                }
              }}
              type="email"
              className="flex-1"
            />
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleAddEmail}
              disabled={!newEmail.trim()}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          {linkAllowedEmails.length > 0 && (
            <div className="flex flex-wrap gap-1.5">
              {linkAllowedEmails.map((allowed) => (
                <span
                  key={allowed.id}
                  className="inline-flex items-center gap-1 rounded-md bg-secondary px-2 py-1 text-xs"
                >
                  {allowed.email}
                  {onRemoveAllowedEmail && (
                    <button
                      type="button"
                      onClick={() => onRemoveAllowedEmail(allowed.id)}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  )}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export const Fields: React.FC<PrivateLinkFieldsProps> = (props) => {
  return (
    <div className="flex flex-col gap-4">
      <FormikInput name="alias" label="Alias" required />
      <FormikInput name="url" label="Url" type="url" required />
      <PrivateLinkFields {...props} />
    </div>
  );
};

interface FormWrapperProps {
  onSubmit: (
    values: LinkFormValues,
    helpers: FormikHelpers<LinkFormValues>
  ) => void | Promise<void>;
  initialValues?: LinkFormValues;
  children?: React.ReactNode;
}

const FormikInput: React.FC<{
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}> = ({ name, label, type = 'text', required }) => {
  const [field, meta] = useField({ name, type });
  return (
    <div className="space-y-2">
      <Label htmlFor={name}>
        {label}
        {required && ' *'}
      </Label>
      <Input id={name} type={type} {...field} />
      {meta.touched && meta.error && (
        <p className="text-sm text-destructive">{meta.error}</p>
      )}
    </div>
  );
};

export const FormWrapper: React.FC<FormWrapperProps> = ({
  onSubmit,
  children,
  initialValues = {
    alias: '',
    url: '',
    isPrivate: false,
  },
}) => {
  return (
    <Formik
      onSubmit={onSubmit}
      validationSchema={CreateLinkSchema}
      initialValues={initialValues}
    >
      <Form>{children}</Form>
    </Formik>
  );
};
