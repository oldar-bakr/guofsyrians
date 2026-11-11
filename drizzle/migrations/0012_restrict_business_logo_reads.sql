DROP POLICY IF EXISTS "logos read" ON storage.objects;
CREATE POLICY "logos read" ON storage.objects FOR SELECT TO authenticated
USING (
  bucket_id = 'business-logos' AND (
    (storage.foldername(name))[1] = (auth.uid())::text
    OR public.can_edit_content(auth.uid())
    OR EXISTS (SELECT 1 FROM public.businesses b WHERE b.owner_id::text = (storage.foldername(name))[1] AND b.status = 'approved')
  )
);