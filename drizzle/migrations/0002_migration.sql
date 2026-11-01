create or replace function public.can_edit_content(_user_id uuid)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role in ('admin','editor')) $$;

do $$
declare t text;
begin
  foreach t in array array['news','courses','deals','events','products','branches'] loop
    execute format('drop policy "admin insert" on public.%I', t);
    execute format('drop policy "admin update" on public.%I', t);
    execute format('drop policy "admin delete" on public.%I', t);
    execute format('create policy "editors insert" on public.%I for insert to authenticated with check (public.can_edit_content(auth.uid()))', t);
    execute format('create policy "editors update" on public.%I for update to authenticated using (public.can_edit_content(auth.uid()))', t);
    execute format('create policy "editors delete" on public.%I for delete to authenticated using (public.can_edit_content(auth.uid()))', t);
  end loop;
end $$;