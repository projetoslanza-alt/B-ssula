-- Storage buckets e políticas

INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES
  ('course-covers', 'course-covers', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp']),
  ('course-materials', 'course-materials', false, 52428800, ARRAY['application/pdf', 'application/vnd.ms-powerpoint', 'application/vnd.openxmlformats-officedocument.presentationml.presentation', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('course-videos', 'course-videos', false, 524288000, ARRAY['video/mp4', 'video/webm']),
  ('certificate-assets', 'certificate-assets', false, 10485760, ARRAY['image/png', 'image/jpeg', 'application/pdf']),
  ('avatars', 'avatars', false, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- Política: upload autenticado no bucket do tenant
CREATE POLICY storage_tenant_upload ON storage.objects FOR INSERT TO authenticated
  WITH CHECK (
    bucket_id IN ('course-covers', 'course-materials', 'course-videos', 'certificate-assets', 'avatars')
    AND (storage.foldername(name))[1] = user_active_tenant_id()::text
  );

CREATE POLICY storage_tenant_read ON storage.objects FOR SELECT TO authenticated
  USING (
    bucket_id IN ('course-covers', 'course-materials', 'course-videos', 'certificate-assets', 'avatars')
    AND (
      (storage.foldername(name))[1] = user_active_tenant_id()::text
      OR bucket_id = 'avatars' AND (storage.foldername(name))[1] = auth.uid()::text
    )
  );

CREATE POLICY storage_tenant_delete ON storage.objects FOR DELETE TO authenticated
  USING (
    bucket_id IN ('course-covers', 'course-materials', 'course-videos', 'certificate-assets', 'avatars')
    AND (storage.foldername(name))[1] = user_active_tenant_id()::text
    AND has_permission('learning.course.create')
  );
