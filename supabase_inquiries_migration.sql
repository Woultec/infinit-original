-- Migration: Create or Update Inquiries table and setup RLS
-- Run this in your Supabase SQL Editor

-- 1. Create the table if it doesn't exist
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL
);

-- 2. Ensure all columns exist (in case the table was created differently before)
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS name TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS email TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS subject TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS message TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'pending';
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS zoom_link TEXT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now());

-- 3. Fix full_name constraint issue
-- If a column "full_name" exists and it is NOT NULL, it might be causing issues 
-- because our code sends "name". Let's make it nullable or rename it.
DO $$
BEGIN
    -- If full_name exists, make it nullable so it doesn't block inserts
    IF EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'inquiries' AND column_name = 'full_name') THEN
        ALTER TABLE inquiries ALTER COLUMN full_name DROP NOT NULL;
    END IF;
END $$;

-- 4. Add the status constraint if it doesn't exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'inquiries_status_check') THEN
        ALTER TABLE inquiries ADD CONSTRAINT inquiries_status_check 
        CHECK (status IN ('pending', 'contacted', 'approved', 'rejected'));
    END IF;
END $$;

-- 5. Enable RLS
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;

-- 6. Policies
-- Allow anyone to insert (from landing page)
DROP POLICY IF EXISTS "Allow public insertion" ON inquiries;
CREATE POLICY "Allow public insertion" ON inquiries
  FOR INSERT WITH CHECK (true);

-- Allow admins to view all inquiries
DROP POLICY IF EXISTS "Allow admins to view inquiries" ON inquiries;
CREATE POLICY "Allow admins to view inquiries" ON inquiries
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to update inquiries (e.g., status, zoom link)
DROP POLICY IF EXISTS "Allow admins to update inquiries" ON inquiries;
CREATE POLICY "Allow admins to update inquiries" ON inquiries
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- Allow admins to delete inquiries
DROP POLICY IF EXISTS "Allow admins to delete inquiries" ON inquiries;
CREATE POLICY "Allow admins to delete inquiries" ON inquiries
  FOR DELETE USING (
    EXISTS (
      SELECT 1 FROM profiles
      WHERE profiles.id = auth.uid()
      AND profiles.role = 'admin'
    )
  );

-- 7. Enable realtime for inquiries
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_publication_tables 
    WHERE pubname = 'supabase_realtime' 
    AND schemaname = 'public' 
    AND tablename = 'inquiries'
  ) THEN
    ALTER PUBLICATION supabase_realtime ADD TABLE inquiries;
  END IF;
END $$;

-- 8. Force a schema cache reload
COMMENT ON TABLE inquiries IS 'Table for storing landing page inquiries';
