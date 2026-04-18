-- =============================================
-- TaskReward 初期スキーマ
-- =============================================

-- Extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pg_trgm";

-- Enum Types
CREATE TYPE user_rank AS ENUM ('beginner','bronze','silver','gold','platinum','diamond');
CREATE TYPE mission_status AS ENUM ('pending','video_watched','quiz_passed','cv_completed','reward_confirmed','failed');
CREATE TYPE withdrawal_status AS ENUM ('pending','processing','completed','failed');
CREATE TYPE campaign_category AS ENUM ('finance','insurance','credit_card','app','survey','shopping','education','other');
CREATE TYPE reward_type AS ENUM ('mission','daily_bonus','streak','referral','rank_up');
CREATE TYPE withdrawal_method AS ENUM ('bank','paypay','amazon_gift');
CREATE TYPE notification_type AS ENUM ('campaign','reward','system','rank_up');

-- =============================================
-- users テーブル
-- =============================================
CREATE TABLE users (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  nickname TEXT NOT NULL DEFAULT 'ユーザー',
  avatar_url TEXT,
  rank user_rank NOT NULL DEFAULT 'beginner',
  total_earned INTEGER NOT NULL DEFAULT 0,
  balance INTEGER NOT NULL DEFAULT 0,
  level INTEGER NOT NULL DEFAULT 1,
  xp INTEGER NOT NULL DEFAULT 0,
  referral_code TEXT NOT NULL UNIQUE DEFAULT substr(md5(random()::text), 1, 8),
  referred_by UUID REFERENCES users(id),
  streak_days INTEGER NOT NULL DEFAULT 0,
  last_login_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_banned BOOLEAN NOT NULL DEFAULT false,
  ban_reason TEXT,
  device_fingerprint TEXT,
  ip_address INET,
  contract_agreed_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- campaigns テーブル
-- =============================================
CREATE TABLE campaigns (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category campaign_category NOT NULL DEFAULT 'other',
  reward_amount INTEGER NOT NULL DEFAULT 0,
  asp_reward INTEGER NOT NULL DEFAULT 0,
  difficulty INTEGER NOT NULL DEFAULT 3 CHECK (difficulty BETWEEN 1 AND 5),
  estimated_time INTEGER NOT NULL DEFAULT 10,
  cv_rate NUMERIC(4,2) NOT NULL DEFAULT 0.5,
  video_url TEXT NOT NULL,
  cta_url TEXT NOT NULL,
  cta_label TEXT NOT NULL DEFAULT '申し込む',
  thumbnail_url TEXT,
  required_rank user_rank NOT NULL DEFAULT 'beginner',
  is_active BOOLEAN NOT NULL DEFAULT true,
  expires_at TIMESTAMPTZ,
  total_completions INTEGER NOT NULL DEFAULT 0,
  daily_limit INTEGER NOT NULL DEFAULT 100,
  total_limit INTEGER,
  tags TEXT[] NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- quiz_questions テーブル
-- =============================================
CREATE TABLE quiz_questions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  question TEXT NOT NULL,
  options TEXT[] NOT NULL,
  correct_index INTEGER NOT NULL,
  explanation TEXT,
  order_num INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- user_missions テーブル
-- =============================================
CREATE TABLE user_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  status mission_status NOT NULL DEFAULT 'pending',
  video_watched_at TIMESTAMPTZ,
  video_watch_duration INTEGER NOT NULL DEFAULT 0,
  quiz_passed_at TIMESTAMPTZ,
  quiz_score INTEGER NOT NULL DEFAULT 0,
  cv_completed_at TIMESTAMPTZ,
  cv_tracking_id TEXT,
  reward_amount INTEGER NOT NULL DEFAULT 0,
  reward_confirmed_at TIMESTAMPTZ,
  ip_address INET NOT NULL DEFAULT '0.0.0.0',
  device_fingerprint TEXT NOT NULL DEFAULT '',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- =============================================
-- rewards テーブル
-- =============================================
CREATE TABLE rewards (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  mission_id UUID REFERENCES user_missions(id),
  type reward_type NOT NULL,
  amount INTEGER NOT NULL,
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- withdrawals テーブル
-- =============================================
CREATE TABLE withdrawals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  amount INTEGER NOT NULL CHECK (amount >= 1000),
  method withdrawal_method NOT NULL,
  account_info JSONB NOT NULL DEFAULT '{}',
  status withdrawal_status NOT NULL DEFAULT 'pending',
  processed_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- referrals テーブル
-- =============================================
CREATE TABLE referrals (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  referrer_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  referee_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  level INTEGER NOT NULL DEFAULT 1 CHECK (level IN (1, 2)),
  bonus_amount INTEGER NOT NULL DEFAULT 0,
  paid_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(referrer_id, referee_id)
);

-- =============================================
-- device_logs テーブル（不正対策）
-- =============================================
CREATE TABLE device_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  ip_address INET NOT NULL,
  device_fingerprint TEXT NOT NULL,
  user_agent TEXT NOT NULL DEFAULT '',
  action TEXT NOT NULL,
  is_suspicious BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- daily_missions テーブル
-- =============================================
CREATE TABLE daily_missions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  date DATE NOT NULL DEFAULT CURRENT_DATE,
  missions_completed INTEGER NOT NULL DEFAULT 0,
  bonus_earned INTEGER NOT NULL DEFAULT 0,
  streak_bonus INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, date)
);

-- =============================================
-- notifications テーブル
-- =============================================
CREATE TABLE notifications (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  body TEXT NOT NULL,
  type notification_type NOT NULL DEFAULT 'system',
  is_read BOOLEAN NOT NULL DEFAULT false,
  link TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- =============================================
-- campaign_reviews テーブル
-- =============================================
CREATE TABLE campaign_reviews (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  campaign_id UUID NOT NULL REFERENCES campaigns(id) ON DELETE CASCADE,
  earn_score INTEGER NOT NULL CHECK (earn_score BETWEEN 1 AND 5),
  difficulty_score INTEGER NOT NULL CHECK (difficulty_score BETWEEN 1 AND 5),
  trust_score INTEGER NOT NULL CHECK (trust_score BETWEEN 1 AND 5),
  comment TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(user_id, campaign_id)
);

-- =============================================
-- インデックス
-- =============================================
CREATE INDEX idx_user_missions_user_id ON user_missions(user_id);
CREATE INDEX idx_user_missions_status ON user_missions(status);
CREATE INDEX idx_rewards_user_id ON rewards(user_id);
CREATE INDEX idx_rewards_created_at ON rewards(created_at DESC);
CREATE INDEX idx_campaigns_is_active ON campaigns(is_active);
CREATE INDEX idx_campaigns_category ON campaigns(category);
CREATE INDEX idx_device_logs_user_id ON device_logs(user_id);
CREATE INDEX idx_device_logs_ip ON device_logs(ip_address);
CREATE INDEX idx_device_logs_fingerprint ON device_logs(device_fingerprint);
CREATE INDEX idx_notifications_user_id_unread ON notifications(user_id, is_read);

-- =============================================
-- RLS（Row Level Security）
-- =============================================
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE rewards ENABLE ROW LEVEL SECURITY;
ALTER TABLE withdrawals ENABLE ROW LEVEL SECURITY;
ALTER TABLE referrals ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_missions ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE campaign_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE device_logs ENABLE ROW LEVEL SECURITY;

-- users ポリシー
CREATE POLICY "users_select_own" ON users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_update_own" ON users FOR UPDATE USING (auth.uid() = id);

-- user_missions ポリシー
CREATE POLICY "missions_select_own" ON user_missions FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "missions_insert_own" ON user_missions FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "missions_update_own" ON user_missions FOR UPDATE USING (auth.uid() = user_id);

-- rewards ポリシー
CREATE POLICY "rewards_select_own" ON rewards FOR SELECT USING (auth.uid() = user_id);

-- withdrawals ポリシー
CREATE POLICY "withdrawals_select_own" ON withdrawals FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "withdrawals_insert_own" ON withdrawals FOR INSERT WITH CHECK (auth.uid() = user_id);

-- notifications ポリシー
CREATE POLICY "notifications_select_own" ON notifications FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "notifications_update_own" ON notifications FOR UPDATE USING (auth.uid() = user_id);

-- campaign_reviews ポリシー
CREATE POLICY "reviews_select_all" ON campaign_reviews FOR SELECT USING (true);
CREATE POLICY "reviews_insert_own" ON campaign_reviews FOR INSERT WITH CHECK (auth.uid() = user_id);

-- campaigns は全員参照可能
ALTER TABLE campaigns ENABLE ROW LEVEL SECURITY;
CREATE POLICY "campaigns_select_active" ON campaigns FOR SELECT USING (is_active = true);

-- quiz_questions は全員参照可能
ALTER TABLE quiz_questions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "quiz_select_all" ON quiz_questions FOR SELECT USING (true);

-- referrals ポリシー
CREATE POLICY "referrals_select_own" ON referrals FOR SELECT USING (auth.uid() = referrer_id OR auth.uid() = referee_id);

-- daily_missions ポリシー
CREATE POLICY "daily_select_own" ON daily_missions FOR SELECT USING (auth.uid() = user_id);

-- =============================================
-- Functions & Triggers
-- =============================================

-- updated_at 自動更新
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trg_users_updated_at BEFORE UPDATE ON users
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_campaigns_updated_at BEFORE UPDATE ON campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_user_missions_updated_at BEFORE UPDATE ON user_missions
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
CREATE TRIGGER trg_withdrawals_updated_at BEFORE UPDATE ON withdrawals
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- ユーザー登録時に users レコード作成
CREATE OR REPLACE FUNCTION handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.users (id, email, nickname, contract_agreed_at)
  VALUES (
    NEW.id,
    NEW.email,
    COALESCE(NEW.raw_user_meta_data->>'nickname', 'ユーザー' || substr(NEW.id::text, 1, 6)),
    now()
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION handle_new_user();

-- ランクアップ関数
CREATE OR REPLACE FUNCTION check_and_update_rank(p_user_id UUID)
RETURNS void AS $$
DECLARE
  v_total_earned INTEGER;
  v_new_rank user_rank;
BEGIN
  SELECT total_earned INTO v_total_earned FROM users WHERE id = p_user_id;
  v_new_rank := CASE
    WHEN v_total_earned >= 100000 THEN 'diamond'
    WHEN v_total_earned >= 50000  THEN 'platinum'
    WHEN v_total_earned >= 20000  THEN 'gold'
    WHEN v_total_earned >= 5000   THEN 'silver'
    WHEN v_total_earned >= 1000   THEN 'bronze'
    ELSE 'beginner'
  END;
  UPDATE users SET rank = v_new_rank WHERE id = p_user_id AND rank != v_new_rank;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 不正アカウント検出: 同IPで複数アカウント
CREATE OR REPLACE FUNCTION detect_suspicious_activity(p_user_id UUID, p_ip INET, p_fingerprint TEXT)
RETURNS BOOLEAN AS $$
DECLARE
  v_ip_count INTEGER;
  v_fp_count INTEGER;
BEGIN
  SELECT COUNT(DISTINCT user_id) INTO v_ip_count
  FROM device_logs
  WHERE ip_address = p_ip
    AND created_at > now() - INTERVAL '24 hours'
    AND user_id != p_user_id;

  SELECT COUNT(DISTINCT user_id) INTO v_fp_count
  FROM device_logs
  WHERE device_fingerprint = p_fingerprint
    AND created_at > now() - INTERVAL '24 hours'
    AND user_id != p_user_id;

  RETURN (v_ip_count >= 3 OR v_fp_count >= 2);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
