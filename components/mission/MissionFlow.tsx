'use client'
import { useState, useRef, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { createClient } from '@/lib/supabase/client'
import { Play, CheckCircle, ExternalLink, Loader2, AlertCircle, Lock } from 'lucide-react'
import { formatCurrency } from '@/lib/utils'

type Step = 'video' | 'quiz' | 'cta' | 'done' | 'already_done'

interface Props {
  campaign: {
    id: string; title: string; video_url: string; cta_url: string; cta_label: string
    reward_amount: number; estimated_time: number
  }
  questions: { id: string; question: string; options: string[]; correct_index: number; explanation: string | null }[]
  existingMission: { status: string } | null
  userId: string
}

export default function MissionFlow({ campaign, questions, existingMission, userId }: Props) {
  const router = useRouter()
  const [step, setStep] = useState<Step>(() => {
    if (!existingMission) return 'video'
    if (existingMission.status === 'reward_confirmed') return 'already_done'
    if (existingMission.status === 'cv_completed' || existingMission.status === 'quiz_passed') return 'cta'
    if (existingMission.status === 'video_watched') return 'quiz'
    return 'video'
  })

  // Video state
  const [videoStarted, setVideoStarted] = useState(false)
  const [videoCompleted, setVideoCompleted] = useState(false)
  const [watchDuration, setWatchDuration] = useState(0)
  const [videoError, setVideoError] = useState(false)
  const watchTimer = useRef<NodeJS.Timeout | null>(null)
  const requiredSeconds = campaign.estimated_time * 60 * 0.8 // 80%視聴で完了

  // Quiz state
  const [currentQ, setCurrentQ] = useState(0)
  const [answers, setAnswers] = useState<number[]>([])
  const [quizResult, setQuizResult] = useState<{ correct: boolean; explanation: string | null } | null>(null)
  const [quizPassed, setQuizPassed] = useState(false)

  // CTA state
  const [ctaClicked, setCtaClicked] = useState(false)
  const [confirming, setConfirming] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Anti-fraud: デバイスフィンガープリント
  const getFingerprint = useCallback(() => {
    const ua = navigator.userAgent
    const screen = `${window.screen.width}x${window.screen.height}`
    const tz = Intl.DateTimeFormat().resolvedOptions().timeZone
    return btoa(`${ua}${screen}${tz}`).slice(0, 32)
  }, [])

  // 動画視聴タイマー開始
  const startVideo = () => {
    setVideoStarted(true)
    watchTimer.current = setInterval(() => {
      setWatchDuration(prev => {
        const next = prev + 1
        if (next >= requiredSeconds) {
          clearInterval(watchTimer.current!)
          setVideoCompleted(true)
        }
        return next
      })
    }, 1000)
  }

  useEffect(() => {
    return () => { if (watchTimer.current) clearInterval(watchTimer.current) }
  }, [])

  // 動画完了 → DB更新
  useEffect(() => {
    if (!videoCompleted) return
    ;(async () => {
      try {
        const supabase = createClient()
        const fp = getFingerprint()
        await supabase.from('tr_user_missions').upsert({
          user_id: userId, campaign_id: campaign.id,
          status: 'video_watched', video_watched_at: new Date().toISOString(),
          video_watch_duration: Math.floor(watchDuration),
          ip_address: '0.0.0.0', device_fingerprint: fp,
        }, { onConflict: 'user_id,campaign_id' })
        // 不正チェックAPI
        await fetch('/api/fraud-check', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ userId, fingerprint: fp, action: 'video_complete' }),
        })
      } catch (e) { console.error('video update error:', e) }
    })()
  }, [videoCompleted, userId, campaign.id, watchDuration, getFingerprint])

  // クイズ回答
  const handleAnswer = async (idx: number) => {
    const q = questions[currentQ]
    const correct = idx === q.correct_index
    setQuizResult({ correct, explanation: q.explanation })
    const newAnswers = [...answers, idx]
    setAnswers(newAnswers)

    setTimeout(async () => {
      setQuizResult(null)
      if (currentQ < questions.length - 1) {
        setCurrentQ(prev => prev + 1)
      } else {
        const correctCount = newAnswers.filter((a, i) => a === questions[i].correct_index).length
        const score = Math.round((correctCount / questions.length) * 100)
        const passed = score >= 60

        if (passed) {
          setQuizPassed(true)
          try {
            const supabase = createClient()
            await supabase.from('tr_user_missions').upsert({
              user_id: userId, campaign_id: campaign.id,
              status: 'quiz_passed', quiz_passed_at: new Date().toISOString(), quiz_score: score,
              ip_address: '0.0.0.0', device_fingerprint: getFingerprint(),
            }, { onConflict: 'user_id,campaign_id' })
          } catch (e) { console.error('quiz update error:', e) }
          setTimeout(() => setStep('cta'), 800)
        } else {
          setCurrentQ(0); setAnswers([])
          setError(`正解率 ${score}% — もう一度挑戦してください（60%以上で合格）`)
        }
      }
    }, 1200)
  }

  // CTA完了確認
  const handleConfirmCV = async () => {
    setConfirming(true); setError(null)
    try {
      const supabase = createClient()
      const fp = getFingerprint()
      const trackingId = `TR_${userId.slice(0,8)}_${campaign.id.slice(0,8)}_${Date.now()}`

      await supabase.from('tr_user_missions').upsert({
        user_id: userId, campaign_id: campaign.id,
        status: 'cv_completed', cv_completed_at: new Date().toISOString(),
        cv_tracking_id: trackingId, reward_amount: campaign.reward_amount,
        ip_address: '0.0.0.0', device_fingerprint: fp,
      }, { onConflict: 'user_id,campaign_id' })

      // 成果確認API呼び出し
      const res = await fetch('/api/missions/complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId, campaignId: campaign.id, trackingId, fingerprint: fp }),
      })
      if (!res.ok) throw new Error('報酬処理に失敗しました')

      setStep('done')
      router.refresh()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : '処理中にエラーが発生しました')
    } finally {
      setConfirming(false)
    }
  }

  const progress = step === 'video' ? 33 : step === 'quiz' ? 66 : step === 'cta' ? 90 : 100

  // Already done
  if (step === 'already_done') {
    return (
      <div className="card p-8 text-center">
        <CheckCircle size={48} className="mx-auto text-green-500 mb-3" />
        <h3 className="font-bold text-lg mb-1">この案件は完了済みです</h3>
        <p className="text-sm text-warm-gray-500">報酬は既に付与されています</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Progress Bar */}
      <div className="card p-4">
        <div className="flex items-center justify-between text-xs text-warm-gray-500 mb-2">
          {['動画視聴', 'クイズ', 'アクション', '完了'].map((s, i) => (
            <span key={s} className={progress > i * 33 ? 'text-notion-blue font-semibold' : ''}>{s}</span>
          ))}
        </div>
        <div className="bg-warm-white rounded-full h-2 overflow-hidden">
          <div className="bg-notion-blue h-2 rounded-full transition-all duration-500" style={{ width: `${progress}%` }} />
        </div>
      </div>

      {/* STEP: VIDEO */}
      {step === 'video' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 bg-notion-blue text-white rounded-full flex items-center justify-center text-xs">1</span>
            動画を視聴する
          </h2>
          <div className="relative bg-black rounded-xl overflow-hidden aspect-video">
            {!videoStarted ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-[rgba(0,0,0,0.8)]">
                <p className="text-white text-sm">視聴完了後にクイズが始まります</p>
                <button onClick={startVideo} className="btn-primary flex items-center gap-2 px-6 py-3">
                  <Play size={16} />
                  動画を再生する
                </button>
              </div>
            ) : (
              <iframe
                src={`${campaign.video_url}?autoplay=1&controls=1`}
                className="w-full h-full"
                allow="autoplay; encrypted-media"
                allowFullScreen
              />
            )}
          </div>

          {videoStarted && !videoCompleted && (
            <div>
              <div className="flex justify-between text-xs text-warm-gray-500 mb-1">
                <span>視聴進捗</span>
                <span>{Math.floor(watchDuration)}秒 / {Math.floor(requiredSeconds)}秒</span>
              </div>
              <div className="bg-warm-white rounded-full h-2 overflow-hidden">
                <div
                  className="bg-teal h-2 rounded-full transition-all"
                  style={{ width: `${Math.min((watchDuration / requiredSeconds) * 100, 100)}%` }}
                />
              </div>
              <p className="text-xs text-warm-gray-300 mt-1 flex items-center gap-1">
                <Lock size={10} />
                動画視聴中はスキップ不可です
              </p>
            </div>
          )}

          {videoCompleted && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-green-600 text-sm font-semibold">
                <CheckCircle size={16} />
                視聴完了！
              </div>
              <button onClick={() => setStep('quiz')} className="btn-primary px-6">
                クイズへ進む →
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP: QUIZ */}
      {step === 'quiz' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 bg-notion-blue text-white rounded-full flex items-center justify-center text-xs">2</span>
            理解度クイズ
          </h2>
          {questions.length === 0 ? (
            <div className="text-center py-4">
              <p className="text-sm text-warm-gray-500 mb-4">このクイズはありません</p>
              <button onClick={() => setStep('cta')} className="btn-primary px-6">次へ進む →</button>
            </div>
          ) : (
            <>
              <div className="flex justify-between text-xs text-warm-gray-500">
                <span>問 {currentQ + 1} / {questions.length}</span>
                <span>60%以上で合格</span>
              </div>
              <p className="font-semibold text-base leading-relaxed">{questions[currentQ].question}</p>
              <div className="space-y-2">
                {questions[currentQ].options.map((opt, i) => {
                  const isAnswered = quizResult !== null
                  const isCorrect = i === questions[currentQ].correct_index
                  const isSelected = answers[currentQ] === i && isAnswered
                  return (
                    <button
                      key={i}
                      onClick={() => !isAnswered && handleAnswer(i)}
                      disabled={isAnswered}
                      className={`w-full text-left px-4 py-3 rounded-xl border text-sm font-medium transition-all ${
                        isAnswered
                          ? isCorrect ? 'border-green-400 bg-green-50 text-green-800'
                            : isSelected ? 'border-red-300 bg-red-50 text-red-700'
                            : 'border-[rgba(0,0,0,0.06)] text-warm-gray-300'
                          : 'border-[rgba(0,0,0,0.1)] hover:border-notion-blue hover:bg-badge-blue-bg'
                      }`}>
                      <span className="mr-2 font-bold">{['A','B','C','D'][i]}.</span>{opt}
                    </button>
                  )
                })}
              </div>
              {quizResult && (
                <div className={`p-3 rounded-xl text-sm ${quizResult.correct ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
                  <span className="font-bold mr-1">{quizResult.correct ? '✓ 正解！' : '✗ 不正解'}</span>
                  {quizResult.explanation}
                </div>
              )}
              {error && (
                <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-3 rounded-xl text-sm">
                  <AlertCircle size={14} />{error}
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* STEP: CTA */}
      {step === 'cta' && (
        <div className="card p-5 space-y-4">
          <h2 className="font-bold text-lg flex items-center gap-2">
            <span className="w-6 h-6 bg-notion-blue text-white rounded-full flex items-center justify-center text-xs">3</span>
            アクションを実行する
          </h2>
          <div className="bg-badge-blue-bg border border-notion-blue/20 rounded-xl p-4 text-center">
            <div className="text-3xl font-bold text-notion-blue mb-1">{formatCurrency(campaign.reward_amount)}</div>
            <div className="text-sm text-warm-gray-500">アクション完了で報酬獲得</div>
          </div>
          <ol className="space-y-2 text-sm">
            {['下の「{label}」ボタンをタップ'.replace('{label}', campaign.cta_label),
              '必要事項を入力して申し込みを完了',
              'このページに戻って「完了を報告」をタップ'].map((s, i) => (
              <li key={i} className="flex items-start gap-2">
                <span className="w-5 h-5 bg-badge-blue-bg text-notion-blue rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0 mt-0.5">{i+1}</span>
                <span className="text-warm-gray-500">{s}</span>
              </li>
            ))}
          </ol>
          <a href={campaign.cta_url} target="_blank" rel="noopener noreferrer"
            onClick={() => setCtaClicked(true)}
            className="btn-primary w-full py-3 flex items-center justify-center gap-2 text-base">
            <ExternalLink size={16} />
            {campaign.cta_label}
          </a>
          {ctaClicked && (
            <div className="border-t border-[rgba(0,0,0,0.06)] pt-4">
              <p className="text-sm text-warm-gray-500 mb-3">申し込みが完了しましたか？</p>
              {error && (
                <div className="flex items-center gap-2 text-orange-700 bg-orange-50 p-3 rounded-xl text-sm mb-3">
                  <AlertCircle size={14} />{error}
                </div>
              )}
              <button onClick={handleConfirmCV} disabled={confirming}
                className="btn-primary w-full py-3 flex items-center justify-center gap-2 disabled:opacity-50">
                {confirming ? <><Loader2 size={16} className="animate-spin" />処理中...</> : '✓ 完了を報告する'}
              </button>
            </div>
          )}
        </div>
      )}

      {/* STEP: DONE */}
      {step === 'done' && (
        <div className="card p-8 text-center space-y-4">
          <div className="text-5xl">🎉</div>
          <h2 className="text-2xl font-bold">ミッション完了！</h2>
          <p className="text-warm-gray-500 text-sm">成果確認後に報酬が付与されます（通常1〜3営業日）</p>
          <div className="bg-badge-blue-bg rounded-xl p-4">
            <div className="text-3xl font-bold text-notion-blue">{formatCurrency(campaign.reward_amount)}</div>
            <div className="text-sm text-warm-gray-500 mt-1">確定予定報酬</div>
          </div>
          <a href="/campaigns" className="btn-primary inline-block px-8 py-3">
            次の案件を探す →
          </a>
        </div>
      )}
    </div>
  )
}
