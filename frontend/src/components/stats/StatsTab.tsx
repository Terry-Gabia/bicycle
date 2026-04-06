import { useMemo } from 'react'
import type { BicycleRecord, MemberName } from '@/types'
import { MEMBERS, MEMBER_GOALS } from '@/types'

interface Props {
  records: BicycleRecord[]
  loading: boolean
  currentMonth: { year: number; month: number }
}

function getWeekNumber(dateStr: string, year: number, month: number): number {
  const date = new Date(dateStr)
  const firstDay = new Date(year, month, 1)
  const firstDayOfWeek = firstDay.getDay()
  const dayOfMonth = date.getDate()
  return Math.ceil((dayOfMonth + firstDayOfWeek) / 7)
}

function getDaysInMonth(year: number, month: number): number {
  return new Date(year, month + 1, 0).getDate()
}

export function StatsTab({ records, loading, currentMonth }: Props) {
  const { year, month } = currentMonth
  const today = new Date()
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month
  const daysInMonth = getDaysInMonth(year, month)
  const daysPassed = isCurrentMonth ? today.getDate() : daysInMonth
  const daysRemaining = isCurrentMonth ? daysInMonth - today.getDate() : 0

  const stats = useMemo(() => {
    const weeklyData: Record<number, Record<string, number>> = {}
    const monthlyCounts: Record<string, number> = { mama: 0, soli: 0, papa: 0 }

    records.forEach((r) => {
      const week = getWeekNumber(r.record_date, year, month)
      if (!weeklyData[week]) weeklyData[week] = { mama: 0, soli: 0, papa: 0 }

      MEMBERS.forEach((m) => {
        if (r[m.key]) {
          weeklyData[week][m.key]++
          monthlyCounts[m.key]++
        }
      })
    })

    return { weeklyData, monthlyCounts }
  }, [records, year, month])

  const totalWeeks = Math.ceil((new Date(year, month, 1).getDay() + daysInMonth) / 7)

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Month Title */}
      <h2 className="text-xl font-bold text-center">
        {year}년 {month + 1}월 통계
      </h2>

      {/* Member Goal Cards */}
      <div className="grid gap-4">
        {MEMBERS.map((m) => {
          const count = stats.monthlyCounts[m.key]
          const goal = MEMBER_GOALS[m.label as MemberName]
          const achieved = count >= goal.target
          const remaining = Math.max(0, goal.target - count)
          const progress = Math.min(100, (count / goal.target) * 100)

          return (
            <div
              key={m.key}
              className={`rounded-2xl border-2 p-5 transition-all ${
                achieved
                  ? 'border-green-400 bg-green-50 dark:border-green-600 dark:bg-green-900/20'
                  : 'border-border bg-card'
              }`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <div className={`h-4 w-4 rounded-full ${m.color}`} />
                  <span className="text-lg font-bold">{m.label}</span>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-bold">{count}</span>
                  <span className="text-muted-foreground">/{goal.target}회</span>
                </div>
              </div>

              {/* Progress Bar */}
              <div className="mb-3 h-3 w-full rounded-full bg-muted overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${m.color}`}
                  style={{ width: `${progress}%` }}
                />
              </div>

              {/* Message */}
              <div className="text-center">
                {achieved ? (
                  <p className="text-lg font-bold text-green-600 dark:text-green-400">
                    {m.label === '솔이' && '용돈 만원 추가!!!'}
                    {m.label === '엄마' && '건강 100점!! 대단해요!!'}
                    {m.label === '아빠' && '운동 목표 달성!! 멋져요!!'}
                  </p>
                ) : isCurrentMonth ? (
                  <p className="text-sm text-muted-foreground">
                    {m.label === '솔이' && (
                      <span>
                        <span className="font-semibold text-purple-500">{remaining}번</span>만 더 하면{' '}
                        <span className="font-bold text-purple-600 dark:text-purple-400">용돈 만원!!!</span>
                        {daysRemaining > 0 && <span className="block mt-1 text-xs">남은 {daysRemaining}일 안에 화이팅!</span>}
                      </span>
                    )}
                    {m.label === '엄마' && (
                      <span>
                        이번달 <span className="font-semibold text-pink-500">{remaining}번</span> 남았어요!{' '}
                        <span className="font-bold text-pink-600 dark:text-pink-400">화이팅!!</span>
                        {daysRemaining > 0 && <span className="block mt-1 text-xs">남은 {daysRemaining}일, 할 수 있어요!</span>}
                      </span>
                    )}
                    {m.label === '아빠' && (
                      <span>
                        이번달 <span className="font-semibold text-blue-500">{remaining}번</span> 남았어요!{' '}
                        <span className="font-bold text-blue-600 dark:text-blue-400">화이팅!!</span>
                        {daysRemaining > 0 && <span className="block mt-1 text-xs">남은 {daysRemaining}일, 꾸준히!</span>}
                      </span>
                    )}
                  </p>
                ) : (
                  <p className="text-sm text-muted-foreground">
                    목표 미달성 ({remaining}회 부족)
                  </p>
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* Weekly Stats Table */}
      <div className="rounded-xl border border-border overflow-hidden">
        <div className="bg-muted px-4 py-3">
          <h3 className="font-semibold">주간별 기록</h3>
        </div>
        <table className="w-full">
          <thead>
            <tr className="border-b border-border bg-muted/50">
              <th className="px-4 py-2 text-left text-sm font-medium text-muted-foreground">주차</th>
              {MEMBERS.map((m) => (
                <th key={m.key} className="px-4 py-2 text-center text-sm font-medium text-muted-foreground">
                  {m.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {Array.from({ length: totalWeeks }).map((_, i) => {
              const week = i + 1
              const weekData = stats.weeklyData[week] || { mama: 0, soli: 0, papa: 0 }
              return (
                <tr key={week} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 text-sm font-medium">{week}주차</td>
                  {MEMBERS.map((m) => (
                    <td key={m.key} className="px-4 py-3 text-center">
                      <span
                        className={`inline-flex h-7 w-7 items-center justify-center rounded-full text-sm font-bold ${
                          weekData[m.key] > 0
                            ? `${m.color} text-white`
                            : 'text-muted-foreground'
                        }`}
                      >
                        {weekData[m.key]}
                      </span>
                    </td>
                  ))}
                </tr>
              )
            })}
            {/* Monthly Total */}
            <tr className="bg-muted/50 font-bold">
              <td className="px-4 py-3 text-sm">합계</td>
              {MEMBERS.map((m) => (
                <td key={m.key} className="px-4 py-3 text-center text-sm">
                  {stats.monthlyCounts[m.key]}회
                </td>
              ))}
            </tr>
          </tbody>
        </table>
      </div>

      {/* Daily Streak Info */}
      {isCurrentMonth && (
        <div className="rounded-xl border border-border bg-card p-4 text-center">
          <p className="text-sm text-muted-foreground">
            {month + 1}월은 총 <span className="font-bold text-foreground">{daysInMonth}일</span>
            {' / '}경과 <span className="font-bold text-foreground">{daysPassed}일</span>
            {' / '}남은 <span className="font-bold text-primary">{daysRemaining}일</span>
          </p>
        </div>
      )}
    </div>
  )
}
