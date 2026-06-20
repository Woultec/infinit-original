-- ============================================================
-- Member Stocks — tracks inventory each member owns for resale
-- ============================================================

CREATE TABLE IF NOT EXISTS public.member_stocks (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  product_id uuid NOT NULL,
  quantity integer NOT NULL DEFAULT 0 CHECK (quantity >= 0),
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT member_stocks_pkey PRIMARY KEY (id),
  CONSTRAINT member_stocks_user_product_unique UNIQUE (user_id, product_id),
  CONSTRAINT member_stocks_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id),
  CONSTRAINT member_stocks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products (id)
);

ALTER TABLE public.member_stocks ENABLE ROW LEVEL SECURITY;

-- Members can view their own stocks
DROP POLICY IF EXISTS "Members can view own stocks" ON public.member_stocks;
CREATE POLICY "Members can view own stocks"
  ON public.member_stocks FOR SELECT
  USING (auth.uid() = user_id);

-- Members can insert their own stocks (app-level upsert for purchase credit)
DROP POLICY IF EXISTS "Members can insert own stocks" ON public.member_stocks;
CREATE POLICY "Members can insert own stocks"
  ON public.member_stocks FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Members can update their own stocks
DROP POLICY IF EXISTS "Members can update own stocks" ON public.member_stocks;
CREATE POLICY "Members can update own stocks"
  ON public.member_stocks FOR UPDATE
  USING (auth.uid() = user_id);

-- Admins can view all member stocks
DROP POLICY IF EXISTS "Admins can view all member stocks" ON public.member_stocks;
CREATE POLICY "Admins can view all member stocks"
  ON public.member_stocks FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Indexes for performance
CREATE INDEX IF NOT EXISTS member_stocks_user_id_idx ON public.member_stocks (user_id);
CREATE INDEX IF NOT EXISTS member_stocks_product_id_idx ON public.member_stocks (product_id);

COMMENT ON TABLE public.member_stocks IS 'Tracks each member inventory of products they purchased for resale';

-- ============================================================
-- RPC: upsert_member_stock — add quantity to existing row or insert
-- ============================================================
CREATE OR REPLACE FUNCTION public.upsert_member_stock(
  p_user_id uuid,
  p_product_id uuid,
  p_quantity integer
)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.member_stocks (user_id, product_id, quantity)
  VALUES (p_user_id, p_product_id, p_quantity)
  ON CONFLICT (user_id, product_id)
  DO UPDATE SET
    quantity = member_stocks.quantity + p_quantity,
    updated_at = now();
END;
$$;

COMMENT ON FUNCTION public.upsert_member_stock IS 'Credit stock to a member inventory, creating or adding to existing row';

-- ============================================================
-- RPC: deduct_member_stock — safely deduct sold items from stock
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

  UPDATE public.member_stocks
  SET quantity = quantity - p_quantity,
      updated_at = now()
  WHERE user_id = p_user_id AND product_id = p_product_id;
END;
$$;

COMMENT ON FUNCTION public.deduct_member_stock IS 'Safely deduct sold items from a member stock, raising an error if insufficient';
