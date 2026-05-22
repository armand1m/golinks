import type { CodegenConfig } from '@graphql-codegen/cli';

const config: CodegenConfig = {
  schema: 'lib/type-defs.graphqls',
  documents: ['lib/queries/**/*.graphql', 'lib/mutations/**/*.graphql'],
  generates: {
    './lib/__generated__/graphql.ts': {
      plugins: [
        'typescript',
        'typescript-operations',
        'typed-document-node',
      ],
    },
  },
  config: {
    enumsAsConst: true,
  },
};

export default config;
