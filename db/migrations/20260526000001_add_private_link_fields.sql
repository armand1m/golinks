-- migrate:up

-- Add privacy and creator tracking columns to links
ALTER TABLE public.links
  ADD COLUMN is_private BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN created_by_email VARCHAR(255);

COMMENT ON COLUMN public.links.is_private IS 'Whether this link is private. Private links are only accessible by the creator and explicitly allowed users.';
COMMENT ON COLUMN public.links.created_by_email IS 'The email of the user who created this link. Used for private link ownership tracking.';

-- Junction table for allowed emails on private links
CREATE TABLE public.link_allowed_emails (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    link_id UUID NOT NULL REFERENCES public.links(id) ON DELETE CASCADE,
    email VARCHAR(255) NOT NULL
);

CREATE UNIQUE INDEX link_allowed_emails_link_email_idx
    ON public.link_allowed_emails (link_id, email);

CREATE INDEX link_allowed_emails_link_id_idx
    ON public.link_allowed_emails (link_id);

COMMENT ON TABLE public.link_allowed_emails IS 'Allowed email addresses for private link access.';
COMMENT ON COLUMN public.link_allowed_emails.link_id IS 'The link this email is allowed to access.';
COMMENT ON COLUMN public.link_allowed_emails.email IS 'The email address allowed to access this private link.';

-- Enable RLS on the junction table
ALTER TABLE public.link_allowed_emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.link_allowed_emails FORCE ROW LEVEL SECURITY;

GRANT ALL ON public.link_allowed_emails TO postgraphile;

-- migrate:down
DROP TABLE public.link_allowed_emails CASCADE;
ALTER TABLE public.links DROP COLUMN is_private;
ALTER TABLE public.links DROP COLUMN created_by_email;
