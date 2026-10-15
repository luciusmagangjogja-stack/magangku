create type public.site_admin_role as enum ('owner', 'editor');

create table public.site_settings (
  id uuid primary key default gen_random_uuid(),
  singleton boolean not null default true unique check (singleton),
  site_title text not null check (char_length(site_title) between 1 and 120),
  seo_description text not null check (char_length(seo_description) between 1 and 320),
  design_tokens jsonb not null check (jsonb_typeof(design_tokens) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null
);

create table public.site_sections (
  id uuid primary key default gen_random_uuid(),
  section_key text not null unique check (
    section_key in ('hero', 'requirements', 'internship_positions', 'facilities', 'contact')
  ),
  is_visible boolean not null default true,
  sort_order integer not null default 0 check (sort_order between 0 and 1000),
  content jsonb not null check (jsonb_typeof(content) = 'object'),
  presentation jsonb not null default '{}'::jsonb check (jsonb_typeof(presentation) = 'object'),
  updated_at timestamptz not null default now(),
  updated_by uuid references auth.users (id) on delete set null,
  constraint required_sections_remain_visible check (
    section_key not in ('hero', 'contact') or is_visible
  )
);

create index site_sections_order_idx on public.site_sections (sort_order, section_key);

create table public.site_images (
  id uuid primary key default gen_random_uuid(),
  image_key text not null unique check (
    image_key in (
      'hero_image', 'hero_background', 'people_banner', 'facilities_illustration',
      'contact_background', 'registration_image', 'badge_image'
    )
  ),
  label text not null check (char_length(label) between 1 and 120),
  storage_path text unique check (
    storage_path is null or (
      storage_path !~ '(^/|\.\.)'
      and storage_path ~* '^[a-z0-9._/-]+\.(jpg|jpeg|png|webp)$'
    )
  ),
  local_fallback_path text not null check (
    local_fallback_path ~ '^/images/[a-zA-Z0-9._/-]+$'
    and position('..' in local_fallback_path) = 0
  ),
  alt_text text not null default '' check (char_length(alt_text) <= 500),
  mime_type text not null check (mime_type in ('image/jpeg', 'image/png', 'image/webp')),
  file_size bigint not null check (file_size between 1 and 5242880),
  width integer not null check (width between 1 and 12000),
  height integer not null check (height between 1 and 12000),
  uploaded_by uuid references auth.users (id) on delete set null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.admin_profiles (
  user_id uuid primary key references auth.users (id) on delete cascade,
  role public.site_admin_role not null default 'editor',
  is_active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table public.activity_logs (
  id uuid primary key default gen_random_uuid(),
  actor_id uuid references auth.users (id) on delete set null,
  action text not null check (action in ('CREATE', 'UPDATE', 'DELETE', 'UPLOAD', 'LOGIN', 'LOGOUT')),
  entity_type text not null check (char_length(entity_type) between 1 and 80),
  entity_id text,
  before_data jsonb,
  after_data jsonb,
  created_at timestamptz not null default now()
);

create index activity_logs_created_at_idx on public.activity_logs (created_at desc);
create index activity_logs_actor_id_idx on public.activity_logs (actor_id, created_at desc);

create or replace function public.has_site_role(p_roles public.site_admin_role[])
returns boolean
language sql
stable
security definer
set search_path = ''
as $$
  select exists (
    select 1
    from public.admin_profiles as profile
    where profile.user_id = (select auth.uid())
      and profile.is_active
      and profile.role = any (p_roles)
  );
$$;

revoke all on function public.has_site_role(public.site_admin_role[]) from public;
grant execute on function public.has_site_role(public.site_admin_role[]) to authenticated;
grant usage on type public.site_admin_role to authenticated;

create or replace function public.set_content_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  new.updated_by := (select auth.uid());
  return new;
end;
$$;

create or replace function public.set_image_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  if tg_op = 'INSERT' then
    new.uploaded_by := (select auth.uid());
  elsif new.storage_path is distinct from old.storage_path then
    new.uploaded_by := (select auth.uid());
  end if;
  return new;
end;
$$;

create or replace function public.set_profile_updated_at()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  new.updated_at := now();
  return new;
end;
$$;

create trigger site_settings_set_updated_at
before insert or update on public.site_settings
for each row execute function public.set_content_updated_at();

create trigger site_sections_set_updated_at
before insert or update on public.site_sections
for each row execute function public.set_content_updated_at();

create trigger site_images_set_updated_at
before insert or update on public.site_images
for each row execute function public.set_image_updated_at();

create trigger admin_profiles_set_updated_at
before insert or update on public.admin_profiles
for each row execute function public.set_profile_updated_at();

create or replace function public.prevent_last_active_owner_removal()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  removes_active_owner boolean := false;
  active_owner_count integer;
begin
  if tg_op = 'DELETE' then
    removes_active_owner := old.role = 'owner' and old.is_active;
  else
    removes_active_owner := old.role = 'owner'
      and old.is_active
      and (new.role <> 'owner' or not new.is_active);
  end if;

  if removes_active_owner then
    perform pg_catalog.pg_advisory_xact_lock(pg_catalog.hashtext('magangku-active-owner'));
    select count(*)
      into active_owner_count
      from public.admin_profiles
      where role = 'owner' and is_active;

    if active_owner_count <= 1 then
      raise exception 'At least one active owner must remain.' using errcode = '23514';
    end if;
  end if;

  if tg_op = 'DELETE' then
    return old;
  end if;
  return new;
end;
$$;

create trigger admin_profiles_keep_active_owner
before update or delete on public.admin_profiles
for each row execute function public.prevent_last_active_owner_removal();

create or replace function public.log_cms_change()
returns trigger
language plpgsql
security definer
set search_path = ''
as $$
declare
  current_actor uuid := (select auth.uid());
  before_row jsonb;
  after_row jsonb;
  row_id text;
  log_action text;
begin
  if current_actor is null then
    if tg_op = 'DELETE' then return old; end if;
    return new;
  end if;

  if tg_op = 'INSERT' then
    after_row := to_jsonb(new);
    row_id := coalesce(after_row ->> 'section_key', after_row ->> 'image_key', after_row ->> 'user_id', after_row ->> 'id');
    log_action := case when tg_table_name = 'site_images' then 'UPLOAD' else 'CREATE' end;
  elsif tg_op = 'UPDATE' then
    before_row := to_jsonb(old);
    after_row := to_jsonb(new);
    row_id := coalesce(after_row ->> 'section_key', after_row ->> 'image_key', after_row ->> 'user_id', after_row ->> 'id');
    if tg_table_name = 'site_images' and old.storage_path is distinct from new.storage_path then
      log_action := 'UPLOAD';
    else
      log_action := 'UPDATE';
    end if;
  else
    before_row := to_jsonb(old);
    row_id := coalesce(before_row ->> 'section_key', before_row ->> 'image_key', before_row ->> 'user_id', before_row ->> 'id');
    log_action := 'DELETE';
  end if;

  insert into public.activity_logs (actor_id, action, entity_type, entity_id, before_data, after_data)
  values (current_actor, log_action, tg_table_name, row_id, before_row, after_row);

  if tg_op = 'DELETE' then return old; end if;
  return new;
end;
$$;

create trigger site_settings_log_change
after insert or update or delete on public.site_settings
for each row execute function public.log_cms_change();

create trigger site_sections_log_change
after insert or update or delete on public.site_sections
for each row execute function public.log_cms_change();

create trigger site_images_log_change
after insert or update or delete on public.site_images
for each row execute function public.log_cms_change();

create trigger admin_profiles_log_change
after insert or update or delete on public.admin_profiles
for each row execute function public.log_cms_change();

alter table public.site_settings enable row level security;
alter table public.site_sections enable row level security;
alter table public.site_images enable row level security;
alter table public.admin_profiles enable row level security;
alter table public.activity_logs enable row level security;

revoke all on table public.site_settings, public.site_sections, public.site_images,
  public.admin_profiles, public.activity_logs from anon, authenticated;
grant usage on schema public to anon, authenticated;

grant select (site_title, seo_description, design_tokens) on public.site_settings to anon;
grant select on public.site_settings to authenticated;
grant update (site_title, seo_description, design_tokens) on public.site_settings to authenticated;

grant select (section_key, is_visible, sort_order, content, presentation) on public.site_sections to anon;
grant select on public.site_sections to authenticated;
grant update (is_visible, sort_order, content, presentation) on public.site_sections to authenticated;

grant select (image_key, label, storage_path, local_fallback_path, alt_text, mime_type, file_size, width, height)
  on public.site_images to anon;
grant select on public.site_images to authenticated;
grant update (label, storage_path, alt_text, mime_type, file_size, width, height)
  on public.site_images to authenticated;

grant select (user_id, role, is_active, created_at, updated_at) on public.admin_profiles to authenticated;
grant insert (user_id, role, is_active) on public.admin_profiles to authenticated;
grant update (role, is_active) on public.admin_profiles to authenticated;
grant delete on public.admin_profiles to authenticated;
grant select on public.activity_logs to authenticated;

create policy site_settings_public_read
on public.site_settings for select to anon using (singleton);

create policy site_settings_authenticated_read
on public.site_settings for select to authenticated using (true);

create policy site_settings_admin_update
on public.site_settings for update to authenticated
using (public.has_site_role(array['owner', 'editor']::public.site_admin_role[]))
with check (public.has_site_role(array['owner', 'editor']::public.site_admin_role[]));

create policy site_sections_public_read
on public.site_sections for select to anon using (is_visible);

create policy site_sections_authenticated_read
on public.site_sections for select to authenticated
using (is_visible or public.has_site_role(array['owner', 'editor']::public.site_admin_role[]));

create policy site_sections_admin_update
on public.site_sections for update to authenticated
using (public.has_site_role(array['owner', 'editor']::public.site_admin_role[]))
with check (public.has_site_role(array['owner', 'editor']::public.site_admin_role[]));

create policy site_images_public_read
on public.site_images for select to anon using (true);

create policy site_images_authenticated_read
on public.site_images for select to authenticated using (true);

create policy site_images_admin_update
on public.site_images for update to authenticated
using (public.has_site_role(array['owner', 'editor']::public.site_admin_role[]))
with check (public.has_site_role(array['owner', 'editor']::public.site_admin_role[]));

create policy site_media_admin_list
on storage.objects for select to authenticated
using (
  bucket_id = 'site-media'
  and public.has_site_role(array['owner', 'editor']::public.site_admin_role[])
);

create policy admin_profiles_read_self_or_owner
on public.admin_profiles for select to authenticated
using (
  user_id = (select auth.uid())
  or public.has_site_role(array['owner']::public.site_admin_role[])
);

create policy admin_profiles_owner_insert
on public.admin_profiles for insert to authenticated
with check (public.has_site_role(array['owner']::public.site_admin_role[]));

create policy admin_profiles_owner_update
on public.admin_profiles for update to authenticated
using (public.has_site_role(array['owner']::public.site_admin_role[]))
with check (public.has_site_role(array['owner']::public.site_admin_role[]));

create policy admin_profiles_owner_delete
on public.admin_profiles for delete to authenticated
using (public.has_site_role(array['owner']::public.site_admin_role[]));

create policy activity_logs_admin_read
on public.activity_logs for select to authenticated
using (public.has_site_role(array['owner', 'editor']::public.site_admin_role[]));

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'site-media',
  'site-media',
  true,
  5242880,
  array['image/jpeg', 'image/png', 'image/webp']::text[]
)
on conflict (id) do nothing;

create policy site_media_admin_upload
on storage.objects for insert to authenticated
with check (
  bucket_id = 'site-media'
  and public.has_site_role(array['owner', 'editor']::public.site_admin_role[])
);

create policy site_media_admin_delete
on storage.objects for delete to authenticated
using (
  bucket_id = 'site-media'
  and public.has_site_role(array['owner', 'editor']::public.site_admin_role[])
);
