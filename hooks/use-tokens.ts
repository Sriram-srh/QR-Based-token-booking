import { useState, useCallback, useEffect } from 'react'
import { normalizeMealType } from '@/lib/meal-type'

export interface MealToken {
  id: string
  student_id: string
  meal_type: string
  status: 'VALID' | 'USED' | 'EXPIRED' | 'CANCELLED'
  qr_code: string
  qr_code_image: string
  total_cost: number
  created_at: string
  expires_at: string
  scanned_at: string | null
  counter_id: string | null
}

export function useTokens(studentId?: string) {
  const [tokens, setTokens] = useState<MealToken[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const fetchTokens = useCallback(async () => {
    if (!studentId) return
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch(`/api/tokens?studentId=${studentId}`)
      if (!response.ok) throw new Error('Failed to fetch tokens')
      
      const { tokens } = await response.json()
      setTokens(tokens)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch tokens')
    } finally {
      setLoading(false)
    }
  }, [studentId])

  const createToken = useCallback(async (mealType: string, totalCost: number) => {
    if (!studentId) throw new Error('Student ID required')

    const normalizedMealType = normalizeMealType(mealType)
    if (!normalizedMealType) {
      throw new Error('Invalid meal type. Use Breakfast, Lunch, or Dinner.')
    }
    
    setLoading(true)
    setError(null)
    
    try {
      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, mealType: normalizedMealType, totalCost })
      })
      
      if (!response.ok) throw new Error('Failed to create token')
      
      const { token } = await response.json()
      setTokens(prev => [token, ...prev])
      return token
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Failed to create token'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [studentId])

  useEffect(() => {
    fetchTokens()
  }, [fetchTokens])

  return {
    tokens,
    loading,
    error,
    fetchTokens,
    createToken
  }
}
