-- =============================================
-- 003: アフィリエイト紐付けトラッキング
-- 目的: ASP→運営→ユーザーの報酬突合を保証する5項目を実装
--   1. user_id を直接ASPに渡さず click_id 経由で間接参照
--   2. asp_order_id の UNIQUE による冪等性
--   3. 承認/否認の段階管理 (pending → approved/rejected)
--   4. ユーザー報酬確定タイミング制御 (pending中は出金不可)
--   5. Postback署名検証用カラム
-- 既存テーブル名は tr_ プレフィックス踏襲
-- =============================================

-- 拡張: campaigns に ASP情報を追加（既存カラム非破壊・追加のみ）
ALTER TABLE tr_campaigns
  ADD COLUMN IF NOT EXISTS asp_provider TEXT,
  ADD COLUMN IF NOT EXISTS asp_program_id TEXT,
  ADD COLUMN IF NOT EXISTS tracking_url_template TEXT,
  ADD COLUMN IF NOT EXISTS pointback_allowed BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS approval_lead_days INTEGER NOT NULL DEFAULT 30;

COMMENT ON COLUMN tr_campaigns.asp_provider IS 'a8/bybit/clickbank等';
COMMENT ON COLUMN tr_campaigns.tracking_url_template IS '{click_id}プレースホルダ含むURL';
COMMENT ON COLUMN tr_campaigns.pointback_allowed IS 'ユーザー還元が許可された案件か';
COMMENT ON COLUMN tr_campaigns.approval_lead_days IS '成果確定までのASP側標準日数';

-- 拡張: users に確定残高カラム追加（既存 balance は非破壊で温存）
ALTER TABLE tr_users
  ADD COLUMN IF NOT EXISTS confirmed_balance INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS pending_balance INTEGER NOT NULL DEFAULT 0;

COMMENT ON COLUMN tr_users.confirmed_balance IS 'ASP承認済み = 出金可能な残高';
COMMENT ON COLUMN tr_users.pending_balance IS 'ASP承認待ち = 出金不可の残高';

-- =============================================
-- tr_affiliate_clicks: クリック発行台帳
-- user_id は内部のみ。ASPへは click_id (短縮UUID) のみ渡す
-- =============================================
CREATE TABLE IF NOT EXISTS tr_affiliate_clicks (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  click_id TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES tr_users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES tr_campaigns(id) ON DELETE CASCADE,
  asp_provider TEXT NOT NULL,
  ip_address INET,
  user_agent TEXT NOT NULL DEFAULT '',
  fingerprint TEXT NOT NULL DEFAULT '',
  status TEXT NOT NULL DEFAULT 'clicked' CHECK (status IN ('clicked','converted','expired')),
  clicked_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ NOT NULL DEFAULT (now() + INTERVAL '90 days')
);

CREATE INDEX IF NOT EXISTS idx_clicks_click_id ON tr_affiliate_clicks(click_id);
CREATE INDEX IF NOT EXISTS idx_clicks_user_campaign ON tr_affiliate_clicks(user_id, campaign_id);
CREATE INDEX IF NOT EXISTS idx_clicks_provider_time ON tr_affiliate_clicks(asp_provider, clicked_at DESC);

-- =============================================
-- tr_asp_conversions: ASPから取得した成果データ
-- (asp_provider, asp_order_id) UNIQUE で冪等性保証
-- =============================================
CREATE TABLE IF NOT EXISTS tr_asp_conversions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asp_provider TEXT NOT NULL,
  asp_order_id TEXT NOT NULL,
  click_id TEXT,
  matched_click_uuid UUID REFERENCES tr_affiliate_clicks(id),
  matched_user_id UUID REFERENCES tr_users(id),
  matched_campaign_id UUID REFERENCES tr_campaigns(id),
  reward_amount_jpy INTEGER NOT NULL DEFAULT 0,
  user_payout_jpy INTEGER NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','approved','rejected','cancelled')),
  match_method TEXT NOT NULL DEFAULT 'subid'
    CHECK (match_method IN ('subid','fingerprint','manual','unmatched')),
  occurred_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  approved_at TIMESTAMPTZ,
  rejected_at TIMESTAMPTZ,
  rejection_reason TEXT,
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  raw_payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_asp_order UNIQUE (asp_provider, asp_order_id)
);

CREATE INDEX IF NOT EXISTS idx_conv_status ON tr_asp_conversions(status);
CREATE INDEX IF NOT EXISTS idx_conv_click_id ON tr_asp_conversions(click_id);
CREATE INDEX IF NOT EXISTS idx_conv_matched_user ON tr_asp_conversions(matched_user_id);
CREATE INDEX IF NOT EXISTS idx_conv_unmatched ON tr_asp_conversions(matched_user_id) WHERE matched_user_id IS NULL;

