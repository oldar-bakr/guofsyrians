ALTER TABLE public.profiles ADD COLUMN membership_active boolean NOT NULL DEFAULT false;
ALTER TABLE public.profiles ADD COLUMN membership_expires date;

CREATE OR REPLACE FUNCTION public.guard_membership() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.has_role(auth.uid(), 'admin') THEN
    IF TG_OP = 'INSERT' THEN
      NEW.membership_active := false; NEW.membership_expires := NULL;
    ELSIF NEW.membership_active IS DISTINCT FROM OLD.membership_active OR NEW.membership_expires IS DISTINCT FROM OLD.membership_expires THEN
      NEW.membership_active := OLD.membership_active; NEW.membership_expires := OLD.membership_expires;
    END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER profiles_guard_membership BEFORE INSERT OR UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.guard_membership();

CREATE TABLE public.businesses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id uuid NOT NULL UNIQUE,
  name text NOT NULL,
  category text NOT NULL DEFAULT '',
  city text NOT NULL DEFAULT '',
  address text NOT NULL DEFAULT '',
  phone text NOT NULL DEFAULT '',
  email text NOT NULL DEFAULT '',
  description text NOT NULL DEFAULT '',
  logo_url text,
  status text NOT NULL DEFAULT 'pending',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.businesses TO authenticated;
GRANT ALL ON public.businesses TO service_role;
ALTER TABLE public.businesses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "approved or own or staff read" ON public.businesses FOR SELECT TO authenticated USING (status = 'approved' OR owner_id = auth.uid() OR public.can_edit_content(auth.uid()));
CREATE POLICY "own insert" ON public.businesses FOR INSERT TO authenticated WITH CHECK (owner_id = auth.uid());
CREATE POLICY "own or staff update" ON public.businesses FOR UPDATE TO authenticated USING (owner_id = auth.uid() OR public.can_edit_content(auth.uid()));
CREATE POLICY "staff delete" ON public.businesses FOR DELETE TO authenticated USING (public.can_edit_content(auth.uid()));

CREATE OR REPLACE FUNCTION public.guard_business_status() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF auth.uid() IS NOT NULL AND NOT public.can_edit_content(auth.uid()) THEN
    IF TG_OP = 'INSERT' THEN NEW.status := 'pending';
    ELSE NEW.status := OLD.status; NEW.owner_id := OLD.owner_id; END IF;
  END IF;
  RETURN NEW;
END $$;
CREATE TRIGGER businesses_guard_status BEFORE INSERT OR UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.guard_business_status();

CREATE OR REPLACE FUNCTION public.owns_approved_business(_user_id uuid, _business_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id AND owner_id = _user_id AND status = 'approved')
$$;
CREATE OR REPLACE FUNCTION public.business_is_approved(_business_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.businesses WHERE id = _business_id AND status = 'approved')
$$;

ALTER TABLE public.deals ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE CASCADE;
ALTER TABLE public.deals ADD COLUMN active boolean NOT NULL DEFAULT true;
DROP POLICY "public read" ON public.deals;
CREATE POLICY "public read" ON public.deals FOR SELECT TO anon, authenticated USING (
  (business_id IS NULL OR public.business_is_approved(business_id)) OR public.owns_approved_business(auth.uid(), business_id) OR public.can_edit_content(auth.uid())
  OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);
CREATE POLICY "business insert" ON public.deals FOR INSERT TO authenticated WITH CHECK (public.owns_approved_business(auth.uid(), business_id));
CREATE POLICY "business update" ON public.deals FOR UPDATE TO authenticated USING (public.owns_approved_business(auth.uid(), business_id));
CREATE POLICY "business delete" ON public.deals FOR DELETE TO authenticated USING (public.owns_approved_business(auth.uid(), business_id));

ALTER TABLE public.deal_redemptions ADD COLUMN business_id uuid REFERENCES public.businesses(id) ON DELETE SET NULL;
CREATE POLICY "business read redemptions" ON public.deal_redemptions FOR SELECT TO authenticated USING (
  EXISTS (SELECT 1 FROM public.businesses b WHERE b.id = business_id AND b.owner_id = auth.uid())
);

CREATE POLICY "logos read" ON storage.objects FOR SELECT TO authenticated USING (bucket_id = 'business-logos');
CREATE POLICY "logos own insert" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos own update" ON storage.objects FOR UPDATE TO authenticated USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);
CREATE POLICY "logos own delete" ON storage.objects FOR DELETE TO authenticated USING (bucket_id = 'business-logos' AND (storage.foldername(name))[1] = auth.uid()::text);