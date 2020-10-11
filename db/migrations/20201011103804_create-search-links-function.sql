-- migrate:up
create function search_links(search text)
  returns setof public.links as $$
    select *
    from public.links
    where
      url ilike ('%' || search || '%') or
      alias ilike ('%' || search || '%')
  $$ language sql stable;

-- migrate:down
drop function search_links;
