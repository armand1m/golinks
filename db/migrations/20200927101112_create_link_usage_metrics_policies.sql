-- migrate:up
CREATE POLICY read_link_usage_metric
  ON public.link_usage_metrics
  FOR SELECT
  USING (
    has_permission('read:golinks')
  );

CREATE POLICY create_link_usage_metric
  ON public.link_usage_metrics
  FOR INSERT
  WITH CHECK (
    has_permission('read:golinks')
  );

ALTER TABLE public.link_usage_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_usage_metrics FORCE ROW LEVEL SECURITY;
GRANT ALL ON public.link_usage_metrics TO postgraphile;

-- migrate:down
DROP POLICY read_link_usage_metric ON public.link_usage_metrics;
DROP POLICY create_link_usage_metric ON public.link_usage_metrics;

ALTER TABLE IF EXISTS public.link_usage_metrics DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.link_usage_metrics FROM postgraphile;