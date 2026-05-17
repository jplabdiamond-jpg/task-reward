-- CPX Research ポストバック受信テーブル
-- APP ID: 33111 / Whitelist IP: 188.40.3.73, 2a01:4f8:d0a:30ff::2, 157.90.97.92

CREATE TABLE IF NOT EXISTS tr_cpx_transactions (
  id               uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  trans_id         text NOT NULL,
  user_id          uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ext_user_id      text NOT NULL,
  status           smallint NOT NULL,      -- 1=complete, 2=cancelled(不正)
  type             text,                   -- complete / out / bonus
  amount_local     numeric(10,2) NOT NULL DEFAULT 0,
  amount_usd       numeric(10,4) NOT NULL DEFAULT 0,
  offer_id         text,
  ip_click         text,
  secure_hash      text,
  hash_verified    boolean NOT NULL DEFAULT false,
  ip_verified      boolean NOT NULL DEFAULT false,
  raw_query        jsonb,
  created_at       timestamptz NOT NULL DEFAULT now(),
  CONSTRAINT tr_cpx_transactions_trans_id_unique UNIQUE (trans_id)
);

CREATE INDEX IF NOT EXISTS tr_cpx_transactions_user_id_idx    ON tr_cpx_transactions(user_id);
CREATE INDEX IF NOT EXISTS tr_cpx_transactions_ext_user_id_idx ON tr_cpx_transactions(ext_user_id);
CREATE INDEX IF NOT EXISTS tr_cpx_transactions_created_at_idx ON tr_cpx_transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS tr_cpx_transactions_status_idx     ON tr_cpx_transactions(status);

ALTER TABLE tr_cpx_transactions ENABLE ROW LEVEL SECURITY;

CREATE POLICY "cpx_user_select"
  ON tr_cpx_transactions FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "cpx_service_all"
  ON tr_cpx_transactions FOR ALL
  USING (auth.role() = 'service_role');

-- アンケート完了時にポイントを自動付与
CREATE OR REPLACE FUNCTION tr_cpx_grant_points()
RETURNS trigger LANGUAGE plpgsql SECURITY DEFINER AS $$
BEGIN
  IF NEW.status = 1 AND NEW.hash_verified = true AND NEW.user_id IS NOT NULL THEN
    UPDATE users
    SET
      balance      = balance      + NEW.amount_local::integer,
      total_earned = total_earned + NEW.amount_local::integer,
      updated_at   = now()
    WHERE id = NEW.user_id;
  END IF;
  RETURN NEW;
END;
$$;

CREATE TRIGGER tr_cpx_grant_points_trigger
  AFTER INSERT ON tr_cpx_transactions
  FOR EACH ROW EXECUTE FUNCTION tr_cpx_grant_points();
