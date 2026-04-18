# TaskReward — 動画タスク型報酬SaaS 全体設計書

最終更新: 2026-04-18
対象: 本番即稼働MVP / 業務委託型 / 日本市場

---

## 0. エグゼクティブサマリー

**提供価値**: 動画視聴 + 行動（CV）で「確実に稼げる」SaaS。Swagbucks超えのUXを目指す。

**コア差別化**:
1. 動画視聴単体では報酬を出さない（クイズ正解 + CV成果が必須）
2. AI推薦（CV率×単価÷所要時間スコア）で "今やるべきTOP5" を提示
3. ランク制で高単価案件を段階解放し継続インセンティブを形成
4. 学習モード（投資/副業/IT）で「学びながら稼ぐ」新体験

**技術スタック**:
- フロントエンド: Next.js 15 (App Router) + TypeScript + Tailwind CSS
- バックエンド: Next.js Route Handlers
- DB / Auth / Storage: Supabase (PostgreSQL + RLS)
- 決済: Stripe Connect（将来の法人振込用）
- デザイン基調: Liveblocks風（黒 × パープル × モバイルファースト）

---

## 1. サービス全体設計

### 1.1 システム構成図

```
 [ User Mobile Browser ] ─── HTTPS ───┐
                                      │
                                      ▼
                    ┌──────────────────────────────┐
                    │  Next.js 15 on Vercel Edge   │
                    │  - App Router (SSR/ISR)      │
                    │  - Route Handlers (API)      │
                    └──────────────┬───────────────┘
                                   │
             ┌─────────────────────┼────────────────────┐
             ▼                     ▼                    ▼
      ┌─────────────┐       ┌────────────┐      ┌────────────────┐
      │  Supabase   │       │ ASP Webhook│      │ Stripe Connect │
      │ Auth / DB   │◀──────┤ (A8/AccTr) │      │ (出金処理)     │
      │ RLS / RPC   │       └────────────┘      └────────────────┘
      └─────────────┘
             │
             ▼
      ┌─────────────┐
      │ Edge Func   │  (定期実行: ランク更新/通知配信/不正検知集計)
      └─────────────┘
```

### 1.2 ユーザー行動フロー

```
1. LP  →  新規登録(業務委託契約同意)
2. ダッシュボード: AI推薦TOP5 / 収益サマリ / デイリーミッション
3. 案件選択  →  動画視聴(80%以上 + シーク禁止)
4. 理解度クイズ(全問正解必須、3回失敗で24hロック)
5. CTA(広告主LPへリダイレクト + cv_tracking_id付与)
6. ASP Webhook で成果確定  →  rewards付与
7. balance ≥ 1000円で出金申請
```

### 1.3 重要ルール

| # | ルール | 理由 |
|---|--------|------|
| 1 | 動画視聴単体で報酬を出さない | 景表法/業務実態確保 |
| 2 | 報酬は「業務委託の成果報酬」 | 資金決済法の前払式回避 |
| 3 | 年間支払50万円超で支払調書発行 | 所得税法 |
| 4 | 同IP 3アカウント以上で自動フラグ | 不正対策 |
| 5 | 視聴80%未満はクイズ開放しない | CV率維持 |

---

## 2. DB設計（ER図テキスト）

既存DBには `public.users` 等他プロジェクトのテーブルがあるため、本サービスは **`tr_` プレフィックス** で名前空間分離。

```
tr_users (PK id = auth.users.id)
  ├── tr_user_missions (FK user_id, campaign_id)
  ├── tr_rewards (FK user_id, mission_id)
  ├── tr_withdrawals (FK user_id)
  ├── tr_referrals (FK referrer_id, referee_id)
  ├── tr_device_logs (FK user_id)
  ├── tr_daily_missions (FK user_id)
  ├── tr_notifications (FK user_id)
  ├── tr_user_learning_progress (FK user_id, video_id)
  └── tr_campaign_reviews (FK user_id, campaign_id)

tr_campaigns
  ├── tr_quiz_questions (FK campaign_id)
  ├── tr_user_missions (FK campaign_id)
  ├── tr_campaign_reviews (FK campaign_id)
  └── tr_mission_access_logs (FK campaign_id)

tr_learning_videos
  └── tr_user_learning_progress (FK video_id)

tr_admin_users
  └── tr_admin_audit_logs (FK admin_id)

tr_notification_queue (送信待ち通知)
```

