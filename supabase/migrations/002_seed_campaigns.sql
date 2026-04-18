-- =============================================
-- サンプル案件データ
-- =============================================
INSERT INTO campaigns (title, description, category, reward_amount, asp_reward, difficulty, estimated_time, cv_rate, video_url, cta_url, cta_label, required_rank, daily_limit, tags) VALUES
(
  '楽天カード新規入会',
  '楽天カードに新規入会するだけで報酬獲得！年会費永年無料、ポイント還元率1%以上。動画で詳細を確認してから申し込もう。',
  'credit_card', 8000, 16000, 2, 10, 0.65,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.rakuten-card.co.jp/',
  '無料で申し込む', 'beginner', 50,
  ARRAY['クレジットカード','年会費無料','ポイント']
),
(
  'SBI証券 口座開設',
  'SBI証券に口座開設するだけで高額報酬！初心者向け投資動画を視聴後、クイズに正解して申し込みへ。',
  'finance', 15000, 30000, 3, 15, 0.45,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.sbisec.co.jp/',
  '口座を開設する', 'bronze', 30,
  ARRAY['証券','投資','口座開設']
),
(
  'FX口座開設（DMM FX）',
  'DMM FXに口座開設＋1回取引で最大3万円報酬！動画でFXの基礎を学んでから挑戦しよう。',
  'finance', 25000, 50000, 4, 20, 0.35,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://fx.dmm.com/',
  'FX口座を開設する', 'silver', 20,
  ARRAY['FX','外国為替','高額']
),
(
  'アプリインストール（ゲーム）',
  '無料ゲームアプリをインストールして起動するだけ！5分以内に完了する簡単タスク。',
  'app', 200, 400, 1, 5, 0.85,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://apps.apple.com/',
  'アプリをインストール', 'beginner', 200,
  ARRAY['アプリ','ゲーム','簡単']
),
(
  'アンケート回答（10分）',
  '商品に関するアンケートに回答するだけ。約10分で完了。毎日新しいアンケートが追加されます。',
  'survey', 500, 1000, 1, 10, 0.90,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://example.com/survey',
  'アンケートに回答する', 'beginner', 500,
  ARRAY['アンケート','簡単','毎日']
),
(
  '生命保険 無料相談申し込み',
  '生命保険の無料相談を申し込むだけで報酬獲得。申し込み後のキャンセルも可能。動画で保険の基礎知識を学ぼう。',
  'insurance', 12000, 24000, 3, 15, 0.40,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://example.com/insurance',
  '無料相談を申し込む', 'bronze', 40,
  ARRAY['保険','無料相談','高額']
),
(
  'プログラミングスクール 無料体験',
  'オンラインプログラミングスクールの無料体験レッスンに申し込む。学びながら報酬を獲得！',
  'education', 3000, 6000, 2, 10, 0.55,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://example.com/programming',
  '無料体験に申し込む', 'beginner', 100,
  ARRAY['プログラミング','教育','スキルアップ']
),
(
  'ネット銀行 口座開設（PayPay銀行）',
  'PayPay銀行に口座を開設するだけで報酬獲得。スマホから5分で申し込み完了。',
  'finance', 5000, 10000, 2, 10, 0.60,
  'https://www.youtube.com/embed/dQw4w9WgXcQ',
  'https://www.japannetbank.co.jp/',
  '口座を開設する', 'beginner', 80,
  ARRAY['銀行','口座開設','ネット銀行']
);

-- サンプルクイズ（楽天カード用）
INSERT INTO quiz_questions (campaign_id, question, options, correct_index, explanation, order_num)
SELECT
  id,
  '楽天カードの年会費はいくらですか？',
  ARRAY['1,000円', '3,000円', '永年無料', '5,000円'],
  2,
  '楽天カードは年会費が永年無料です。維持コストなしで利用できます。',
  1
FROM campaigns WHERE title = '楽天カード新規入会';

INSERT INTO quiz_questions (campaign_id, question, options, correct_index, explanation, order_num)
SELECT
  id,
  '楽天カードの基本ポイント還元率は何%ですか？',
  ARRAY['0.5%', '1.0%', '2.0%', '3.0%'],
  1,
  '楽天カードの基本ポイント還元率は1.0%です。楽天市場では最大3倍以上になります。',
  2
FROM campaigns WHERE title = '楽天カード新規入会';

-- SBI証券クイズ
INSERT INTO quiz_questions (campaign_id, question, options, correct_index, explanation, order_num)
SELECT
  id,
  'SBI証券で取引できるものはどれですか？',
  ARRAY['国内株のみ', '投資信託のみ', '株・FX・投信など多数', '不動産のみ'],
  2,
  'SBI証券では国内株・外国株・投資信託・FX・債券など多様な金融商品を取引できます。',
  1
FROM campaigns WHERE title = 'SBI証券 口座開設';
