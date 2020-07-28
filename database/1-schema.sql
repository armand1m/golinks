CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Create links table
DROP TABLE IF EXISTS links CASCADE;
CREATE TABLE public.links (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	alias VARCHAR ( 50 ) UNIQUE NOT NULL,
	url VARCHAR ( 255 ) NOT NULL,
    usage INT NOT NULL DEFAULT 0, 
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Add comments to links table and fields
comment on table public.links is 'A link alias posted by an user.';
comment on column public.links.id is 'The id for a link alias.';
comment on column public.links.alias is 'The alias for an url. It must be unique.';
comment on column public.links.url is 'The link alias url.';
comment on column public.links.usage is 'The amount of times someone accessed through this link alias.';
comment on column public.links.created_at is 'The time this link alias was created.';