### 2.1 主要テーブル（抜粋、全文は `supabase/migrations/` 参照）

#### tr_users
- `id UUID PK`（auth.users連動）
- `email / nickname / rank / total_earned / balance / level / xp`
- `referral_code UNIQUE` / `referred_by FK tr_users`
- `streak_days / last_login_at`
- `is_banned / ban_reason / device_fingerprint / ip_address`
- `contract_agreed_at`（業務委託契約同意日時）

#### tr_campaigns
- `id / title / description / category`
- `reward_amount`（ユーザー報酬）/ `asp_reward`（ASP元報酬）
- `difficulty(1-5) / estimated_time / cv_rate`
- `video_url / cta_url / cta_label / thumbnail_url`
- `required_rank / daily_limit / total_limit / is_active / expires_at`
- `tags TEXT[]`

#### tr_user_missions
- `user_id / campaign_id (UNIQUE)` / `status ENUM`
- `video_watched_at / video_watch_duration`
- `quiz_passed_at / quiz_score`
- `cv_completed_at / cv_tracking_id`
- `reward_amount / reward_confirmed_at`
- `ip_address / device_fingerprint` ← 不正検知用

#### tr_rewards
- `user_id / mission_id / type / amount / description`
- type: `mission | daily_bonus | streak | referral | rank_up`

#### tr_mission_access_logs（動画視聴イベントログ）
- `event: play | pause | seek | ended | heartbeat`
- `position_sec` ← heartbeatは10秒ごと
- シーク検知: `seek` イベントあり → 視聴完了無効

### 2.2 RLSポリシー

- 基本: 自分のデータのみSELECT/UPDATE可能（`auth.uid() = user_id`）
- `tr_campaigns / tr_quiz_questions / tr_learning_videos`: 全員SELECT（active のみ）
- `tr_campaign_reviews`: 全員SELECT、INSERTは自分のみ
- `tr_admin_users / tr_admin_audit_logs`: Service Role Keyのみ

### 2.3 ビュー

- `tr_v_user_earnings_summary`: 日/週/月収益サマリ
- `tr_v_campaign_score`: AI推薦用スコア（単価×CV率÷所要時間）

---

## 3. API設計

すべてのAPIレスポンスは統一フォーマット:

```json
{ "success": true,  "data": {...} }
{ "success": false, "error": { "code": "E_XXX", "message": "..." } }
```

### 3.1 エンドポイント一覧

| Method | Path | 認証 | 説明 |
|--------|------|------|------|
| POST | `/api/auth/signup` | No | 新規登録（Supabase Auth経由） |
| POST | `/api/auth/logout` | Yes | ログアウト |
| GET | `/api/campaigns` | Yes | 案件一覧（rank絞込/カテゴリ） |
| GET | `/api/campaigns/recommend` | Yes | AI推薦TOP5 |
| GET | `/api/campaigns/[id]` | Yes | 案件詳細 + クイズ |
| POST | `/api/missions/video-event` | Yes | 視聴イベント記録(play/pause/seek/ended/heartbeat) |
| POST | `/api/missions/quiz-submit` | Yes | クイズ提出 |
| POST | `/api/missions/cv-redirect` | Yes | CTA遷移（cv_tracking_id発行） |
| POST | `/api/missions/complete` | Yes | ミッション完了（既存） |
| POST | `/api/webhooks/asp/[provider]` | Signature | ASP成果Webhook |
| GET | `/api/earnings/summary` | Yes | 収益サマリ(日/週/月/時給) |
| POST | `/api/withdraw` | Yes | 出金申請（既存） |
| GET | `/api/ranking?scope=all\|friends` | Yes | ランキング |
| POST | `/api/referral/claim` | Yes | 紹介コード適用 |
| GET | `/api/notifications` | Yes | 通知一覧 |
| POST | `/api/fraud-check` | Yes | 不正検知ログ（既存） |
| GET | `/api/admin/users` | Admin | ユーザー一覧 |
| POST | `/api/admin/users/[id]/ban` | Admin | BAN |
| GET | `/api/admin/metrics` | Admin | 管理ダッシュボード |

### 3.2 重要API詳細

