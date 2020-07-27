CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create app_public schema
DROP SCHEMA IF EXISTS app_public CASCADE;
CREATE SCHEMA app_public;

-- Create links table
DROP TABLE IF EXISTS links CASCADE;
CREATE TABLE app_public.links (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	alias VARCHAR ( 50 ) UNIQUE NOT NULL,
	url VARCHAR ( 255 ) NOT NULL,
    usage INT NOT NULL DEFAULT 0, 
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

comment on table app_public.links is 'A link alias posted by an user.';
comment on column app_public.links.id is 'The id for a link alias.';
comment on column app_public.links.alias is 'The alias for an url. It must be unique.';
comment on column app_public.links.url is 'The link alias url.';
comment on column app_public.links.usage is 'The amount of times someone accessed through this link alias.';
comment on column app_public.links.created_at is 'The time this link alias was created.';
