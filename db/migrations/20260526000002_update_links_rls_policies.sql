-- migrate:up

-- Helper to get current user email from JWT claims (mirrors get_current_permissions pattern)
CREATE FUNCTION public.get_current_email() RETURNS VARCHAR(255)
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT nullif(current_setting('jwt.claims.email', true), '')::VARCHAR(255);
$$;

-- Helper to check if current user can access a specific link
CREATE FUNCTION public.can_access_link(link_row public.links) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  SELECT CASE
    WHEN NOT link_row.is_private THEN
      public.has_permission('read:golinks')
    ELSE
      public.has_permission('read:golinks')
      AND (
        link_row.created_by_email IS NOT NULL
        AND link_row.created_by_email = public.get_current_email()
        OR
        EXISTS (
          SELECT 1
          FROM public.link_allowed_emails lae
          WHERE lae.link_id = link_row.id
            AND lae.email = public.get_current_email()
        )
      )
  END;
$$;

-- Replace links RLS policies

DROP POLICY read_links ON public.links;
CREATE POLICY read_links
  ON public.links FOR SELECT
  USING (public.can_access_link(links));

DROP POLICY create_links ON public.links;
CREATE POLICY create_links
  ON public.links FOR INSERT
  WITH CHECK (
    public.has_permission('create:golinks')
    AND (
      NOT links.is_private
      OR (
        links.is_private
        AND links.created_by_email IS NOT NULL
        AND links.created_by_email = public.get_current_email()
      )
    )
  );

DROP POLICY update_links ON public.links;
CREATE POLICY update_links
  ON public.links FOR UPDATE
  USING (
    public.has_permission('update:golinks')
    AND (
      NOT links.is_private
      OR (
        links.is_private
        AND links.created_by_email = public.get_current_email()
      )
    )
  )
  WITH CHECK (
    public.has_permission('update:golinks')
    AND (
      NOT links.is_private
      OR (
        links.is_private
        AND links.created_by_email IS NOT NULL
        AND links.created_by_email = public.get_current_email()
      )
    )
  );

DROP POLICY delete_links ON public.links;
CREATE POLICY delete_links
  ON public.links FOR DELETE
  USING (
    public.has_permission('delete:golinks')
    AND (
      NOT links.is_private
      OR (
        links.is_private
        AND links.created_by_email = public.get_current_email()
      )
    )
  );

-- RLS policies for link_allowed_emails

CREATE POLICY read_link_allowed_emails
  ON public.link_allowed_emails FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.links l
      WHERE l.id = link_allowed_emails.link_id
        AND public.can_access_link(l)
    )
  );

CREATE POLICY create_link_allowed_emails
  ON public.link_allowed_emails FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.links l
      WHERE l.id = link_allowed_emails.link_id
        AND l.is_private = true
        AND l.created_by_email = public.get_current_email()
    )
  );

CREATE POLICY delete_link_allowed_emails
  ON public.link_allowed_emails FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.links l
      WHERE l.id = link_allowed_emails.link_id
        AND l.is_private = true
        AND l.created_by_email = public.get_current_email()
    )
  );

-- migrate:down

-- Restore original links policies
DROP POLICY read_links ON public.links;
DROP POLICY create_links ON public.links;
DROP POLICY update_links ON public.links;
DROP POLICY delete_links ON public.links;

CREATE POLICY read_links
  ON public.links FOR SELECT
  USING (public.has_permission('read:golinks'));

CREATE POLICY create_links
  ON public.links FOR INSERT
  WITH CHECK (public.has_permission('create:golinks'));

CREATE POLICY update_links
  ON public.links FOR UPDATE
  USING (public.has_permission('update:golinks'))
  WITH CHECK (public.has_permission('update:golinks'));

CREATE POLICY delete_links
  ON public.links FOR DELETE
  USING (public.has_permission('delete:golinks'));

-- Drop junction table policies
DROP POLICY read_link_allowed_emails ON public.link_allowed_emails;
DROP POLICY create_link_allowed_emails ON public.link_allowed_emails;
DROP POLICY delete_link_allowed_emails ON public.link_allowed_emails;

-- Drop new functions
DROP FUNCTION public.can_access_link(public.links);
DROP FUNCTION public.get_current_email;
