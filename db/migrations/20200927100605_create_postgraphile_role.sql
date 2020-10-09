-- migrate:up
CREATE ROLE postgraphile;

-- migrate:down
DROP ROLE postgraphile;