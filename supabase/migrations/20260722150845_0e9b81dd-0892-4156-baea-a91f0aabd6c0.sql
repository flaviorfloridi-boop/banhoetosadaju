
-- pet-photos: tutor pode ler fotos dos próprios pets; equipe faz tudo
CREATE POLICY "Tutor lê suas fotos" ON storage.objects FOR SELECT
  USING (bucket_id = 'pet-photos' AND (
    public.is_staff(auth.uid())
    OR EXISTS (
      SELECT 1 FROM public.pet_photos ph
      JOIN public.pets p ON p.id = ph.pet_id
      WHERE ph.storage_path = storage.objects.name AND p.tutor_id = auth.uid()
    )
  ));
CREATE POLICY "Equipe upload pet-photos" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'pet-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Equipe update pet-photos" ON storage.objects FOR UPDATE
  USING (bucket_id = 'pet-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Equipe delete pet-photos" ON storage.objects FOR DELETE
  USING (bucket_id = 'pet-photos' AND public.is_staff(auth.uid()));

-- gallery-photos: leitura pública, equipe gerencia
CREATE POLICY "Galeria pública leitura" ON storage.objects FOR SELECT
  USING (bucket_id = 'gallery-photos');
CREATE POLICY "Equipe upload galeria" ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'gallery-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Equipe update galeria" ON storage.objects FOR UPDATE
  USING (bucket_id = 'gallery-photos' AND public.is_staff(auth.uid()));
CREATE POLICY "Equipe delete galeria" ON storage.objects FOR DELETE
  USING (bucket_id = 'gallery-photos' AND public.is_staff(auth.uid()));
