'use client';

import { useEffect, useState } from 'react';
import QRCode from 'qrcode.react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { getAuthHeadersAsync, parseJsonSafe } from '@/lib/client-auth';

interface QRGeneratorProps {
  onSuccess?: (token: any) => void;
}

export function QRGenerator({ onSuccess }: QRGeneratorProps) {
  const [studentId, setStudentId] = useState('');
  const [mealType, setMealType] = useState('');
  const [totalCost, setTotalCost] = useState('');
  const [counterId, setCounterId] = useState('');
  const [loading, setLoading] = useState(false);
  const [generatedToken, setGeneratedToken] = useState<any>(null);
  const [hideQR, setHideQR] = useState(false);

  useEffect(() => {
    const handleVisibility = () => {
      setHideQR(document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    handleVisibility();

    return () => {
      document.removeEventListener('visibilitychange', handleVisibility);
    };
  }, []);

  const handleGenerate = async () => {
    if (!studentId || !mealType || !totalCost) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const headers = await getAuthHeadersAsync();
      const response = await fetch('/api/qr/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          studentId,
          mealType,
          totalCost: parseFloat(totalCost),
          counterId: counterId || null,
        }),
      });

      if (!response.ok) {
        const error = await parseJsonSafe(response);
        toast.error(error.error || 'Failed to generate QR code');
        return;
      }

      const data = await parseJsonSafe(response);
      setGeneratedToken(data.token);
      toast.success('QR code generated successfully!');
      onSuccess?.(data.token);
    } catch (error) {
      console.error('[v0] Error generating QR code:', error);
      toast.error('An error occurred while generating QR code');
    } finally {
      setLoading(false);
    }
  };

  const downloadQR = () => {
    if (!generatedToken) return;

    const canvas = document.querySelector('canvas');
    if (canvas) {
      const link = document.createElement('a');
      link.href = canvas.toDataURL('image/png');
      link.download = `meal-token-${generatedToken.id}.png`;
      link.click();
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Meal Token QR Code</CardTitle>
          <CardDescription>Create a new QR code for a student's meal booking</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="student-id">Student ID *</Label>
            <Input
              id="student-id"
              placeholder="Enter student ID"
              value={studentId}
              onChange={(e) => setStudentId(e.target.value)}
              disabled={loading}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="meal-type">Meal Type *</Label>
            <Select value={mealType} onValueChange={setMealType} disabled={loading}>
              <SelectTrigger id="meal-type">
                <SelectValue placeholder="Select meal type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="Breakfast">Breakfast</SelectItem>
                <SelectItem value="Lunch">Lunch</SelectItem>
                <SelectItem value="Dinner">Dinner</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-2">
            <Label htmlFor="total-cost">Total Cost (₹) *</Label>
            <Input
              id="total-cost"
              type="number"
              placeholder="0.00"
              value={totalCost}
              onChange={(e) => setTotalCost(e.target.value)}
              disabled={loading}
              step="0.01"
              min="0"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="counter-id">Counter ID (Optional)</Label>
            <Input
              id="counter-id"
              placeholder="Enter counter ID"
              value={counterId}
              onChange={(e) => setCounterId(e.target.value)}
              disabled={loading}
            />
          </div>

          <Button variant="chrome" onClick={handleGenerate} disabled={loading} className="w-full px-5 py-2">
            {loading ? 'Generating...' : 'Generate QR Code'}
          </Button>
        </CardContent>
      </Card>

      {generatedToken && (
        <Card>
          <CardHeader>
            <CardTitle>Generated QR Code</CardTitle>
            <CardDescription>Scan this QR code at the meal counter</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4 flex flex-col items-center">
            {hideQR ? (
              <div className="border-2 border-destructive/40 rounded-lg p-4 bg-destructive/5 w-full text-center">
                <p className="text-sm font-medium text-destructive">QR hidden for security</p>
              </div>
            ) : (
              <div className="relative border-2 border-gray-300 rounded-lg p-4 bg-white select-none">
                <QRCode
                  value={generatedToken.id}
                  size={256}
                  level="H"
                  includeMargin={true}
                />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <span className="text-xs font-semibold text-gray-700/20 rotate-[-20deg] tracking-wide">
                    {studentId || generatedToken.id.slice(0, 8)}
                  </span>
                </div>
              </div>
            )}

            <div className="w-full space-y-2 text-sm">
              <p className="text-center">
                <strong>Token ID:</strong> {generatedToken.id}
              </p>
              <p className="text-center">
                <strong>Meal Type:</strong> {generatedToken.mealType}
              </p>
              <p className="text-center">
                <strong>Amount:</strong> ₹{generatedToken.totalCost.toFixed(2)}
              </p>
              <p className="text-center text-gray-600 text-xs">
                Expires: {new Date(generatedToken.expiresAt).toLocaleString()}
              </p>
            </div>

            <Button onClick={downloadQR} variant="threed" className="w-full">
              Download QR Code
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
