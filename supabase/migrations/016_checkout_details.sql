-- Migration 016: Allow storing checkout details in orders.notes
-- Extends place_order RPC to accept delivery info and payment channel

DROP FUNCTION IF EXISTS public.place_order(uuid, integer, boolean);

CREATE OR REPLACE FUNCTION public.place_order(
  p_product_id uuid,
  p_quantity integer,
  p_use_coins boolean DEFAULT false,
  p_notes text DEFAULT NULL
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

    INSERT INTO public.orders (user_id, payment_method, notes)
    VALUES (v_user_id, 'infinity_coin'::text, p_notes)
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

    INSERT INTO public.orders (user_id, payment_method, notes)
    VALUES (v_user_id, 'standard'::text, p_notes)
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

GRANT EXECUTE ON FUNCTION public.place_order(uuid, integer, boolean, text) TO authenticated;
