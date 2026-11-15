CREATE TABLE public.scholarships (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 title text NOT NULL,
 provider text NOT NULL DEFAULT '',
 country text NOT NULL DEFAULT '',
 deadline text NOT NULL DEFAULT '',
 eligibility text NOT NULL DEFAULT '',
 description text NOT NULL DEFAULT '',
 application_url text NOT NULL DEFAULT '',
 created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scholarships TO anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON public.scholarships TO authenticated;
GRANT ALL ON public.scholarships TO service_role;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
CREATE POLICY "scholarships public read" ON public.scholarships FOR SELECT TO anon, authenticated USING (true);
CREATE POLICY "scholarships staff insert" ON public.scholarships FOR INSERT TO authenticated WITH CHECK (public.can_edit_content(auth.uid()));
CREATE POLICY "scholarships staff update" ON public.scholarships FOR UPDATE TO authenticated USING (public.can_edit_content(auth.uid())) WITH CHECK (public.can_edit_content(auth.uid()));
CREATE POLICY "scholarships staff delete" ON public.scholarships FOR DELETE TO authenticated USING (public.can_edit_content(auth.uid()));
ALTER TABLE public.news ADD COLUMN images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.events ADD COLUMN images text[] NOT NULL DEFAULT '{}';
ALTER TABLE public.products ADD COLUMN images text[] NOT NULL DEFAULT '{}';
CREATE POLICY "content images staff upload" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'content-images' AND (storage.foldername(name))[1] = auth.uid()::text AND public.can_edit_content(auth.uid()));
CREATE POLICY "content images staff delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'content-images' AND public.can_edit_content(auth.uid()));
CREATE POLICY "content images visible read" ON storage.objects FOR SELECT TO authenticated USING (
 bucket_id = 'content-images' AND (
 public.can_edit_content(auth.uid())
 OR EXISTS (SELECT 1 FROM public.news n WHERE storage.objects.name = ANY(n.images))
 OR EXISTS (SELECT 1 FROM public.events e WHERE storage.objects.name = ANY(e.images))
 OR EXISTS (SELECT 1 FROM public.products p WHERE storage.objects.name = ANY(p.images) AND (p.status = 'approved' OR p.submitted_by = auth.uid()))
 )
);