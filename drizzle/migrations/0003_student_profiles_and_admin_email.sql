create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  phone text not null default '',
  city text not null default '',
  university text not null default '',
  faculty text not null default '',
  student_number text not null default '',
  member_code text not null default ('GUSS-' || to_char(now(),'YYYY') || '-' || lpad((floor(random()*100000))::int::text, 5, '0')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
grant select, insert, update on public.profiles to authenticated;
grant all on public.profiles to service_role;
alter table public.profiles enable row level security;
create policy "own profile read" on public.profiles for select to authenticated using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));
create policy "own profile insert" on public.profiles for insert to authenticated with check (auth.uid() = id);
create policy "own profile update" on public.profiles for update to authenticated using (auth.uid() = id or public.has_role(auth.uid(), 'admin'));

-- The owner account is always admin; everyone else starts as a student.
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if lower(new.email) = 'oldar.bakr@gmail.com' then
    insert into public.user_roles (user_id, role) values (new.id, 'admin') on conflict do nothing;
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user') on conflict do nothing;
  end if;
  return new;
end $$;

insert into public.user_roles (user_id, role)
select id, 'admin' from auth.users where lower(email) = 'oldar.bakr@gmail.com'
on conflict do nothing;