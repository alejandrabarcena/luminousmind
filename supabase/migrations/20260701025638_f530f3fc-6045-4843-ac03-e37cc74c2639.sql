DROP POLICY IF EXISTS "Public avatar access" ON storage.objects;

CREATE POLICY "Authenticated avatar access"
ON storage.objects
FOR SELECT
TO authenticated
USING (bucket_id = 'avatars');