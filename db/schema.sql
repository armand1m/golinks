SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- Name: postgraphile_watch; Type: SCHEMA; Schema: -; Owner: -
--

CREATE SCHEMA postgraphile_watch;


--
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: -
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


--
-- Name: notify_watchers_ddl(); Type: FUNCTION; Schema: postgraphile_watch; Owner: -
--

CREATE FUNCTION postgraphile_watch.notify_watchers_ddl() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
begin
  perform pg_notify(
    'postgraphile_watch',
    json_build_object(
      'type',
      'ddl',
      'payload',
      (select json_agg(json_build_object('schema', schema_name, 'command', command_tag)) from pg_event_trigger_ddl_commands() as x)
    )::text
  );
end;
$$;


--
-- Name: notify_watchers_drop(); Type: FUNCTION; Schema: postgraphile_watch; Owner: -
--

CREATE FUNCTION postgraphile_watch.notify_watchers_drop() RETURNS event_trigger
    LANGUAGE plpgsql
    AS $$
begin
  perform pg_notify(
    'postgraphile_watch',
    json_build_object(
      'type',
      'drop',
      'payload',
      (select json_agg(distinct x.schema_name) from pg_event_trigger_dropped_objects() as x)
    )::text
  );
end;
$$;


--
-- Name: get_current_permissions(); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.get_current_permissions() RETURNS json
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  select nullif(current_setting('jwt.claims.permissions', true), '[]')::json;
$$;


