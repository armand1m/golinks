-- migrate:up
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

-- migrate:down
DROP POLICY read_links ON public.links;
DROP POLICY update_links ON public.links;
DROP POLICY create_links ON public.links;
DROP POLICY delete_links ON public.links;

ALTER TABLE IF EXISTS public.links DISABLE ROW LEVEL SECURITY;
REVOKE ALL ON public.links FROM postgraphile;