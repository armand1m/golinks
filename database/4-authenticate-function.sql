create function public.authenticate(
  email text,
  password text
) returns public.jwt_token as $$
declare
  user app_private.users;
begin
  select u.* into user
    from app_private.users as u
    where u.email = authenticate.email;

  if user.password_hash = crypt(authenticate.password, user.password_hash) then
    return (
      'person_role',
      extract(epoch from now() + interval '7 days'),
      user.id,
      user.is_admin,
      user.username
    )::public.jwt_token;
  else
    return null;
  end if;
end;
$$ language plpgsql strict security definer;