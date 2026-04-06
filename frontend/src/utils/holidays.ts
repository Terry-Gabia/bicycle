// 한국 공휴일 (고정 + 음력 기반)
const FIXED_HOLIDAYS: Record<string, string> = {
  '01-01': '신정',
  '03-01': '삼일절',
  '05-05': '어린이날',
  '06-06': '현충일',
  '08-15': '광복절',
  '10-03': '개천절',
  '10-09': '한글날',
  '12-25': '크리스마스',
}

// 음력 기반 공휴일 (연도별)
const LUNAR_HOLIDAYS: Record<string, string> = {
  // 2025
  '2025-01-28': '설날 연휴',
  '2025-01-29': '설날',
  '2025-01-30': '설날 연휴',
  '2025-05-05': '부처님오신날',
  '2025-10-05': '추석 연휴',
  '2025-10-06': '추석',
  '2025-10-07': '추석 연휴',
  '2025-10-08': '대체공휴일',
  // 2026
  '2026-02-16': '설날 연휴',
  '2026-02-17': '설날',
  '2026-02-18': '설날 연휴',
  '2026-05-24': '부처님오신날',
  '2026-09-24': '추석 연휴',
  '2026-09-25': '추석',
  '2026-09-26': '추석 연휴',
  // 2027
  '2027-02-06': '설날 연휴',
  '2027-02-07': '설날',
  '2027-02-08': '설날 연휴',
  '2027-02-09': '대체공휴일',
  '2027-05-13': '부처님오신날',
  '2027-10-14': '추석 연휴',
  '2027-10-15': '추석',
  '2027-10-16': '추석 연휴',
}

// 가족 생일 (고정 양력)
const FIXED_BIRTHDAYS: Record<string, string> = {
  '09-01': '🎂엄마 생일',
  '12-12': '🎂솔이 생일',
  '10-16': '🎂연준 생일',
}

// 아빠 생일 (음력 9/1 → 연도별 양력 변환)
const PAPA_BIRTHDAY: Record<string, string> = {
  '2025-10-23': '🎂아빠 생일',
  '2026-10-11': '🎂아빠 생일',
  '2027-10-31': '🎂아빠 생일',
}

// 매월 2째주, 4째주 금요일 = 놀금 (가비아)
function isNolgeum(dateStr: string): boolean {
  const date = new Date(dateStr)
  if (date.getDay() !== 5) return false // 금요일만
  const day = date.getDate()
  const weekNum = Math.ceil(day / 7)
  return weekNum === 2 || weekNum === 4
}

export function getBirthdayName(dateStr: string): string | null {
  if (PAPA_BIRTHDAY[dateStr]) return PAPA_BIRTHDAY[dateStr]
  const monthDay = dateStr.slice(5)
  if (FIXED_BIRTHDAYS[monthDay]) return FIXED_BIRTHDAYS[monthDay]
  return null
}

export function getNolgeumName(dateStr: string): string | null {
  return isNolgeum(dateStr) ? '🎉아빠놀금' : null
}

export function getHolidayName(dateStr: string): string | null {
  // 음력 기반 공휴일 체크
  if (LUNAR_HOLIDAYS[dateStr]) return LUNAR_HOLIDAYS[dateStr]

  // 고정 공휴일 체크
  const monthDay = dateStr.slice(5) // "MM-DD"
  if (FIXED_HOLIDAYS[monthDay]) return FIXED_HOLIDAYS[monthDay]

  return null
}

export function getDateLabel(dateStr: string): string | null {
  return getHolidayName(dateStr) || getBirthdayName(dateStr) || getNolgeumName(dateStr)
}

export function isHoliday(dateStr: string): boolean {
  return getHolidayName(dateStr) !== null
}

export function isBirthday(dateStr: string): boolean {
  return getBirthdayName(dateStr) !== null
}
