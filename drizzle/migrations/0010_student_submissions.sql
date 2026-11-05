ALTER TABLE public.courses ADD COLUMN submitted_by uuid, ADD COLUMN status text NOT NULL DEFAULT 'approved', ADD COLUMN instructor text NOT NULL DEFAULT '', ADD COLUMN contact text NOT NULL DEFAULT '';
ALTER TABLE public.products ADD COLUMN submitted_by uuid, ADD COLUMN status text NOT NULL DEFAULT 'approved', ADD COLUMN description text NOT NULL DEFAULT '', ADD COLUMN contact text NOT NULL DEFAULT '';

CREATE OR REPLACE FUNCTION public.guard_submission() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF public.can_edit_content(auth.uid()) THEN RETURN NEW; END IF;
  IF TG_OP = 'INSERT' THEN
    NEW.submitted_by := auth.uid();
    NEW.status := 'pending';
  ELSE
    NEW.submitted_by := OLD.submitted_by;
    NEW.status := 'pending';
  END IF;
  RETURN NEW;
END $$;

CREATE TRIGGER courses_guard_submission BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.guard_submission();
CREATE TRIGGER products_guard_submission BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_submission();

DROP POLICY "public read" ON public.courses;
DROP POLICY "public read" ON public.products;
CREATE POLICY "public read" ON public.courses FOR SELECT TO anon, authenticated USING (status = 'approved' OR submitted_by = auth.uid() OR public.can_edit_content(auth.uid()));
CREATE POLICY "public read" ON public.products FOR SELECT TO anon, authenticated USING (status = 'approved' OR submitted_by = auth.uid() OR public.can_edit_content(auth.uid()));
CREATE POLICY "student submit" ON public.courses FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "student submit" ON public.products FOR INSERT TO authenticated WITH CHECK (submitted_by = auth.uid());
CREATE POLICY "own update" ON public.courses FOR UPDATE TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "own update" ON public.products FOR UPDATE TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "own delete" ON public.courses FOR DELETE TO authenticated USING (submitted_by = auth.uid());
CREATE POLICY "own delete" ON public.products FOR DELETE TO authenticated USING (submitted_by = auth.uid());