-- migrate:up
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- migrate:down
DROP EXTENSION "uuid-ossp";