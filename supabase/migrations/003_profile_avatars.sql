-- Add avatar_url column to profiles if it doesn't exist
ALTER TABLE public.profiles ADD COLUMN IF NOT EXISTS avatar_url text;

-- Create avatars storage bucket if it doesn't exist
INSERT INTO storage.buckets (id, name, public)
VALUES ('avatars', 'avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Set up Row-Level Security for the avatars bucket
-- 1. Allow public read access to all files in the avatars bucket
CREATE POLICY "Avatar images are publicly accessible."
  ON storage.objects FOR SELECT
  USING ( bucket_id = 'avatars' );

-- 2. Allow authenticated users to upload avatar images
CREATE POLICY "Users can upload their own avatar."
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK ( bucket_id = 'avatars' );

-- 3. Allow authenticated users to update their avatar images
CREATE POLICY "Users can update their own avatar."
  ON storage.objects FOR UPDATE
  TO authenticated
  USING ( bucket_id = 'avatars' );

-- 4. Allow authenticated users to delete their avatar images
CREATE POLICY "Users can delete their own avatar."
  ON storage.objects FOR DELETE
  TO authenticated
  USING ( bucket_id = 'avatars' );
