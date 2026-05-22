-- Checkout with Infinity Coin + top-up request / approval RPCs

DROP FUNCTION IF EXISTS public.place_order(uuid, integer);

CREATE OR REPLACE FUNCTION public.place_order(
  p_product_id uuid,
  p_quantity integer,
  p_use_coins boolean DEFAULT false
)
RETURNS uuid
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_user_id uuid;
  v_product public.products%ROWTYPE;
  v_order_id uuid;
  v_unit_price numeric(10, 2);
  v_total numeric(12, 2);
  v_balance numeric(12, 2);
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_quantity IS NULL OR p_quantity < 1 THEN
    RAISE EXCEPTION 'Invalid quantity';
  END IF;

  SELECT * INTO v_product
  FROM public.products
  WHERE id = p_product_id AND status = 'Active'::text
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Product not available';
  END IF;

  IF v_product.stock < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock';
  END IF;

  IF p_use_coins THEN
    v_unit_price := public.product_coin_price(v_product);
    v_total := v_unit_price * p_quantity;

    PERFORM public.ensure_member_wallet(v_user_id);

    SELECT coin_balance INTO v_balance
    FROM public.member_wallets
    WHERE user_id = v_user_id
    FOR UPDATE;

    IF v_balance IS NULL OR v_balance < v_total THEN
      RAISE EXCEPTION 'Insufficient Infinity Coins';
    END IF;

    UPDATE public.member_wallets
    SET coin_balance = coin_balance - v_total, updated_at = now()
    WHERE user_id = v_user_id;

    INSERT INTO public.orders (user_id, payment_method)
    VALUES (v_user_id, 'infinity_coin'::text)
    RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, p_product_id, p_quantity, v_unit_price);

    INSERT INTO public.wallet_transactions (user_id, amount, type, status, order_id, notes)
    VALUES (
      v_user_id,
      -v_total,
      'purchase'::text,
      'completed'::text,
      v_order_id,
      'Purchase: ' || v_product.name
    );
  ELSE
    v_unit_price := v_product.member_price;

    INSERT INTO public.orders (user_id, payment_method)
    VALUES (v_user_id, 'standard'::text)
    RETURNING id INTO v_order_id;

    INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
    VALUES (v_order_id, p_product_id, p_quantity, v_unit_price);
  END IF;

  UPDATE public.products
  SET stock = stock - p_quantity, updated_at = now()
  WHERE id = p_product_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(uuid, integer, boolean) TO authenticated;

CREATE OR REPLACE FUNCTION public.request_coin_topup(
  p_amount numeric,
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
BEGIN
  v_user_id := auth.uid();
  IF v_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_amount IS NULL OR p_amount <= 0 THEN
    RAISE EXCEPTION 'Amount must be greater than zero';
  END IF;

  PERFORM public.ensure_member_wallet(v_user_id);

  INSERT INTO public.wallet_transactions (user_id, amount, type, status, notes)
  VALUES (v_user_id, p_amount, 'top_up_request'::text, 'pending'::text, p_notes)
  RETURNING id INTO v_tx_id;

  RETURN v_tx_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.request_coin_topup(numeric, text) TO authenticated;

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
  IF NOT EXISTS (
    SELECT 1 FROM public.profiles
    WHERE id = auth.uid() AND role = 'admin'::text
  ) THEN
    RAISE EXCEPTION 'Admin only';
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

GRANT EXECUTE ON FUNCTION public.review_coin_topup(uuid, boolean) TO authenticated;
