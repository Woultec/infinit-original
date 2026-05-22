-- Fix Super Admin RLS: use profiles email, storage QR uploads, secure channel save RPC

CREATE OR REPLACE FUNCTION public.is_super_admin()
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.profiles p
    WHERE p.id = auth.uid()
      AND lower(p.email) = lower('infinity8000corporation@gmail.com')
      AND p.role = 'admin'::text
  );
$$;

GRANT EXECUTE ON FUNCTION public.is_super_admin() TO authenticated;

-- Explicit policies (FOR ALL can miss UPDATE+SELECT combo edge cases)
DROP POLICY IF EXISTS "Super admin manages payment channels" ON public.wallet_payment_channels;

DROP POLICY IF EXISTS "Super admin updates payment channels" ON public.wallet_payment_channels;
CREATE POLICY "Super admin updates payment channels"
  ON public.wallet_payment_channels FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

DROP POLICY IF EXISTS "Super admin inserts payment channels" ON public.wallet_payment_channels;
CREATE POLICY "Super admin inserts payment channels"
  ON public.wallet_payment_channels FOR INSERT
  TO authenticated
  WITH CHECK (public.is_super_admin());

-- Storage: Super Admin can upload/update QR images (path qr/...); members use {user_id}/...
DROP POLICY IF EXISTS "Super admin uploads payment assets" ON storage.objects;
CREATE POLICY "Super admin uploads payment assets"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND public.is_super_admin()
  );

DROP POLICY IF EXISTS "Super admin updates payment assets" ON storage.objects;
CREATE POLICY "Super admin updates payment assets"
  ON storage.objects FOR UPDATE
  TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.is_super_admin())
  WITH CHECK (bucket_id = 'payment-receipts' AND public.is_super_admin());

-- Reliable save path that bypasses table RLS (still checks super admin inside)
CREATE OR REPLACE FUNCTION public.save_payment_channel(
  p_id text,
  p_account_name text DEFAULT NULL,
  p_account_number text DEFAULT NULL,
  p_qr_image_url text DEFAULT NULL,
  p_instructions text DEFAULT NULL,
  p_is_active boolean DEFAULT true
)
RETURNS public.wallet_payment_channels
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_row public.wallet_payment_channels;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only Super Admin can edit payment setup';
  END IF;

  UPDATE public.wallet_payment_channels
  SET
    account_name = p_account_name,
    account_number = p_account_number,
    qr_image_url = p_qr_image_url,
    instructions = p_instructions,
    is_active = COALESCE(p_is_active, true),
    updated_by = auth.uid(),
    updated_at = now()
  WHERE id = p_id
  RETURNING * INTO v_row;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Payment channel not found';
  END IF;

  RETURN v_row;
END;
$$;

GRANT EXECUTE ON FUNCTION public.save_payment_channel(text, text, text, text, text, boolean) TO authenticated;
