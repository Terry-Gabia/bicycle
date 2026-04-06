import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { BicycleRecord } from '@/types'
import { MEMBERS } from '@/types'

interface Props {
  records: BicycleRecord[]
  loading: boolean
  currentMonth: { year: number; month: number }
  onToggle: (date: string, member: 'mama' | 'soli' | 'papa') => void
  onPrevMonth: () => void
  onNextMonth: () => void
  onToday: () => void
}

const DAY_LABELS = ['일', '월', '화', '수', '목', '금', '토']

function getDaysInMonth(year: number, month: number) {
  return new Date(year, month + 1, 0).getDate()
}

function getFirstDayOfMonth(year: number, month: number) {
  return new Date(year, month, 1).getDay()
}

function formatDate(year: number, month: number, day: number) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

export function BicycleCalendar({ records, loading, currentMonth, onToggle, onPrevMonth, onNextMonth, onToday }: Props) {
  const { year, month } = currentMonth
  const daysInMonth = getDaysInMonth(year, month)
  const firstDay = getFirstDayOfMonth(year, month)
  const today = new Date()
  const todayStr = formatDate(today.getFullYear(), today.getMonth(), today.getDate())
  const isCurrentMonth = today.getFullYear() === year && today.getMonth() === month

  const recordMap = new Map<string, BicycleRecord>()
  records.forEach((r) => recordMap.set(r.record_date, r))

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="text-muted-foreground">로딩 중...</div>
      </div>
    )
  }

  return (
    <div>
      {/* Month Navigation */}
      <div className="mb-4 flex items-center justify-between">
        <button
          onClick={onPrevMonth}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
        >
          <ChevronLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <h2 className="text-xl font-bold">
            {year}년 {month + 1}월
          </h2>
          {!isCurrentMonth && (
            <button
              onClick={onToday}
              className="rounded-md bg-muted px-2.5 py-1 text-xs font-medium text-muted-foreground hover:bg-muted/80 transition-colors"
            >
              오늘
            </button>
          )}
        </div>
        <button
          onClick={onNextMonth}
          className="rounded-lg p-2 hover:bg-muted transition-colors"
        >
          <ChevronRight className="h-5 w-5" />
        </button>
      </div>

      {/* Member Legend */}
      <div className="mb-4 flex items-center justify-center gap-4">
        {MEMBERS.map((m) => (
          <div key={m.key} className="flex items-center gap-1.5">
            <div className={`h-3 w-3 rounded-full ${m.color}`} />
            <span className="text-sm font-medium">{m.label}</span>
          </div>
        ))}
      </div>

      {/* Calendar Grid */}
      <div className="rounded-xl border border-border overflow-hidden">
        {/* Day Headers */}
        <div className="grid grid-cols-7 bg-muted">
          {DAY_LABELS.map((day, i) => (
            <div
              key={day}
              className={`py-2 text-center text-xs font-semibold ${
                i === 0 ? 'text-red-500' : i === 6 ? 'text-blue-500' : 'text-muted-foreground'
              }`}
            >
              {day}
            </div>
          ))}
        </div>

        {/* Date Cells */}
        <div className="grid grid-cols-7">
          {/* Empty cells for days before the first */}
          {Array.from({ length: firstDay }).map((_, i) => (
            <div key={`empty-${i}`} className="border-t border-border bg-muted/30 p-1 min-h-[80px] sm:min-h-[100px]" />
          ))}

          {/* Actual days */}
          {Array.from({ length: daysInMonth }).map((_, i) => {
            const day = i + 1
            const dateStr = formatDate(year, month, day)
            const record = recordMap.get(dateStr)
            const dayOfWeek = (firstDay + i) % 7
            const isToday = dateStr === todayStr
            const isFuture = new Date(dateStr) > today

            return (
              <div
                key={day}
                className={`border-t border-border p-1 min-h-[80px] sm:min-h-[100px] transition-colors ${
                  isToday ? 'bg-primary/5' : ''
                } ${isFuture ? 'opacity-50' : ''}`}
              >
                <div
                  className={`mb-1 text-xs font-medium ${
                    isToday
                      ? 'inline-flex h-5 w-5 items-center justify-center rounded-full bg-primary text-primary-foreground'
                      : dayOfWeek === 0
                        ? 'text-red-500'
                        : dayOfWeek === 6
                          ? 'text-blue-500'
                          : 'text-foreground'
                  }`}
                >
                  {day}
                </div>
                <div className="flex flex-col gap-0.5">
                  {MEMBERS.map((m) => {
                    const checked = record?.[m.key] ?? false
                    return (
                      <button
                        key={m.key}
                        onClick={() => !isFuture && onToggle(dateStr, m.key)}
                        disabled={isFuture}
                        className={`flex items-center gap-1 rounded px-1 py-0.5 text-[10px] sm:text-xs transition-all ${
                          checked
                            ? `${m.color} text-white font-medium`
                            : 'hover:bg-muted text-muted-foreground'
                        } ${isFuture ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <span className={`inline-flex h-3 w-3 sm:h-3.5 sm:w-3.5 items-center justify-center rounded border ${
                          checked
                            ? 'border-white/50 bg-white/20'
                            : 'border-border'
                        }`}>
                          {checked && (
                            <svg className="h-2 w-2 sm:h-2.5 sm:w-2.5" viewBox="0 0 12 12" fill="none">
                              <path d="M2 6l3 3 5-5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                            </svg>
                          )}
                        </span>
                        <span className="hidden sm:inline">{m.label}</span>
                      </button>
                    )
                  })}
                </div>
              </div>
            )
          })}

          {/* Fill remaining cells */}
          {Array.from({ length: (7 - ((firstDay + daysInMonth) % 7)) % 7 }).map((_, i) => (
            <div key={`fill-${i}`} className="border-t border-border bg-muted/30 p-1 min-h-[80px] sm:min-h-[100px]" />
          ))}
        </div>
      </div>

      {/* Monthly Summary */}
      <div className="mt-4 grid grid-cols-3 gap-3">
        {MEMBERS.map((m) => {
          const count = records.filter((r) => r[m.key]).length
          return (
            <div key={m.key} className="rounded-xl border border-border bg-card p-4 text-center">
              <div className={`text-2xl font-bold ${m.color.replace('bg-', 'text-')}`}>{count}회</div>
              <div className="mt-1 text-sm text-muted-foreground">{m.label}</div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
