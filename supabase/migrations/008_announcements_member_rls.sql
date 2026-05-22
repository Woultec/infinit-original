-- Allow members to read live announcements; admins retain full access

ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members read live announcements" ON public.announcements;
CREATE POLICY "Members read live announcements"
  ON public.announcements FOR SELECT
  USING (
    status = 'Active'::text
    AND audience = ANY (ARRAY['all'::text, 'members'::text])
  );

DROP POLICY IF EXISTS "Admins read all announcements" ON public.announcements;
CREATE POLICY "Admins read all announcements"
  ON public.announcements FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "Admins insert announcements" ON public.announcements;
CREATE POLICY "Admins insert announcements"
  ON public.announcements FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "Admins update announcements" ON public.announcements;
CREATE POLICY "Admins update announcements"
  ON public.announcements FOR UPDATE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "Admins delete announcements" ON public.announcements;
CREATE POLICY "Admins delete announcements"
  ON public.announcements FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    )
  );
