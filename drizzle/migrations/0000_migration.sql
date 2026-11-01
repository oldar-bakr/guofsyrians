create type public.app_role as enum ('admin', 'user');
create table public.user_roles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete cascade not null,
  role app_role not null,
  unique (user_id, role)
);
grant select on public.user_roles to authenticated;
grant all on public.user_roles to service_role;
alter table public.user_roles enable row level security;
create policy "own roles readable" on public.user_roles for select to authenticated using (auth.uid() = user_id);

create or replace function public.has_role(_user_id uuid, _role app_role)
returns boolean language sql stable security definer set search_path = public
as $$ select exists (select 1 from public.user_roles where user_id = _user_id and role = _role) $$;

-- First account to sign up becomes the admin
create or replace function public.handle_new_user_role()
returns trigger language plpgsql security definer set search_path = public
as $$
begin
  if not exists (select 1 from public.user_roles where role = 'admin') then
    insert into public.user_roles (user_id, role) values (new.id, 'admin');
  else
    insert into public.user_roles (user_id, role) values (new.id, 'user');
  end if;
  return new;
end $$;
create trigger on_auth_user_created_role after insert on auth.users
for each row execute function public.handle_new_user_role();

create table public.news (id uuid primary key default gen_random_uuid(), title text not null, date text not null default '', created_at timestamptz not null default now());
create table public.courses (id uuid primary key default gen_random_uuid(), title text not null, category text not null default '', lessons int not null default 0, created_at timestamptz not null default now());
create table public.deals (id uuid primary key default gen_random_uuid(), partner text not null, category text not null default '', discount text not null default '', city text not null default '', terms text not null default '', created_at timestamptz not null default now());
create table public.events (id uuid primary key default gen_random_uuid(), title text not null, date text not null default '', time text not null default '', place text not null default '', org text not null default '', created_at timestamptz not null default now());
create table public.products (id uuid primary key default gen_random_uuid(), name text not null, price text not null default '', seller text not null default '', created_at timestamptz not null default now());
create table public.branches (id uuid primary key default gen_random_uuid(), city text not null, university text not null default '', head text not null default '', contact text not null default '', created_at timestamptz not null default now());

do $$
declare t text;
begin
  foreach t in array array['news','courses','deals','events','products','branches'] loop
    execute format('grant select on public.%I to anon, authenticated', t);
    execute format('grant insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "public read" on public.%I for select to anon, authenticated using (true)', t);
    execute format('create policy "admin insert" on public.%I for insert to authenticated with check (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "admin update" on public.%I for update to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
    execute format('create policy "admin delete" on public.%I for delete to authenticated using (public.has_role(auth.uid(), ''admin''))', t);
  end loop;
end $$;

insert into public.news (title, date, created_at) values
('فتح باب التسجيل في دورة البرمجة للمبتدئين','28 تشرين الأول', now()),
('لقاء تعارفي للطلاب الجدد في أنقرة','25 تشرين الأول', now() - interval '1 minute'),
('شراكة جديدة مع مجموعة مقاهٍ في إسطنبول','20 تشرين الأول', now() - interval '2 minute');
insert into public.courses (title, category, lessons) values
('أساسيات البرمجة بلغة Python','تقنية',12),('اللغة التركية للمستوى A2','لغات',20),('كتابة السيرة الذاتية والمقابلات','مهارات',6),('مدخل إلى التصميم الجرافيكي','تصميم',10);
insert into public.deals (partner, category, discount, city, terms) values
('مطعم الشام','مطاعم','20%','إسطنبول','على الوجبات الرئيسية'),('مقهى ياسمين','مقاهٍ','15%','إسطنبول','طوال أيام الأسبوع'),('صالون الأناقة','حلاقة','25%','أنقرة','من الأحد إلى الخميس'),('مكتبة المعرفة','متاجر','10%','غازي عنتاب','على الكتب والقرطاسية');
insert into public.events (title, date, time, place, org) values
('أمسية ثقافية سورية','8 تشرين الثاني','18:00','مركز الفاتح الثقافي','فرع إسطنبول'),('ورشة التوجيه المهني','15 تشرين الثاني','14:00','جامعة أنقرة','فرع أنقرة'),('بطولة كرة القدم الطلابية','22 تشرين الثاني','10:00','ملعب باشاك شهير','فرع إسطنبول');
insert into public.products (name, price, seller) values
('حقيبة ظهر جامعية','450 ₺','متجر الطالب'),('سماعات لاسلكية','890 ₺','تك ستور'),('دفتر ملاحظات A4','60 ₺','مكتبة المعرفة'),('آلة حاسبة علمية','320 ₺','متجر الطالب');
insert into public.branches (city, university, head, contact) values
('إسطنبول','جامعة إسطنبول','سامر العلي','istanbul@guss.org'),('أنقرة','جامعة أنقرة','ليلى حسن','ankara@guss.org'),('غازي عنتاب','جامعة غازي عنتاب','محمد الأحمد','gaziantep@guss.org');