-- Infinity Coin wallet, product coin pricing, and payment setup

-- Discounted price when paying with Infinity Coin (0 = auto from member_price + default %)
ALTER TABLE public.products
  ADD COLUMN IF NOT EXISTS coin_price numeric(10, 2) NOT NULL DEFAULT 0;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'products_coin_price_check'
  ) THEN
    ALTER TABLE public.products
      ADD CONSTRAINT products_coin_price_check CHECK (coin_price >= 0::numeric);
  END IF;
END $$;

ALTER TABLE public.orders
  ADD COLUMN IF NOT EXISTS payment_method text NOT NULL DEFAULT 'standard'::text;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'orders_payment_method_check'
  ) THEN
    ALTER TABLE public.orders
      ADD CONSTRAINT orders_payment_method_check CHECK (
        payment_method = ANY (ARRAY['standard'::text, 'infinity_coin'::text])
      );
  END IF;
END $$;

-- One wallet per member
CREATE TABLE IF NOT EXISTS public.member_wallets (
  user_id uuid NOT NULL,
  coin_balance numeric(12, 2) NOT NULL DEFAULT 0
    CHECK (coin_balance >= 0::numeric),
  payment_method text,
  payment_account_name text,
  payment_account_number text,
  payment_notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  updated_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT member_wallets_pkey PRIMARY KEY (user_id),
  CONSTRAINT member_wallets_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS public.wallet_transactions (
  id uuid NOT NULL DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL,
  amount numeric(12, 2) NOT NULL,
  type text NOT NULL
    CHECK (type = ANY (ARRAY[
      'top_up_request'::text,
      'top_up'::text,
      'purchase'::text,
      'refund'::text,
      'adjustment'::text
    ])),
  status text NOT NULL DEFAULT 'completed'::text
    CHECK (status = ANY (ARRAY[
      'pending'::text,
      'completed'::text,
      'rejected'::text
    ])),
  order_id uuid,
  notes text,
  created_at timestamp with time zone NOT NULL DEFAULT now(),
  CONSTRAINT wallet_transactions_pkey PRIMARY KEY (id),
  CONSTRAINT wallet_transactions_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.profiles (id) ON DELETE CASCADE,
  CONSTRAINT wallet_transactions_order_id_fkey FOREIGN KEY (order_id) REFERENCES public.orders (id) ON DELETE SET NULL
);

CREATE INDEX IF NOT EXISTS wallet_transactions_user_id_idx ON public.wallet_transactions (user_id);
CREATE INDEX IF NOT EXISTS wallet_transactions_status_idx ON public.wallet_transactions (status);

-- Resolve coin price: explicit coin_price, else 10% off member_price
CREATE OR REPLACE FUNCTION public.product_coin_price(p products)
RETURNS numeric
LANGUAGE sql
IMMUTABLE
AS $$
  SELECT CASE
    WHEN p.coin_price > 0::numeric THEN p.coin_price
    ELSE round(p.member_price * 0.9, 2)
  END;
$$;

CREATE OR REPLACE FUNCTION public.ensure_member_wallet(p_user_id uuid)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.member_wallets (user_id)
  VALUES (p_user_id)
  ON CONFLICT (user_id) DO NOTHING;
END;
$$;

-- Row Level Security
ALTER TABLE public.member_wallets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.wallet_transactions ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Members manage own wallet" ON public.member_wallets;
CREATE POLICY "Members manage own wallet"
  ON public.member_wallets FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Admins manage all wallets" ON public.member_wallets;
CREATE POLICY "Admins manage all wallets"
  ON public.member_wallets FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    )
  );

DROP POLICY IF EXISTS "Members read own transactions" ON public.wallet_transactions;
CREATE POLICY "Members read own transactions"
  ON public.wallet_transactions FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Members request top up" ON public.wallet_transactions;
CREATE POLICY "Members request top up"
  ON public.wallet_transactions FOR INSERT
  WITH CHECK (
    auth.uid() = user_id
    AND type = 'top_up_request'::text
    AND status = 'pending'::text
    AND amount > 0::numeric
  );

DROP POLICY IF EXISTS "Admins manage transactions" ON public.wallet_transactions;
CREATE POLICY "Admins manage transactions"
  ON public.wallet_transactions FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'::text
    )
  );

COMMENT ON TABLE public.member_wallets IS 'Member Infinity Coin balance and payout details';
COMMENT ON TABLE public.wallet_transactions IS 'Coin credits, debits, and top-up requests';
