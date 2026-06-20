-- ============================================================
-- Member Sales Log — records every physical sale by a member
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_sales (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL CHECK (quantity > 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT member_sales_pkey PRIMARY KEY (id),
  CONSTRAINT member_sales_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id),
  CONSTRAINT member_sales_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id)
);

ALTER TABLE public.member_sales ENABLE ROW LEVEL SECURITY;

-- Members can view their own sales
DROP POLICY IF EXISTS "Members can view own sales" ON public.member_sales;
CREATE POLICY "Members can view own sales"
  ON public.member_sales FOR SELECT
  USING (auth.uid() = user_id);

-- Members can insert their own sales (via the deduct RPC)
DROP POLICY IF EXISTS "Members can insert own sales" ON public.member_sales;
CREATE POLICY "Members can insert own sales"
  ON public.member_sales FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Admins can view all sales
DROP POLICY IF EXISTS "Admins can view all sales" ON public.member_sales;
CREATE POLICY "Admins can view all sales"
  ON public.member_sales FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Indexes
CREATE INDEX IF NOT EXISTS member_sales_user_id_idx ON public.member_sales (user_id);
CREATE INDEX IF NOT EXISTS member_sales_product_id_idx ON public.member_sales (product_id);
CREATE INDEX IF NOT EXISTS member_sales_created_at_idx ON public.member_sales (created_at DESC);

COMMENT ON TABLE public.member_sales IS 'Records every physical sale by a member from their personal stock';

-- ============================================================
-- Update deduct_member_stock RPC to also log the sale
-- ============================================================
CREATE OR REPLACE FUNCTION public.deduct_member_stock(
  p_user_id uuid,
  p_product_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  v_current integer;
BEGIN
  SELECT quantity INTO v_current
  FROM public.member_stocks
  WHERE user_id = p_user_id AND product_id = p_product_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'No stock found for this product';
  END IF;

  IF v_current < p_quantity THEN
    RAISE EXCEPTION 'Insufficient stock: you have % items, but tried to sell %', v_current, p_quantity;
  END IF;

  -- Deduct stock
  UPDATE public.member_stocks
  SET quantity = quantity - p_quantity,
      updated_at = now()
  WHERE user_id = p_user_id AND product_id = p_product_id;

  -- Log the sale
  INSERT INTO public.member_sales (user_id, product_id, quantity)
  VALUES (p_user_id, p_product_id, p_quantity);
END;
$$;

COMMENT ON FUNCTION public.deduct_member_stock IS 'Safely deduct sold items from stock and log the sale';
