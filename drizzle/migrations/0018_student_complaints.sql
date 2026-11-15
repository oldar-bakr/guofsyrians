CREATE TABLE public.student_complaints (
 id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
 user_id uuid,
 anonymous boolean NOT NULL DEFAULT false,
 title text NOT NULL CHECK (char_length(trim(title)) BETWEEN 1 AND 160),
 body text NOT NULL CHECK (char_length(trim(body)) BETWEEN 1 AND 5000),
 attachment_path text,
 attachment_name text,
 attachment_size integer CHECK (attachment_size BETWEEN 1 AND 3145728),
 status text NOT NULL DEFAULT 'new' CHECK (status IN ('new','reviewing','closed')),
 created_at timestamptz NOT NULL DEFAULT now(),
 CONSTRAINT complaint_identity CHECK ((anonymous AND user_id IS NULL) OR (NOT anonymous AND user_id IS NOT NULL)),
 CONSTRAINT complaint_attachment CHECK ((attachment_path IS NULL AND attachment_name IS NULL AND attachment_size IS NULL) OR (attachment_path IS NOT NULL AND attachment_name IS NOT NULL AND attachment_size IS NOT NULL))
);
GRANT SELECT, UPDATE ON public.student_complaints TO authenticated;
GRANT ALL ON public.student_complaints TO service_role;
ALTER TABLE public.student_complaints ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Staff read complaints" ON public.student_complaints FOR SELECT TO authenticated USING (public.can_edit_content(auth.uid()));
CREATE POLICY "Staff review complaints" ON public.student_complaints FOR UPDATE TO authenticated USING (public.can_edit_content(auth.uid())) WITH CHECK (public.can_edit_content(auth.uid()));
CREATE INDEX student_complaints_created_at_idx ON public.student_complaints(created_at DESC);