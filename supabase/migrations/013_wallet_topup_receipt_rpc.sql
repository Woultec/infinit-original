-- Top-up with reference number; only Super Admin verifies payments

DROP FUNCTION IF EXISTS public.request_coin_topup(numeric, text);

CREATE OR REPLACE FUNCTION public.request_coin_topup(
  p_amount numeric,
  p_reference_number text,
  p_payment_channel text,
  p_receipt_url text DEFAULT NULL,
  p_notes text DEFAULT NULL
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_tx_id uuid;
  v_ref text;
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  v_ref := trim(coalesce(p_reference_number, ''));
  IF v_ref = '' THEN
    RAISE EXCEPTION 'Reference number is required';
  END IF;

  IF p_payment_channel IS NULL OR NOT EXISTS (
    SELECT 1 FROM public.wallet_payment_channels
    WHERE id = p_payment_channel AND is_active = true
  ) THEN
    RAISE EXCEPTION 'Invalid payment method';
  END IF;

  PERFORM public.ensure_member_wallet(v_user_id);

  INSERT INTO public.wallet_transactions (
    user_id,
    amount,
    type,
    status,
    notes,
    reference_number,
    receipt_image_url,
    payment_channel
  )
  VALUES (
    v_user_id,
    p_amount,
    'top_up_request'::text,
    'pending'::text,
    p_notes,
    v_ref,
    p_receipt_url,
    p_payment_channel
  )
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_coin_topup(numeric, text, text, text, text) TO authenticated;

CREATE OR REPLACE FUNCTION public.review_coin_topup(
  p_transaction_id uuid,
  p_approve boolean
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_tx public.wallet_transactions%ROWTYPE;
BEGIN
  IF NOT public.is_super_admin() THEN
    RAISE EXCEPTION 'Only Super Admin can verify payments';
  END IF;

  SELECT * INTO v_tx
  FROM public.wallet_transactions
  WHERE id = p_transaction_id AND type = 'top_up_request'::text AND status = 'pending'::text
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Pending top-up not found';
  END IF;

  IF p_approve THEN
    PERFORM public.ensure_member_wallet(v_tx.user_id);

    UPDATE public.member_wallets
    SET coin_balance = coin_balance + v_tx.amount, updated_at = now()
    WHERE user_id = v_tx.user_id;

    UPDATE public.wallet_transactions
    SET status = 'completed'::text, type = 'top_up'::text
    WHERE id = p_transaction_id;
  ELSE
    UPDATE public.wallet_transactions
    SET status = 'rejected'::text
    WHERE id = p_transaction_id;
  END IF;
END;
$$;
