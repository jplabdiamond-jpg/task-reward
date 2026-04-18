export type Json = string | number | boolean | null | { [key: string]: Json } | Json[]

export type UserRank = 'beginner' | 'bronze' | 'silver' | 'gold' | 'platinum' | 'diamond'
export type MissionStatus = 'pending' | 'video_watched' | 'quiz_passed' | 'cv_completed' | 'reward_confirmed' | 'failed'
export type WithdrawalStatus = 'pending' | 'processing' | 'completed' | 'failed'
export type CampaignCategory = 'finance' | 'insurance' | 'credit_card' | 'app' | 'survey' | 'shopping' | 'education' | 'other'

export interface Database {
  public: {
    Tables: {
      tr_users: {
        Row: {
          id: string
          email: string
          nickname: string
          avatar_url: string | null
          rank: UserRank
          total_earned: number
          balance: number
          level: number
          xp: number
          referral_code: string
          referred_by: string | null
          streak_days: number
          last_login_at: string
          is_banned: boolean
          ban_reason: string | null
          device_fingerprint: string | null
          ip_address: string | null
          contract_agreed_at: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_users']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tr_users']['Insert']>
      }
      tr_campaigns: {
        Row: {
          id: string
          title: string
          description: string
          category: CampaignCategory
          reward_amount: number
          asp_reward: number
          difficulty: number
          estimated_time: number
          cv_rate: number
          video_url: string
          cta_url: string
          cta_label: string
          thumbnail_url: string | null
          required_rank: UserRank
          is_active: boolean
          expires_at: string | null
          total_completions: number
          daily_limit: number
          total_limit: number | null
          tags: string[]
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_campaigns']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tr_campaigns']['Insert']>
      }
      tr_user_missions: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          status: MissionStatus
          video_watched_at: string | null
          video_watch_duration: number
          quiz_passed_at: string | null
          quiz_score: number
          cv_completed_at: string | null
          cv_tracking_id: string | null
          reward_amount: number
          reward_confirmed_at: string | null
          ip_address: string
          device_fingerprint: string
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_user_missions']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tr_user_missions']['Insert']>
      }
      tr_quiz_questions: {
        Row: {
          id: string
          campaign_id: string
          question: string
          options: string[]
          correct_index: number
          explanation: string | null
          order_num: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_quiz_questions']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['tr_quiz_questions']['Insert']>
      }
      tr_rewards: {
        Row: {
          id: string
          user_id: string
          mission_id: string | null
          type: 'mission' | 'daily_bonus' | 'streak' | 'referral' | 'rank_up'
          amount: number
          description: string
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_rewards']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['tr_rewards']['Insert']>
      }
      tr_withdrawals: {
        Row: {
          id: string
          user_id: string
          amount: number
          method: 'bank' | 'paypay' | 'amazon_gift'
          account_info: Json
          status: WithdrawalStatus
          processed_at: string | null
          created_at: string
          updated_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_withdrawals']['Row'], 'created_at' | 'updated_at'>
        Update: Partial<Database['public']['Tables']['tr_withdrawals']['Insert']>
      }
      tr_referrals: {
        Row: {
          id: string
          referrer_id: string
          referee_id: string
          level: number
          bonus_amount: number
          paid_at: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_referrals']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['tr_referrals']['Insert']>
      }
      tr_device_logs: {
        Row: {
          id: string
          user_id: string
          ip_address: string
          device_fingerprint: string
          user_agent: string
          action: string
          is_suspicious: boolean
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_device_logs']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['tr_device_logs']['Insert']>
      }
      tr_daily_missions: {
        Row: {
          id: string
          user_id: string
          date: string
          missions_completed: number
          bonus_earned: number
          streak_bonus: number
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_daily_missions']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['tr_daily_missions']['Insert']>
      }
      tr_notifications: {
        Row: {
          id: string
          user_id: string
          title: string
          body: string
          type: 'campaign' | 'reward' | 'system' | 'rank_up'
          is_read: boolean
          link: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_notifications']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['tr_notifications']['Insert']>
      }
      tr_campaign_reviews: {
        Row: {
          id: string
          user_id: string
          campaign_id: string
          earn_score: number
          difficulty_score: number
          trust_score: number
          comment: string | null
          created_at: string
        }
        Insert: Omit<Database['public']['Tables']['tr_campaign_reviews']['Row'], 'created_at'>
        Update: Partial<Database['public']['Tables']['tr_campaign_reviews']['Insert']>
      }
    }
  }
}
