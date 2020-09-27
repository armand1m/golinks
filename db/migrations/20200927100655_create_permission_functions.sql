-- migrate:up
create function get_current_permissions() returns json as $$
  select nullif(current_setting('jwt.claims.permissions', true), '[]')::json;
$$ language sql stable SECURITY DEFINER; 

create function has_permission(permission text) returns boolean as $$
  with claims as (
    select 
      get_current_permissions() as permissions
  )
  select count(claims.permissions) > 0
  from claims
  where claims.permissions::jsonb ? permission; 
$$ language sql stable SECURITY DEFINER;

-- migrate:down
DROP FUNCTION get_current_permissions;
DROP FUNCTION has_permission;
