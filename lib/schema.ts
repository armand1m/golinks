import { makeExecutableSchema } from '@graphql-tools/schema';
import typeDefs from './type-defs.graphqls';

export const schema = makeExecutableSchema({
  typeDefs,
});