#### POST /api/missions/video-event
```ts
// request
{ campaignId: string, event: 'play'|'pause'|'seek'|'ended'|'heartbeat', positionSec: number }

// サーバー処理
1. RLS経由でtr_mission_access_logsにINSERT
2. event='seek'のとき tr_user_missions.status を'failed'にしない（ただし検知フラグ立て）
3. event='ended' かつ position/duration >= 0.8 の時のみ video_watched_at を確定
```

#### POST /api/webhooks/asp/[provider]
```ts
// ASPから呼ばれる成果確定Webhook
// 署名検証(HMAC)必須。Service Role Keyで以下実行:
1. cv_tracking_id から user_missions 特定
2. status を 'cv_completed' → 'reward_confirmed'
3. tr_rewards にINSERT
4. tr_users.balance += reward_amount, total_earned += reward_amount
5. tr_check_and_update_rank() 呼び出し
6. 紹介者にリファラルボーナス付与(level1: 10%, level2: 5%)
7. 通知挿入
```

---

## 4. UIワイヤーフレーム（主要画面）

### 4.1 ダッシュボード（/dashboard）

```
┌──────────────────────────────┐
│ TaskReward         🔔3  👤   │
├──────────────────────────────┤
│ おかえりなさい、さねさん     │
│ ─────────────────────────── │
│ ┌──────┐┌──────┐┌────────┐ │
│ │今日  ││今月  ││総収益  │ │
│ │¥1,200││¥28,400│¥156,300│ │
│ └──────┘└──────┘└────────┘ │
│ 時給換算: ¥2,840 / h ⚡     │
├──────────────────────────────┤
│ 🤖 AI推薦 今やるべきTOP5     │
│ 1. 楽天カード  ¥8,000 [▶︎]  │
│ 2. SBI証券     ¥15,000[▶︎]  │
│ ...                          │
├──────────────────────────────┤
│ 🔥 デイリーミッション        │
│ [ □ 案件3つ完了 +¥500 ]     │
│ [ ✓ 連続7日ログイン +¥300 ] │
└──────────────────────────────┘
[案件][学習][ランク][紹介][出金]
```

### 4.2 ミッションフロー（/campaigns/[id]）

```
STEP 1: 動画視聴
┌──────────────────────┐
│ ▶︎ 動画プレイヤー     │
│    ████████░░ 80%    │ ← シーク不可
└──────────────────────┘
  [次へ] ← 80%到達で有効化

STEP 2: クイズ
Q1. 楽天カードの年会費は？
 ○ 永年無料
 ○ 初年度無料
 ○ 1,000円
 ○ 3,000円
  [送信]

STEP 3: CTA
「楽天カードに申し込む」ボタン
  ↓ クリック
[tr_mission_access_logs に記録]
cv_tracking_id 付き広告主URLへ遷移

STEP 4: 成果待ち
「成果は最短30分で反映されます」
```

### 4.3 主要画面一覧

| 画面 | パス | 既存 |
|------|------|------|
| LP | `/` | ✓ |
| ログイン | `/login` | ✓ |
| 登録 | `/signup` | ✓ |
| ダッシュボード | `/dashboard` | ✓ |
| 案件一覧 | `/campaigns` | ✓ |
| ミッション | `/campaigns/[id]` | ✓ |
| 収益 | `/earnings` | ✓ |
| ランキング | `/ranking` | ✓ |
| 紹介 | `/referral` | ✓ |
| 出金 | `/withdraw` | ✓ |
| 学習モード | `/learn` | 要追加 |
| 管理者 | `/admin` | 要追加 |
| 通知 | `/notifications` | 要追加 |

---

## 5. 収益ロジック

### 5.1 料率構造

```
[広告主] → [ASP] → [運営(TaskReward)] → [ユーザー]
                   └──→ 50%を運営利益
                   └──→ 50%をユーザーに還元
```

例: SBI証券案件
- ASP成果単価: ¥30,000
- ユーザー報酬: ¥15,000（50%）
- 運営利益: ¥15,000

### 5.2 ボーナス

| 種別 | 条件 | 金額 |
|------|------|------|
| デイリー達成 | 1日3案件完了 | +¥500 |
| 連続ログイン7日 | streak_days >= 7 | +¥300 |
| リファラル1段 | 紹介ユーザーCV | 被紹介者報酬×10% |
| リファラル2段 | 孫紹介CV | 孫報酬×5% |
| ランクUP | rank遷移時 | ¥1,000〜¥10,000 |

### 5.3 AI推薦スコア計算

