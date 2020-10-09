-- migrate:up
GRANT ALL on schema public TO postgraphile;

-- migrate:down
REVOKE ALL on schema public FROM postgraphile;
