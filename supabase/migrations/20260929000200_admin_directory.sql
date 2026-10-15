create or replace function public.list_site_admins()
returns table (
  user_id uuid,
  email text,
  role public.site_admin_role,
  is_active boolean,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select profile.user_id, auth_user.email, profile.role, profile.is_active, profile.created_at
  from public.admin_profiles as profile
  join auth.users as auth_user on auth_user.id = profile.user_id
  where (select public.has_site_role(array['owner']::public.site_admin_role[]))
  order by profile.created_at asc, profile.user_id asc;
$$;

revoke all on function public.list_site_admins() from public, anon;
grant execute on function public.list_site_admins() to authenticated;

create or replace function public.list_unassigned_site_users()
returns table (user_id uuid, email text, created_at timestamptz)
language sql
stable
security definer
set search_path = ''
as $$
  select auth_user.id, auth_user.email, auth_user.created_at
  from auth.users as auth_user
  where auth_user.email is not null
    and not exists (
      select 1 from public.admin_profiles as profile where profile.user_id = auth_user.id
    )
    and (select public.has_site_role(array['owner']::public.site_admin_role[]))
  order by auth_user.created_at desc
  limit 100;
$$;

revoke all on function public.list_unassigned_site_users() from public, anon;
grant execute on function public.list_unassigned_site_users() to authenticated;

create or replace function public.get_site_activity()
returns table (
  id uuid,
  actor_email text,
  action text,
  entity_type text,
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz
)
language sql
stable
security definer
set search_path = ''
as $$
  select log.id, auth_user.email, log.action, log.entity_type, log.entity_id,
         log.before_data, log.after_data, log.created_at
  from public.activity_logs as log
  left join auth.users as auth_user on auth_user.id = log.actor_id
  where (select public.has_site_role(array['owner', 'editor']::public.site_admin_role[]))
  order by log.created_at desc
  limit 100;
$$;

revoke all on function public.get_site_activity() from public, anon;
grant execute on function public.get_site_activity() to authenticated;

create or replace function public.record_site_auth_event(p_action text)
returns void
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor uuid := (select auth.uid());
begin
  if current_actor is null or p_action is null or p_action not in ('LOGIN', 'LOGOUT') then
    raise exception 'Invalid admin authentication event.' using errcode = '42501';
  end if;
  if not public.has_site_role(array['owner', 'editor']::public.site_admin_role[]) then
    raise exception 'An active admin profile is required.' using errcode = '42501';
  end if;

  insert into public.activity_logs (actor_id, action, entity_type)
  values (current_actor, p_action, 'auth');
end;
$$;

revoke all on function public.record_site_auth_event(text) from public, anon;
grant execute on function public.record_site_auth_event(text) to authenticated;