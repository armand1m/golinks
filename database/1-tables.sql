CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

DROP TABLE IF EXISTS public.links CASCADE;
CREATE TABLE public.links (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
	alias VARCHAR ( 50 ) UNIQUE NOT NULL,
	url VARCHAR ( 255 ) NOT NULL, 
	created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

comment on table public.links is 'A link alias posted by an user.';
comment on column public.links.id is 'The id for a link alias.';
comment on column public.links.alias is 'The alias for an url. It must be unique.';
comment on column public.links.url is 'The link alias url.';
comment on column public.links.created_at is 'The time this link alias was created.';

DROP TABLE IF EXISTS public.link_usage_metrics CASCADE;
CREATE TABLE public.link_usage_metrics (
	id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  link_id uuid NOT NULL REFERENCES public.links ON DELETE CASCADE,
	accessed_at TIMESTAMP NOT NULL DEFAULT NOW()
);

CREATE INDEX ON public.link_usage_metrics (link_id);

comment on table public.link_usage_metrics is 'A link usage metric posted by the application when a link is accessed.';
comment on column public.link_usage_metrics.id is 'The id for this metric record.';
comment on column public.link_usage_metrics.link_id is 'The id of the link being accessed.';
comment on column public.link_usage_metrics.accessed_at is 'The time this link was accessed.';
