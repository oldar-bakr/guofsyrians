ALTER TABLE public.news ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.events ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.scholarships ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.courses ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.products ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.branches ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.faqs ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.businesses ADD COLUMN active boolean NOT NULL DEFAULT true;
ALTER TABLE public.deals ADD COLUMN staff_active boolean NOT NULL DEFAULT true, ADD COLUMN status text NOT NULL DEFAULT 'approved' CHECK (status IN ('approved','pending','rejected'));
CREATE OR REPLACE FUNCTION public.guard_content_activation() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.can_edit_content(auth.uid()) THEN
  IF TG_OP='INSERT' THEN NEW.active:=true; ELSE NEW.active:=OLD.active; END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER courses_guard_activation BEFORE INSERT OR UPDATE ON public.courses FOR EACH ROW EXECUTE FUNCTION public.guard_content_activation();
CREATE TRIGGER products_guard_activation BEFORE INSERT OR UPDATE ON public.products FOR EACH ROW EXECUTE FUNCTION public.guard_content_activation();
CREATE TRIGGER businesses_guard_activation BEFORE INSERT OR UPDATE ON public.businesses FOR EACH ROW EXECUTE FUNCTION public.guard_content_activation();
CREATE OR REPLACE FUNCTION public.guard_deal_review() RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER SET search_path=public AS $$
BEGIN
 IF auth.uid() IS NOT NULL AND NOT public.can_edit_content(auth.uid()) THEN
  IF TG_OP='INSERT' THEN NEW.status:='pending'; NEW.staff_active:=true;
  ELSE
   NEW.business_id:=OLD.business_id; NEW.staff_active:=OLD.staff_active;
   IF (NEW.partner,NEW.category,NEW.discount,NEW.city,NEW.terms) IS DISTINCT FROM (OLD.partner,OLD.category,OLD.discount,OLD.city,OLD.terms) THEN NEW.status:='pending'; ELSE NEW.status:=OLD.status; END IF;
  END IF;
 END IF;
 RETURN NEW;
END $$;
CREATE TRIGGER deals_guard_review BEFORE INSERT OR UPDATE ON public.deals FOR EACH ROW EXECUTE FUNCTION public.guard_deal_review();
ALTER POLICY "public read" ON public.news USING (active OR public.can_edit_content(auth.uid()));
ALTER POLICY "public read" ON public.events USING (active OR public.can_edit_content(auth.uid()));
ALTER POLICY "scholarships public read" ON public.scholarships USING (active OR public.can_edit_content(auth.uid()));
ALTER POLICY "public read" ON public.branches USING (active OR public.can_edit_content(auth.uid()));
ALTER POLICY "public read" ON public.faqs USING (active OR public.can_edit_content(auth.uid()));
ALTER POLICY "public read" ON public.courses USING ((active AND status='approved') OR submitted_by=auth.uid() OR public.can_edit_content(auth.uid()));
ALTER POLICY "public read" ON public.products USING ((active AND status='approved') OR submitted_by=auth.uid() OR public.can_edit_content(auth.uid()));
ALTER POLICY "approved or own or staff read" ON public.businesses USING ((active AND status='approved') OR owner_id=auth.uid() OR public.can_edit_content(auth.uid()));
CREATE OR REPLACE FUNCTION public.business_is_approved(_business_id uuid) RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path=public AS $$ SELECT EXISTS (SELECT 1 FROM public.businesses WHERE id=_business_id AND status='approved' AND active) $$;
ALTER POLICY "public read" ON public.deals USING ((active AND staff_active AND status='approved' AND (business_id IS NULL OR public.business_is_approved(business_id))) OR public.can_edit_content(auth.uid()) OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.id=business_id AND b.owner_id=auth.uid()));