export type Theme = 'light' | 'dark'
export type MemberName = '엄마' | '솔이' | '아빠'

export interface BicycleRecord {
  id: string
  record_date: string
  mama: boolean
  soli: boolean
  papa: boolean
  created_at: string
  updated_at: string
}

export interface UserProfile {
  user_id: string
  display_name: string | null
  theme: Theme
}

export const MEMBERS: { key: keyof Pick<BicycleRecord, 'mama' | 'soli' | 'papa'>; label: MemberName; color: string; darkColor: string }[] = [
  { key: 'mama', label: '엄마', color: 'bg-pink-500', darkColor: 'bg-pink-400' },
  { key: 'soli', label: '솔이', color: 'bg-purple-500', darkColor: 'bg-purple-400' },
  { key: 'papa', label: '아빠', color: 'bg-blue-500', darkColor: 'bg-blue-400' },
]

export const MEMBER_GOALS: Record<MemberName, { target: number; reward: string }> = {
  '솔이': { target: 15, reward: '용돈 만원 추가!!' },
  '엄마': { target: 10, reward: '건강 100점!!' },
  '아빠': { target: 7, reward: '운동 목표 달성!!' },
}