--
-- Name: has_permission(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.has_permission(permission text) RETURNS boolean
    LANGUAGE sql STABLE SECURITY DEFINER
    AS $$
  with claims as (
    select
      get_current_permissions() as permissions
  )
  select count(claims.permissions) > 0
  from claims
  where claims.permissions::jsonb ? permission;
$$;


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: links; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.links (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    alias character varying(50) NOT NULL,
    url character varying(255) NOT NULL,
    created_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.links FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE links; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.links IS 'A link alias posted by an user.';


--
-- Name: COLUMN links.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.links.id IS 'The id for a link alias.';


--
-- Name: COLUMN links.alias; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.links.alias IS 'The alias for an url. It must be unique.';


--
-- Name: COLUMN links.url; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.links.url IS 'The link alias url.';


--
-- Name: COLUMN links.created_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.links.created_at IS 'The time this link alias was created.';


--
-- Name: search_links(text); Type: FUNCTION; Schema: public; Owner: -
--

CREATE FUNCTION public.search_links(search text) RETURNS SETOF public.links
    LANGUAGE sql STABLE
    AS $$
    select *
    from public.links
    where
      url ilike ('%' || search || '%') or
      alias ilike ('%' || search || '%')
  $$;


--
-- Name: link_usage_metrics; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.link_usage_metrics (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    link_id uuid NOT NULL,
    accessed_at timestamp without time zone DEFAULT now() NOT NULL
);

ALTER TABLE ONLY public.link_usage_metrics FORCE ROW LEVEL SECURITY;


--
-- Name: TABLE link_usage_metrics; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON TABLE public.link_usage_metrics IS 'A link usage metric posted by the application when a link is accessed.';


--
-- Name: COLUMN link_usage_metrics.id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.link_usage_metrics.id IS 'The id for this metric record.';


--
-- Name: COLUMN link_usage_metrics.link_id; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.link_usage_metrics.link_id IS 'The id of the link being accessed.';


--
-- Name: COLUMN link_usage_metrics.accessed_at; Type: COMMENT; Schema: public; Owner: -
--

COMMENT ON COLUMN public.link_usage_metrics.accessed_at IS 'The time this link was accessed.';


--
-- Name: schema_migrations; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.schema_migrations (
    version character varying(255) NOT NULL
);


--
-- Name: link_usage_metrics link_usage_metrics_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_usage_metrics
    ADD CONSTRAINT link_usage_metrics_pkey PRIMARY KEY (id);


--
-- Name: links links_alias_key; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_alias_key UNIQUE (alias);


--
-- Name: links links_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.links
    ADD CONSTRAINT links_pkey PRIMARY KEY (id);


--
-- Name: schema_migrations schema_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.schema_migrations
    ADD CONSTRAINT schema_migrations_pkey PRIMARY KEY (version);


--
-- Name: link_usage_metrics_link_id_idx; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX link_usage_metrics_link_id_idx ON public.link_usage_metrics USING btree (link_id);


--
-- Name: link_usage_metrics link_usage_metrics_link_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.link_usage_metrics
    ADD CONSTRAINT link_usage_metrics_link_id_fkey FOREIGN KEY (link_id) REFERENCES public.links(id) ON DELETE CASCADE;


--
-- Name: link_usage_metrics create_link_usage_metric; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY create_link_usage_metric ON public.link_usage_metrics FOR INSERT WITH CHECK (public.has_permission('read:golinks'::text));


--
-- Name: links create_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY create_links ON public.links FOR INSERT WITH CHECK (public.has_permission('create:golinks'::text));


--
-- Name: links delete_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY delete_links ON public.links FOR DELETE USING (public.has_permission('delete:golinks'::text));


--
-- Name: link_usage_metrics; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.link_usage_metrics ENABLE ROW LEVEL SECURITY;

--
-- Name: links; Type: ROW SECURITY; Schema: public; Owner: -
--

ALTER TABLE public.links ENABLE ROW LEVEL SECURITY;

--
-- Name: link_usage_metrics read_link_usage_metric; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY read_link_usage_metric ON public.link_usage_metrics FOR SELECT USING (public.has_permission('read:golinks'::text));


--
-- Name: links read_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY read_links ON public.links FOR SELECT USING (public.has_permission('read:golinks'::text));


--
-- Name: links update_links; Type: POLICY; Schema: public; Owner: -
--

CREATE POLICY update_links ON public.links FOR UPDATE USING (public.has_permission('update:golinks'::text)) WITH CHECK (public.has_permission('update:golinks'::text));


--
-- Name: postgraphile_watch_ddl; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER postgraphile_watch_ddl ON ddl_command_end
         WHEN TAG IN ('ALTER AGGREGATE', 'ALTER DOMAIN', 'ALTER EXTENSION', 'ALTER FOREIGN TABLE', 'ALTER FUNCTION', 'ALTER POLICY', 'ALTER SCHEMA', 'ALTER TABLE', 'ALTER TYPE', 'ALTER VIEW', 'COMMENT', 'CREATE AGGREGATE', 'CREATE DOMAIN', 'CREATE EXTENSION', 'CREATE FOREIGN TABLE', 'CREATE FUNCTION', 'CREATE INDEX', 'CREATE POLICY', 'CREATE RULE', 'CREATE SCHEMA', 'CREATE TABLE', 'CREATE TABLE AS', 'CREATE VIEW', 'DROP AGGREGATE', 'DROP DOMAIN', 'DROP EXTENSION', 'DROP FOREIGN TABLE', 'DROP FUNCTION', 'DROP INDEX', 'DROP OWNED', 'DROP POLICY', 'DROP RULE', 'DROP SCHEMA', 'DROP TABLE', 'DROP TYPE', 'DROP VIEW', 'GRANT', 'REVOKE', 'SELECT INTO')
   EXECUTE FUNCTION postgraphile_watch.notify_watchers_ddl();


--
-- Name: postgraphile_watch_drop; Type: EVENT TRIGGER; Schema: -; Owner: -
--

CREATE EVENT TRIGGER postgraphile_watch_drop ON sql_drop
   EXECUTE FUNCTION postgraphile_watch.notify_watchers_drop();


--
-- PostgreSQL database dump complete
--


--
-- Dbmate schema migrations
--

INSERT INTO public.schema_migrations (version) VALUES
    ('20200927095515'),
    ('20200927100445'),
    ('20200927100527'),
    ('20200927100605'),
    ('20200927100655'),
    ('20200927100746'),
    ('20200927101112'),
    ('20200927101300'),
    ('20200927232549'),
    ('20201011103804');
