import { useField } from 'formik';
import * as Yup from 'yup';
import { Formik, Form, FormikHelpers } from 'formik';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

const CreateLinkSchema = Yup.object().shape({
  alias: Yup.string()
    .matches(/^[a-z0-9//]+$/i)
    .max(24, 'Too long for an alias.')
    .required('An alias is required.'),
  url: Yup.string()
    .url('It must be a valid url.')
    .required('An url is required.'),
});

interface LinkFormValues {
  alias: string;
  url: string;
}

interface Props {
  onSubmit: (
    values: LinkFormValues,
    helpers: FormikHelpers<LinkFormValues>
  ) => void | Promise<void>;
  initialValues?: LinkFormValues;
  children?: React.ReactNode;
}

interface FormikInputProps {
  name: string;
  label: string;
  type?: string;
  required?: boolean;
}

const FormikInput: React.FC<FormikInputProps> = ({
  name,
  label,
  type = 'text',
  required,
}) => {
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

export const Fields = () => {
  return (
    <div className="flex flex-col gap-4">
      <FormikInput name="alias" label="Alias" required />
      <FormikInput name="url" label="Url" type="url" required />
    </div>
  );
};

export const FormWrapper: React.FC<Props> = ({
  onSubmit,
  children,
  initialValues = {
    alias: '',
    url: '',
  },
}) => {
  return (
    <Formik
      onSubmit={(values, form) => {
        onSubmit(values, form);
      }}
      validationSchema={CreateLinkSchema}
      initialValues={initialValues}
    >
      <Form>{children}</Form>
    </Formik>
  );
};
