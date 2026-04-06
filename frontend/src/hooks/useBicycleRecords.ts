import { useState, useEffect, useCallback } from 'react'
import { supabase } from '@/lib/supabase'
import type { BicycleRecord } from '@/types'

export function useBicycleRecords(userId: string | null) {
  const [records, setRecords] = useState<BicycleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [currentMonth, setCurrentMonth] = useState(() => {
    const now = new Date()
    return { year: now.getFullYear(), month: now.getMonth() }
  })

  const fetchRecords = useCallback(async () => {
    if (!userId) {
      setRecords([])
      setLoading(false)
      return
    }

    const startDate = new Date(currentMonth.year, currentMonth.month, 1)
    const endDate = new Date(currentMonth.year, currentMonth.month + 1, 0)

    const startStr = startDate.toISOString().split('T')[0]
    const endStr = endDate.toISOString().split('T')[0]

    const { data, error } = await supabase
      .from('bicycle_records')
      .select('*')
      .gte('record_date', startStr)
      .lte('record_date', endStr)
      .order('record_date', { ascending: true })

    if (error) {
      console.error('Error fetching records:', error)
    } else {
      setRecords(data || [])
    }
    setLoading(false)
  }, [userId, currentMonth])

  useEffect(() => {
    fetchRecords()
  }, [fetchRecords])

  useEffect(() => {
    if (!userId) return

    const channel = supabase
      .channel('bicycle-records-realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'bicycle_records' }, () => {
        fetchRecords()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [userId, fetchRecords])

  const toggleRecord = useCallback(
    async (date: string, member: 'mama' | 'soli' | 'papa') => {
      if (!userId) return

      const existing = records.find((r) => r.record_date === date)

      if (existing) {
        const newValue = !existing[member]
        // Optimistic update
        setRecords((prev) =>
          prev.map((r) => (r.record_date === date ? { ...r, [member]: newValue, updated_at: new Date().toISOString() } : r))
        )

        const { error } = await supabase
          .from('bicycle_records')
          .update({ [member]: newValue, updated_at: new Date().toISOString() })
          .eq('id', existing.id)

        if (error) {
          console.error('Error updating record:', error)
          fetchRecords()
        }
      } else {
        const newRecord: Partial<BicycleRecord> = {
          record_date: date,
          mama: member === 'mama',
          soli: member === 'soli',
          papa: member === 'papa',
        }

        // Optimistic update
        const tempId = crypto.randomUUID()
        const optimistic: BicycleRecord = {
          id: tempId,
          record_date: date,
          mama: member === 'mama',
          soli: member === 'soli',
          papa: member === 'papa',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        }
        setRecords((prev) => [...prev, optimistic].sort((a, b) => a.record_date.localeCompare(b.record_date)))

        const { error } = await supabase.from('bicycle_records').insert(newRecord)

        if (error) {
          console.error('Error inserting record:', error)
          fetchRecords()
        } else {
          fetchRecords()
        }
      }
    },
    [userId, records, fetchRecords]
  )

  const goToPrevMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 0) return { year: prev.year - 1, month: 11 }
      return { ...prev, month: prev.month - 1 }
    })
  }, [])

  const goToNextMonth = useCallback(() => {
    setCurrentMonth((prev) => {
      if (prev.month === 11) return { year: prev.year + 1, month: 0 }
      return { ...prev, month: prev.month + 1 }
    })
  }, [])

  const goToToday = useCallback(() => {
    const now = new Date()
    setCurrentMonth({ year: now.getFullYear(), month: now.getMonth() })
  }, [])

  return {
    records,
    loading,
    currentMonth,
    toggleRecord,
    goToPrevMonth,
    goToNextMonth,
    goToToday,
    fetchRecords,
  }
}
