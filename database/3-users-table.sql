create function my_public_schema.authenticate(
  email text,
  password text
) returns my_public_schema.jwt_token as $$
declare
  account my_private_schema.person_account;
begin
  select a.* into account
    from my_private_schema.person_account as a
    where a.email = authenticate.email;

  if account.password_hash = crypt(password, account.password_hash) then
    return (
      'person_role',
      extract(epoch from now() + interval '7 days'),
      account.person_id,
      account.is_admin,
      account.username
    )::my_public_schema.jwt_token;
  else
    return null;
  end if;
end;
$$ language plpgsql strict security definer;