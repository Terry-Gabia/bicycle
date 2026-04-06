-- =============================================
-- SOUL의 자전거 기록 - Supabase Schema
-- =============================================

-- 1. 자전거 기록 테이블
CREATE TABLE IF NOT EXISTS public.bicycle_records (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  record_date DATE NOT NULL UNIQUE,
  mama BOOLEAN DEFAULT false NOT NULL,
  soli BOOLEAN DEFAULT false NOT NULL,
  papa BOOLEAN DEFAULT false NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 인덱스
CREATE INDEX IF NOT EXISTS idx_bicycle_records_date ON public.bicycle_records(record_date DESC);

-- RLS 활성화
ALTER TABLE public.bicycle_records ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 인증된 사용자는 모든 기록 조회 가능
CREATE POLICY "Authenticated users can read all records"
  ON public.bicycle_records FOR SELECT
  TO authenticated
  USING (true);

-- RLS 정책: 인증된 사용자는 기록 추가 가능
CREATE POLICY "Authenticated users can insert records"
  ON public.bicycle_records FOR INSERT
  TO authenticated
  WITH CHECK (true);

-- RLS 정책: 인증된 사용자는 기록 수정 가능
CREATE POLICY "Authenticated users can update records"
  ON public.bicycle_records FOR UPDATE
  TO authenticated
  USING (true)
  WITH CHECK (true);

-- 2. 사용자 프로필 (테마 저장용)
CREATE TABLE IF NOT EXISTS public.bicycle_user_profiles (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name TEXT,
  theme TEXT DEFAULT 'light' CHECK (theme IN ('light', 'dark')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- RLS 활성화
ALTER TABLE public.bicycle_user_profiles ENABLE ROW LEVEL SECURITY;

-- RLS 정책: 본인 프로필 조회
CREATE POLICY "Users can read own profile"
  ON public.bicycle_user_profiles FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id);

-- RLS 정책: 본인 프로필 생성
CREATE POLICY "Users can insert own profile"
  ON public.bicycle_user_profiles FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- RLS 정책: 본인 프로필 수정
CREATE POLICY "Users can update own profile"
  ON public.bicycle_user_profiles FOR UPDATE
  TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

-- 3. Realtime 활성화
ALTER PUBLICATION supabase_realtime ADD TABLE public.bicycle_records;
