alter table public.courses add column if not exists description text not null default '';
alter table public.courses add column if not exists video_url text not null default '';
alter table public.events add column if not exists description text not null default '';
alter table public.news add column if not exists body text not null default '';

create table public.faqs (id uuid primary key default gen_random_uuid(), question text not null, answer text not null default '', created_at timestamptz not null default now());
grant select on public.faqs to anon, authenticated;
grant insert, update, delete on public.faqs to authenticated;
grant all on public.faqs to service_role;
alter table public.faqs enable row level security;
create policy "public read" on public.faqs for select to anon, authenticated using (true);
create policy "editors insert" on public.faqs for insert to authenticated with check (public.can_edit_content(auth.uid()));
create policy "editors update" on public.faqs for update to authenticated using (public.can_edit_content(auth.uid()));
create policy "editors delete" on public.faqs for delete to authenticated using (public.can_edit_content(auth.uid()));

create table public.course_enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  course_id uuid not null references public.courses(id) on delete cascade,
  completed_lessons int not null default 0,
  created_at timestamptz not null default now(),
  unique (user_id, course_id)
);
create table public.event_registrations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique (user_id, event_id)
);
create table public.deal_redemptions (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  deal_id uuid not null references public.deals(id) on delete cascade,
  created_at timestamptz not null default now()
);
create table public.orders (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  items jsonb not null default '[]'::jsonb,
  note text not null default '',
  status text not null default 'جديد',
  created_at timestamptz not null default now()
);
create table public.assistant_messages (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  question text not null,
  answer text not null default '',
  created_at timestamptz not null default now()
);

do $$
declare t text;
begin
  foreach t in array array['course_enrollments','event_registrations','deal_redemptions','orders','assistant_messages'] loop
    execute format('grant select, insert, update, delete on public.%I to authenticated', t);
    execute format('grant all on public.%I to service_role', t);
    execute format('alter table public.%I enable row level security', t);
    execute format('create policy "own or staff read" on public.%I for select to authenticated using (auth.uid() = user_id or public.can_edit_content(auth.uid()))', t);
    execute format('create policy "own insert" on public.%I for insert to authenticated with check (auth.uid() = user_id)', t);
    execute format('create policy "own or staff delete" on public.%I for delete to authenticated using (auth.uid() = user_id or public.can_edit_content(auth.uid()))', t);
  end loop;
end $$;
create policy "own progress update" on public.course_enrollments for update to authenticated using (auth.uid() = user_id);
create policy "staff update orders" on public.orders for update to authenticated using (public.can_edit_content(auth.uid()));
-- staff need to see student names next to activity
create policy "staff read profiles" on public.profiles for select to authenticated using (public.can_edit_content(auth.uid()));

insert into public.faqs (question, answer) values
('كيف أجدد اشتراكي؟','يتم تجديد الاشتراك سنوياً عبر فرع الاتحاد في مدينتك أو من خلال التطبيق عند تفعيل الدفع.'),
('كيف أستفيد من التخفيضات؟','اعرض رمز QR في بطاقتك الرقمية لدى الشريك المعتمد قبل الدفع.'),
('كيف أتواصل مع فرع جامعتي؟','افتح دليل الاتحاد في التطبيق لتجد بيانات تواصل فرع جامعتك.');