```
score = (reward_amount × cv_rate × rank_multiplier) / max(estimated_time, 1)
rank_multiplier: required_rank が低いほど+20%（初心者優遇）
```

`tr_v_campaign_score` ビューで事前計算。

---

## 6. 不正対策ロジック（実装済み + 今回拡張）

| # | 手法 | 実装箇所 |
|---|------|----------|
| 1 | IP×24h×3アカウント以上でフラグ | `tr_detect_suspicious_activity()` |
| 2 | デバイスフィンガープリント重複 | 同上 |
| 3 | 視聴完了判定（80%以上 + seek検知） | `tr_mission_access_logs` |
| 4 | BOT: 同一IP 5分10回以上リクエスト | Next.js middleware.ts |
| 5 | レート制限（案件単位 daily_limit） | API側チェック |
| 6 | クイズ連続失敗3回で24hロック | user_missions.status='failed' |
| 7 | Webhook HMAC署名検証 | `/api/webhooks/asp/[provider]` |
| 8 | 管理者監査ログ | `tr_admin_audit_logs` |

### 6.1 シーク検知アルゴリズム

```
heartbeat を10秒ごと受信。連続するheartbeat間で位置差 > 15秒 → seek扱い。
seekフラグが立った mission は、視聴完了として認めない。
ただしCVは継続可能（ただし報酬は1/2に減額 or 無効化、Adminで選択）。
```

---

## 7. 開発手順（初心者でも実装可能）

### Step 1: リポジトリ準備
```bash
cd "/Users/okisaneatsu/Documents/Claude/Projects/Paid-to-missonモデルSaaS/task-reward"
npm install
cp .env.local.example .env.local
```

### Step 2: Supabase 接続
`.env.local` に:
```
NEXT_PUBLIC_SUPABASE_URL=https://jjfddcngrewyxfycffrg.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=（Supabase管理画面から取得）
SUPABASE_SERVICE_ROLE_KEY=（同上、Service Role Key）
```

### Step 3: DB確認
Supabase SQL Editor で:
```sql
SELECT tablename FROM pg_tables WHERE tablename LIKE 'tr_%';
```
11テーブルが存在することを確認。

### Step 4: 開発サーバー起動
```bash
npm run dev
# http://localhost:3000
```

### Step 5: Vercel デプロイ
```bash
vercel --prod
```
環境変数を Vercel プロジェクト設定にも登録。

### Step 6: ASP Webhook 接続
- A8 / アクセストレード管理画面で Postback URL を設定:
  `https://your-domain.vercel.app/api/webhooks/asp/a8?tid={TRACKING_ID}&amount={REWARD}`
- Webhook Secret を `.env` に追加:
  `ASP_A8_WEBHOOK_SECRET=xxx`

### Step 7: 動作確認
1. 新規登録 → ダッシュボード表示
2. 案件選択 → 動画視聴 → クイズ → CTA
3. Webhook手動叩きで成果確定シミュレート
4. 残高反映 → 出金申請

---

## 8. MVP構成（最短リリース 2〜3週間）

**Phase 1 (Day 1-5): 基盤**
- Supabase セットアップ（完了済）
- Next.js 認証 + ダッシュボード（完了済）
- 案件一覧 + 詳細ページ（完了済）

**Phase 2 (Day 6-10): コアフロー**
- 動画視聴 + クイズ + CTA（完了済）
- `tr_mission_access_logs` + シーク検知（新規）
- ASP Webhook モック（新規）

**Phase 3 (Day 11-15): 収益/出金**
- 収益ダッシュボード（完了済）
- 出金フロー（完了済）
- 紹介プログラム（完了済）

**Phase 4 (Day 16-21): 差別化**
- AI推薦（`tr_v_campaign_score` ビュー使用）
- デイリーミッション + 連続ログイン
- 学習モード（新規）
- 管理者画面（新規）
- モバイルUI最終調整

**MVPに含めない**:
- 実ASP本番連携（審査待ち）
- リアルタイム通知Push
- 多言語対応

---

## 9. スケーリング戦略

### 9.1 短期（〜MAU 1万）
- Vercel Hobby + Supabase Free/Pro
- Edge Functions で定期バッチ（ランク更新/通知配信）
- 画像はSupabase Storageで十分

