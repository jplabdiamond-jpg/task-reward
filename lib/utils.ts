import { clsx, type ClassValue } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function formatCurrency(amount: number): string {
  return new Intl.NumberFormat('ja-JP', {
    style: 'currency',
    currency: 'JPY',
    minimumFractionDigits: 0,
  }).format(amount)
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat('ja-JP').format(n)
}

export function calcHourlyRate(earned: number, minutes: number): number {
  if (minutes === 0) return 0
  return Math.round((earned / minutes) * 60)
}

export function getRankLabel(rank: string): string {
  const map: Record<string, string> = {
    beginner: '初心者',
    bronze: 'ブロンズ',
    silver: 'シルバー',
    gold: 'ゴールド',
    platinum: 'プラチナ',
    diamond: 'ダイヤモンド',
  }
  return map[rank] ?? rank
}

export function getRankColor(rank: string): string {
  const map: Record<string, string> = {
    beginner: '#a39e98',
    bronze: '#cd7f32',
    silver: '#9e9e9e',
    gold: '#ffd700',
    platinum: '#e5e4e2',
    diamond: '#0075de',
  }
  return map[rank] ?? '#a39e98'
}

export function getDifficultyLabel(d: number): string {
  if (d <= 2) return '簡単'
  if (d <= 3) return '普通'
  if (d <= 4) return '難しい'
  return '超難関'
}

export function getScoreLabel(campaign: {
  cv_rate: number
  reward_amount: number
  difficulty: number
}): number {
  return Math.round(
    (campaign.cv_rate * 0.4 + campaign.reward_amount / 1000 * 0.4 + (6 - campaign.difficulty) * 0.2) * 100
  ) / 100
}
