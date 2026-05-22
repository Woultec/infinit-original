-- Payment channels (GCash QR, etc.) + receipt reference on top-up requests

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

CREATE TABLE IF NOT EXISTS public.wallet_payment_channels (
  id text NOT NULL,
  label text NOT NULL,
  account_name text,
  account_number text,
  qr_image_url text,
  instructions text,
  is_active boolean NOT NULL DEFAULT true,
  updated_by uuid REFERENCES public.profiles (id),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallet_payment_channels_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_payment_channels_id_check CHECK (
    id = ANY (ARRAY['gcash'::text, 'bank_transfer'::text, 'paypal'::text, 'other'::text])
  )
);

INSERT INTO public.wallet_payment_channels (id, label, instructions)
VALUES
  ('gcash', 'GCash', 'Scan the QR code, pay the exact amount, then submit your reference number below.'),
  ('bank_transfer', 'Bank transfer', 'Transfer to the account shown, then submit your reference number.'),
  ('paypal', 'PayPal', 'Send payment, then submit your transaction reference.'),
  ('other', 'Other', 'Follow the instructions provided by the admin.')
ON CONFLICT (id) DO NOTHING;

ALTER TABLE public.wallet_transactions
  ADD COLUMN IF NOT EXISTS reference_number text,
  ADD COLUMN IF NOT EXISTS receipt_image_url text,
  ADD COLUMN IF NOT EXISTS payment_channel text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'wallet_transactions_payment_channel_fkey'
  ) THEN
    ALTER TABLE public.wallet_transactions
      ADD CONSTRAINT wallet_transactions_payment_channel_fkey
      FOREIGN KEY (payment_channel) REFERENCES public.wallet_payment_channels (id);
  END IF;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

ALTER TABLE public.wallet_payment_channels ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Anyone authenticated can view active payment channels" ON public.wallet_payment_channels;
CREATE POLICY "Anyone authenticated can view active payment channels"
  ON public.wallet_payment_channels FOR SELECT
  TO authenticated
  USING (is_active = true OR public.is_super_admin());

DROP POLICY IF EXISTS "Super admin manages payment channels" ON public.wallet_payment_channels;
DROP POLICY IF EXISTS "Super admin updates payment channels" ON public.wallet_payment_channels;
CREATE POLICY "Super admin updates payment channels"
  ON public.wallet_payment_channels FOR UPDATE
  TO authenticated
  USING (public.is_super_admin())
  WITH CHECK (public.is_super_admin());

-- Receipt uploads bucket
INSERT INTO storage.buckets (id, name, public)
VALUES ('payment-receipts', 'payment-receipts', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Payment receipts are publicly readable" ON storage.objects;
CREATE POLICY "Payment receipts are publicly readable"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'payment-receipts');

DROP POLICY IF EXISTS "Members upload own payment receipts" ON storage.objects;
CREATE POLICY "Members upload own payment receipts"
  ON storage.objects FOR INSERT
  TO authenticated
  WITH CHECK (
    bucket_id = 'payment-receipts'
    AND (storage.foldername(name))[1] = auth.uid()::text
  );

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

DROP POLICY IF EXISTS "Super admin deletes payment receipts" ON storage.objects;
CREATE POLICY "Super admin deletes payment receipts"
  ON storage.objects FOR DELETE
  TO authenticated
  USING (bucket_id = 'payment-receipts' AND public.is_super_admin());

COMMENT ON TABLE public.wallet_payment_channels IS 'Super Admin payment QR and account details for member top-ups';