CREATE TRIGGER trg_asp_conversions_updated_at BEFORE UPDATE ON tr_asp_conversions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- tr_user_rewards: ユーザー報酬台帳（出金可否判定の真実）
-- pending → confirmed → paid のライフサイクル
-- =============================================
CREATE TABLE IF NOT EXISTS tr_user_rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES tr_users(id) ON DELETE CASCADE,
  conversion_id UUID NOT NULL REFERENCES tr_asp_conversions(id) ON DELETE RESTRICT,
  amount_jpy INTEGER NOT NULL CHECK (amount_jpy >= 0),
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending','confirmed','paid','cancelled')),
  confirmed_at TIMESTAMPTZ,
  paid_at TIMESTAMPTZ,
  cancelled_at TIMESTAMPTZ,
  withdrawal_id UUID REFERENCES tr_withdrawals(id),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT uq_conversion_user UNIQUE (conversion_id)
);

CREATE INDEX IF NOT EXISTS idx_user_rewards_user ON tr_user_rewards(user_id);
CREATE INDEX IF NOT EXISTS idx_user_rewards_status ON tr_user_rewards(status);
CREATE INDEX IF NOT EXISTS idx_user_rewards_user_status ON tr_user_rewards(user_id, status);

CREATE TRIGGER trg_user_rewards_updated_at BEFORE UPDATE ON tr_user_rewards
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- tr_asp_webhook_logs: 受信ログ（再現/監査用）
-- =============================================
CREATE TABLE IF NOT EXISTS tr_asp_webhook_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  asp_provider TEXT NOT NULL,
  signature_verified BOOLEAN NOT NULL DEFAULT false,
  http_status INTEGER NOT NULL,
  payload JSONB NOT NULL DEFAULT '{}'::jsonb,
  headers JSONB NOT NULL DEFAULT '{}'::jsonb,
  error_message TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_logs_provider_time
  ON tr_asp_webhook_logs(asp_provider, created_at DESC);

-- =============================================
-- 関数: 成果ステータス変更時にユーザー残高を再計算
-- pending → confirmed: pending_balance 減 / confirmed_balance 増
-- pending/confirmed → cancelled or rejected: 該当残高 減
-- =============================================
CREATE OR REPLACE FUNCTION recalc_user_balance(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_pending INTEGER;
  v_confirmed INTEGER;
BEGIN
  SELECT COALESCE(SUM(amount_jpy), 0) INTO v_pending
  FROM tr_user_rewards WHERE user_id = p_user_id AND status = 'pending';

  SELECT COALESCE(SUM(amount_jpy), 0) INTO v_confirmed
  FROM tr_user_rewards WHERE user_id = p_user_id AND status = 'confirmed';

  UPDATE tr_users
    SET pending_balance = v_pending,
        confirmed_balance = v_confirmed
    WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================
-- 関数: ASP成果ステータス遷移時に user_rewards を同期
-- =============================================
CREATE OR REPLACE FUNCTION sync_user_rewards_on_conversion()
RETURNS TRIGGER AS $$
DECLARE
  v_target_status TEXT;
BEGIN
  -- conversion → user_rewards のステータスマッピング
  v_target_status := CASE NEW.status
    WHEN 'pending'   THEN 'pending'
    WHEN 'approved'  THEN 'confirmed'
    WHEN 'rejected'  THEN 'cancelled'
    WHEN 'cancelled' THEN 'cancelled'
  END;

  IF NEW.matched_user_id IS NULL THEN
    RETURN NEW;
  END IF;

  -- upsert
  INSERT INTO tr_user_rewards (user_id, conversion_id, amount_jpy, status, confirmed_at, cancelled_at)
  VALUES (
    NEW.matched_user_id,
    NEW.id,
    NEW.user_payout_jpy,
    v_target_status,
    CASE WHEN v_target_status = 'confirmed' THEN now() ELSE NULL END,
    CASE WHEN v_target_status = 'cancelled' THEN now() ELSE NULL END
  )
  ON CONFLICT (conversion_id) DO UPDATE SET
    status = EXCLUDED.status,
    confirmed_at = COALESCE(tr_user_rewards.confirmed_at, EXCLUDED.confirmed_at),
    cancelled_at = COALESCE(tr_user_rewards.cancelled_at, EXCLUDED.cancelled_at),
    updated_at = now();

  -- 残高再計算
  PERFORM recalc_user_balance(NEW.matched_user_id);

  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER trg_sync_user_rewards
  AFTER INSERT OR UPDATE OF status ON tr_asp_conversions
  FOR EACH ROW EXECUTE FUNCTION sync_user_rewards_on_conversion();

-- =============================================
-- RLS: 新規テーブルは原則 Service Role のみ書込
-- =============================================
ALTER TABLE tr_affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_asp_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_user_rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE tr_asp_webhook_logs ENABLE ROW LEVEL SECURITY;

-- ユーザーは自分のクリック・報酬のみ参照可
CREATE POLICY "clicks_select_own" ON tr_affiliate_clicks
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "user_rewards_select_own" ON tr_user_rewards
  FOR SELECT USING (auth.uid() = user_id);

-- conversions / webhook_logs は一般ユーザー閲覧不可（管理者のみ Service Role 経由で参照）

-- =============================================
-- 移行: 既存 tr_users.balance を confirmed_balance にコピー（初期化）
-- =============================================
UPDATE tr_users SET confirmed_balance = balance WHERE confirmed_balance = 0 AND balance > 0;
