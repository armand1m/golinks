import {
  Link,
  Stack,
  FieldStack,
  Button,
  InputField,
} from 'bumbag'
import * as Yup from 'yup';
import { Formik, Form, Field, FormikHelpers } from "formik";

const CreateLinkSchema = Yup.object().shape({
  alias: Yup.string()
    .matches(/^[a-z0-9]+$/i)
    .max(24, 'Too long for an alias.')
    .required('An alias is required.'),
  url: Yup.string()
    .url("It must be a valid url.")
    .required('An url is required.'),
});

interface Link {
  alias: string;
  url: string;
};

interface Props {
  onSubmit: (values: Link, helpers: FormikHelpers<Link>) => void | Promise<void>;
}

export const CreateLinkForm: React.FC<Props> = ({
  onSubmit
}) => {
  return (
    <Formik
      onSubmit={(values, form) => {
        onSubmit(values, form);
      }}
      validationSchema={CreateLinkSchema}
      initialValues={{
        alias: "",
        url: "",
      }}
    >
      <Form>
        <FieldStack>
          <Field
            component={InputField.Formik}
            name="alias"
            label="Alias"
            required
          />

          <Field
            component={InputField.Formik}
            name="url"
            label="Url"
            type="url"
            required
          />

          <Button type="submit">Create</Button>
        </FieldStack>
      </Form>
    </Formik>
  )
}