### 9.2 中期（MAU 10万）
- Supabase Pro + コネクションプーリング有効化
- Redis (Upstash) でランキング / AI推薦キャッシュ
- Vercel Pro でEdge配信強化
- CDN (Cloudflare) で動画配信最適化

### 9.3 長期（MAU 100万+）
- PostgreSQL Read Replica 追加
- マイクロサービス分離（通知/集計を別サービスへ）
- 不正検知をML（Python + FastAPI）に切り出し
- CDN動画配信（Mux / Cloudflare Stream）
- ClickHouse でログ分析基盤構築

### 9.4 コスト試算

| フェーズ | MAU | 月額コスト |
|----------|-----|------------|
| MVP | 1,000 | ¥5,000 |
| 成長期 | 10,000 | ¥50,000 |
| スケール期 | 100,000 | ¥500,000 |
| エンタープライズ | 1,000,000 | ¥3,000,000 |

---

## 10. 法律対応チェックリスト

| 法律 | 対応 |
|------|------|
| 資金決済法 | 「業務委託報酬」モデル採用 / ポイントはサブラベル |
| 景品表示法 | 実績表示は平均値明示 / 誇大広告禁止 |
| 個人情報保護法 | プライバシーポリシー制定、削除請求対応 |
| 所得税法 | 年50万円超ユーザーに支払調書送付 / マイナンバー収集 |
| 特商法 | 運営者情報をフッターに表示 |
| 電子消費者契約法 | 契約前に業務委託契約書提示 → チェックボックス同意 |

---

## 11. 実装済みコード状況（既存プロジェクト）

```
task-reward/
├── app/
│   ├── page.tsx                          (LP) ✓
│   ├── (auth)/login/page.tsx             ✓
│   ├── (auth)/signup/page.tsx            ✓
│   ├── (dashboard)/dashboard/page.tsx    ✓
│   ├── (dashboard)/campaigns/page.tsx    ✓
│   ├── (dashboard)/campaigns/[id]/       ✓
│   ├── (dashboard)/earnings/             ✓
│   ├── (dashboard)/ranking/              ✓
│   ├── (dashboard)/referral/             ✓
│   ├── (dashboard)/withdraw/             ✓
│   ├── api/missions/complete/route.ts    ✓
│   ├── api/withdraw/route.ts             ✓
│   ├── api/fraud-check/route.ts          ✓
│   ├── terms/page.tsx                    ✓
│   └── privacy/page.tsx                  ✓
├── components/
│   ├── mission/MissionFlow.tsx           ✓
│   ├── dashboard/Sidebar.tsx             ✓
│   └── dashboard/MobileNav.tsx           ✓
├── lib/supabase/{client,server,types}.ts ✓
├── supabase/migrations/
│   ├── 001_initial_schema.sql            ✓ (DBに本番適用済 tr_ prefix版)
│   └── 002_seed_campaigns.sql            ✓
└── middleware.ts                          ✓
```

### 11.1 追加予定ファイル（Phase 4）
- `app/(dashboard)/learn/page.tsx` — 学習モード
- `app/(dashboard)/notifications/page.tsx` — 通知一覧
- `app/admin/layout.tsx` + `app/admin/*` — 管理者画面
- `app/api/missions/video-event/route.ts` — 視聴イベント
- `app/api/webhooks/asp/[provider]/route.ts` — ASP Webhook
- `app/api/campaigns/recommend/route.ts` — AI推薦
- `lib/fraud/fingerprint.ts` — デバイスFP生成
- `lib/analytics/earnings.ts` — 時給換算等

---

## 12. 最終確認チェックリスト（本番前）

- [ ] `.env` 全キー存在確認（NEXT_PUBLIC_SUPABASE_URL / ANON_KEY / SERVICE_ROLE_KEY / ASP_WEBHOOK_SECRET）
- [ ] Supabase RLS全テーブル有効
- [ ] 業務委託契約同意チェックボックス必須
- [ ] プライバシーポリシー / 利用規約 / 特商法表記
- [ ] モバイル崩れなし（iPhone SE / iPhone 14 / Android）
- [ ] 無限ローディング回避（タイムアウト10秒）
- [ ] エラー時トースト表示
- [ ] 管理者ルート `/admin/*` は `tr_admin_users` チェック必須
- [ ] Stripe本番キー混在禁止
- [ ] ASP Webhook HMAC検証OK
- [ ] 動画シーク検知動作OK
- [ ] 同IP 3アカウント作成で自動フラグ確認
