  -- Members may update payment fields only, not coin_balance (credits via admin/RPC)

  CREATE OR REPLACE FUNCTION public.guard_member_wallet_balance()
  RETURNS trigger
  LANGUAGE plpgsql
  AS $$
  BEGIN
    IF coalesce(current_setting('wallet.balance_system_update', true), '') = '1' THEN
      RETURN NEW;
    END IF;

    IF auth.uid() = OLD.user_id
      AND NEW.coin_balance IS DISTINCT FROM OLD.coin_balance
      AND EXISTS (
        SELECT 1 FROM public.profiles
        WHERE id = auth.uid() AND role = 'member'::text
      )
    THEN
      RAISE EXCEPTION 'Coin balance can only change through purchases or approved top-ups';
    END IF;
    RETURN NEW;
  END;
  $$;

  DROP TRIGGER IF EXISTS member_wallets_guard_balance ON public.member_wallets;
  CREATE TRIGGER member_wallets_guard_balance
    BEFORE UPDATE ON public.member_wallets
    FOR EACH ROW
    EXECUTE FUNCTION public.guard_member_wallet_balance();
