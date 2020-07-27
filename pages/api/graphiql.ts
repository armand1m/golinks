export const config = {
  api: {
    bodyParser: false,
    externalResolver: true,
  },
}

export { graphqlInstance as default } from '../../lib/graphql';
