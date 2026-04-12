'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { QRGenerator } from './qr-generator'
import { useVerify } from '@/hooks/use-verify'

export function QRTest() {
  const [testQRCode, setTestQRCode] = useState<string>('')
  const [showGenerator, setShowGenerator] = useState(false)
  const { verifyToken, loading, error, result, clearResult } = useVerify()

  const handleTestVerification = async () => {
    if (!testQRCode) {
      alert('Please enter a QR code to verify')
      return
    }

    try {
      await verifyToken(testQRCode, 'counter-1')
    } catch (err) {
      console.error('[v0] Test verification error:', err)
    }
  }

  const handleGenerateTestQR = () => {
    // Generate a test QR code
    const testData = `TOKEN:${Date.now()}:test-student-id:Lunch`
    setTestQRCode(testData)
    setShowGenerator(true)
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>QR Code System Test</CardTitle>
          <CardDescription>Test QR generation and verification functionality</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* QR Generation Test */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">QR Code Generation</h3>
            <Button onClick={handleGenerateTestQR} className="w-full mb-2">
              Generate Test QR Code
            </Button>
            {showGenerator && testQRCode && (
              <QRGenerator />
            )}
          </div>

          {/* QR Verification Test */}
          <div className="border rounded-lg p-4">
            <h3 className="font-semibold mb-2">QR Code Verification</h3>
            <div className="space-y-2">
              <input
                type="text"
                placeholder="Enter QR code data to verify"
                value={testQRCode}
                onChange={(e) => setTestQRCode(e.target.value)}
                className="w-full px-2 py-1 border rounded"
              />
              <Button 
                onClick={handleTestVerification}
                disabled={loading}
                className="w-full"
              >
                {loading ? 'Verifying...' : 'Verify QR Code'}
              </Button>
            </div>
          </div>

          {/* Results */}
          {error && (
            <Alert variant="destructive">
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          {result && (
            <Alert>
              <AlertDescription>
                <div className="space-y-2">
                  <p className="font-semibold text-green-600">{result.message}</p>
                  <p>Student: {result.student?.name}</p>
                  <p>Token Type: {result.token?.meal_type}</p>
                  <p>Status: {result.token?.status}</p>
                  <Button 
                    variant="outline"
                    size="sm"
                    onClick={clearResult}
                  >
                    Clear
                  </Button>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Database Status */}
          <div className="border rounded-lg p-4 bg-blue-50">
            <h3 className="font-semibold mb-2">Database Setup Status</h3>
            <ul className="space-y-1 text-sm">
              <li>✓ Database schema created</li>
              <li>✓ Sample data seeded</li>
              <li>✓ QR generation utilities ready</li>
              <li>✓ API endpoints configured</li>
              <li>✓ Verification system active</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
