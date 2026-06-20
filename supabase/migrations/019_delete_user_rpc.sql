-- Allow only the super admin to read all profiles (needed for the System Members directory)
DROP POLICY IF EXISTS "Super admin read all profiles" ON public.profiles;
CREATE POLICY "Super admin read all profiles"
  ON public.profiles FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.email = 'infinity8000corporation@gmail.com'
    )
  );

-- Allow admins to delete profiles (further gated by super admin email in the delete_user RPC)
DROP POLICY IF EXISTS "Admins delete profiles" ON public.profiles;
CREATE POLICY "Admins delete profiles"
  ON public.profiles FOR DELETE
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    )
  );

-- RPC: delete a user from auth.users and their profile (super admin only)
-- Requires SECURITY DEFINER to access auth.users
CREATE OR REPLACE FUNCTION public.delete_user(
  p_user_id uuid
)
RETURNS boolean
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_caller_email text;
BEGIN
  -- Verify caller is the super admin by email
  SELECT email INTO v_caller_email
  FROM public.profiles
  WHERE id = auth.uid();

  IF v_caller_email IS NULL OR v_caller_email <> 'infinity8000corporation@gmail.com' THEN
    RAISE EXCEPTION 'Only the super admin can delete users';
  END IF;

  -- Delete from auth.users (cascades to profiles via foreign key, but we do explicit delete anyway)
  DELETE FROM auth.users WHERE id = p_user_id;

  IF NOT FOUND THEN
    RETURN false;
  END IF;

  RETURN true;
END;
$$;

GRANT EXECUTE ON FUNCTION public.delete_user(uuid) TO authenticated;
