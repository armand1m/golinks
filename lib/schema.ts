import { makeExecutableSchema } from 'graphql-tools';
import typeDefs from './type-defs.graphqls';

export const schema = makeExecutableSchema({
  typeDefs,
});
