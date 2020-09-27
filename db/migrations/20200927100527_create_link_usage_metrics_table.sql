-- migrate:up
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

-- migrate:down
DROP TABLE public.link_usage_metrics CASCADE;
