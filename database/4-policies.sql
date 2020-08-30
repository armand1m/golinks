CREATE POLICY read_links
  ON public.links
  FOR SELECT
  USING (
    has_permission('read:golinks')
  );

CREATE POLICY update_links
  ON public.links
  FOR UPDATE
  USING (
    has_permission('update:golinks')
  )
  WITH CHECK (
    has_permission('update:golinks')
  );

CREATE POLICY create_links
  ON public.links
  FOR INSERT
  WITH CHECK (
    has_permission('create:golinks')
  );

CREATE POLICY delete_links
  ON public.links
  FOR DELETE
  USING (
    has_permission('delete:golinks')
  );

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.links FORCE ROW LEVEL SECURITY;

GRANT ALL ON public.links TO postgraphile;

CREATE POLICY read_link_metric
  ON public.link_usage_metrics
  FOR SELECT
  USING (
    has_permission('read:golinks')
  );

CREATE POLICY create_link_metric
  ON public.link_usage_metrics
  FOR INSERT
  WITH CHECK (
    has_permission('read:golinks')
  );

ALTER TABLE public.link_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_usage_metrics FORCE ROW LEVEL SECURITY;

GRANT ALL ON public.link_usage_metrics TO postgraphile;

GRANT ALL on schema public TO postgraphile;