-- Atomic checkout: create order, line item, and decrement stock
CREATE OR REPLACE FUNCTION public.place_order(
  p_product_id uuid,
  p_quantity integer
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

  INSERT INTO public.orders (user_id)
  VALUES (v_user_id)
  RETURNING id INTO v_order_id;

  INSERT INTO public.order_items (order_id, product_id, quantity, unit_price)
  VALUES (v_order_id, p_product_id, p_quantity, v_product.member_price);

  UPDATE public.products
  SET stock = stock - p_quantity, updated_at = now()
  WHERE id = p_product_id;

  RETURN v_order_id;
END;
$$;

GRANT EXECUTE ON FUNCTION public.place_order(uuid, integer) TO authenticated;
