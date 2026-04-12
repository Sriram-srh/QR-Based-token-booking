import { useState, useCallback } from 'react'

export interface VerificationResult {
  success: boolean
  token: {
    id: string
    student_id: string
    meal_type: string
    status: string
  }
  student: {
    name: string
    email: string
  }
  message: string
}

export function useVerify() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [result, setResult] = useState<VerificationResult | null>(null)

  const verifyToken = useCallback(async (qrCode: string, counterId: string) => {
    setLoading(true)
    setError(null)
    setResult(null)
    
    try {
      const response = await fetch('/api/verify', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ qrCode, counterId })
      })
      
      const data = await response.json()
      
      if (!response.ok) {
        throw new Error(data.error || 'Verification failed')
      }
      
      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Verification failed'
      setError(errorMessage)
      throw err
    } finally {
      setLoading(false)
    }
  }, [])

  const clearResult = useCallback(() => {
    setResult(null)
    setError(null)
  }, [])

  return {
    verifyToken,
    loading,
    error,
    result,
    clearResult
  }
}
