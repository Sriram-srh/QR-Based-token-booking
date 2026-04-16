'use client';

import { useEffect, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { getAuthHeadersAsync, parseJsonSafe } from '@/lib/client-auth';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2 } from 'lucide-react';

interface QRScannerProps {
  counterId: string;
  staffId?: string;
  onScanSuccess?: (result: any) => void;
}

interface ScanResult {
  success: boolean;
  token?: {
    id: string;
    studentId: string;
    mealType: string;
    status: string;
  };
  student?: {
    id: string;
    name: string;
    registerNumber: string;
    hostel: string;
    room: string;
    photo?: string;
  };
  error?: string;
}

export function QRScanner({ counterId, staffId, onScanSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const scanLoopActiveRef = useRef(false);
  const scanLockRef = useRef(false);
  const lastScannedCodeRef = useRef<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualQRCode, setManualQRCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSecureContextReady, setIsSecureContextReady] = useState(true);

  const stopScanner = () => {
    scanLoopActiveRef.current = false;

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    setScanning(false);
  };

  const resetForNextScan = () => {
    scanLockRef.current = false;
    lastScannedCodeRef.current = null;
    setLastScannedCode(null);
    setScanResult(null);
  };

  useEffect(() => {
    setIsSecureContextReady(typeof window !== 'undefined' ? window.isSecureContext : true);
  }, []);

  useEffect(() => {
    if (!scanning) return;
    scanLoopActiveRef.current = true;

    const startCamera = async () => {
      try {
        if (!window.isSecureContext) {
          toast.error('Camera requires HTTPS or localhost. Open this app on localhost/https and try again.');
          setScanning(false);
          return;
        }

        if (!navigator.mediaDevices || !navigator.mediaDevices.getUserMedia) {
          toast.error('Camera API is not supported in this browser.');
          setScanning(false);
          return;
        }

        const stream = await navigator.mediaDevices.getUserMedia({
          video: {
            facingMode: 'environment',
            width: { ideal: 1280 },
            height: { ideal: 720 },
          },
        });

        if (videoRef.current) {
          videoRef.current.srcObject = stream;
        }

        // Start scanning loop
        const scanQRCode = async () => {
          if (
            videoRef.current &&
            canvasRef.current &&
            videoRef.current.readyState === videoRef.current.HAVE_ENOUGH_DATA
          ) {
            const canvas = canvasRef.current;
            const ctx = canvas.getContext('2d');

            if (ctx) {
              canvas.width = videoRef.current.videoWidth;
              canvas.height = videoRef.current.videoHeight;

              ctx.drawImage(videoRef.current, 0, 0);

              const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
              const code = jsQR(imageData.data, imageData.width, imageData.height);

              if (code && !scanLockRef.current && code.data !== lastScannedCodeRef.current) {
                lastScannedCodeRef.current = code.data;
                setLastScannedCode(code.data);
                await handleQRCodeDetected(code.data);
              }
            }
          }

          if (scanLoopActiveRef.current) {
            requestAnimationFrame(scanQRCode);
          }
        };

        scanQRCode();
      } catch (error) {
        console.error('[v0] Error accessing camera:', error);
        toast.error('Could not access camera. Check browser camera permission and try again.');
        setScanning(false);
      }
    };

    startCamera();

    return () => {
      stopScanner();
    };
  }, [scanning]);

  const handleQRCodeDetected = async (qrCode: string) => {
    if (scanLockRef.current) {
      return;
    }

    scanLockRef.current = true;

    if (!counterId) {
      toast.error('Select a counter before scanning.');
      scanLockRef.current = false;
      return;
    }

    // Stop camera immediately to avoid duplicate callback processing from subsequent frames.
    stopScanner();

    setLoading(true);
    try {
      const headers = await getAuthHeadersAsync();
      const response = await fetch('/api/qr/scan', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          qrCode,
          counterId,
          staffId: staffId || null,
        }),
      });

      const data = await parseJsonSafe(response);

      if (response.ok) {
        setScanResult(data);
        toast.success(`Meal verified for ${data.student?.name}`);
        onScanSuccess?.(data);
      } else {
        setScanResult(data);
        toast.error(data.error || 'Failed to verify QR code');
      }
    } catch (error) {
      console.error('[v0] Error scanning QR code:', error);
      toast.error('An error occurred while scanning');
    } finally {
      setLoading(false);
    }
  };

  const handleManualEntry = async () => {
    if (!manualQRCode.trim()) {
      toast.error('Please enter a QR code');
      return;
    }

    resetForNextScan();
    await handleQRCodeDetected(manualQRCode);
    setManualQRCode('');
  };

  return (
    <div className="space-y-6">
      {!isSecureContextReady && (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Camera scanning needs HTTPS or localhost. If camera fails, use manual QR entry below.
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle>QR Code Scanner</CardTitle>
          <CardDescription>Scan meal tokens or enter code manually</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {scanning ? (
            <div className="space-y-4">
              <div className="relative bg-black rounded-lg overflow-hidden aspect-video">
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <canvas ref={canvasRef} className="hidden" />
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-2 border-green-500 rounded-lg opacity-75"></div>
                </div>
              </div>

              <Button
                onClick={() => setScanning(false)}
                variant="outline"
                className="w-full"
                disabled={loading}
              >
                Stop Camera
              </Button>
            </div>
          ) : (
            <Button onClick={() => setScanning(true)} className="w-full">
              Start Camera
            </Button>
          )}

          {!scanning && (
            <Button
              onClick={() => {
                resetForNextScan();
                setScanning(true);
              }}
              variant="outline"
              className="w-full"
              disabled={loading}
            >
              Scan Next
            </Button>
          )}

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t"></div>
            </div>
            <div className="relative flex justify-center text-sm">
              <span className="px-2 bg-white text-gray-500">OR</span>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="manual-qr">Manual QR or Backup Code Entry</Label>
            <div className="flex gap-2">
              <Input
                id="manual-qr"
                placeholder="Enter 8-digit backup code"
                value={manualQRCode}
                onChange={(e) => setManualQRCode(e.target.value)}
                disabled={loading}
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleManualEntry();
                  }
                }}
              />
              <Button
                onClick={handleManualEntry}
                disabled={loading || !manualQRCode.trim()}
              >
                Submit
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {scanResult && (
        <Card className={scanResult.success ? 'border-green-500' : 'border-red-500'}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              {scanResult.success ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-green-500" />
                  Token Verified
                </>
              ) : (
                <>
                  <AlertCircle className="w-5 h-5 text-red-500" />
                  Verification Failed
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {!scanResult.success && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{scanResult.error}</AlertDescription>
              </Alert>
            )}

            {scanResult.token && (
              <div className="space-y-2">
                <h4 className="font-semibold">Token Details</h4>
                <div className="grid gap-2 text-sm">
                  <p>
                    <strong>Token ID:</strong> {scanResult.token.id}
                  </p>
                  <p>
                    <strong>Meal Type:</strong> {scanResult.token.mealType}
                  </p>
                  <div className="flex items-center gap-2">
                    <strong>Status:</strong>
                    <Badge variant={scanResult.success ? 'default' : 'destructive'}>
                      {scanResult.token.status}
                    </Badge>
                  </div>
                </div>
              </div>
            )}

            {scanResult.student && (
              <div className="space-y-2">
                <h4 className="font-semibold">Student Details</h4>
                <div className="space-y-1 text-sm">
                  <p>
                    <strong>Name:</strong> {scanResult.student.name}
                  </p>
                  <p>
                    <strong>Register Number:</strong> {scanResult.student.registerNumber}
                  </p>
                  <p>
                    <strong>Hostel:</strong> {scanResult.student.hostel || 'N/A'}
                  </p>
                  <p>
                    <strong>Room:</strong> {scanResult.student.room || 'N/A'}
                  </p>
                </div>
              </div>
            )}

            <Button
              variant="outline"
              className="w-full"
              onClick={() => {
                resetForNextScan()
              }}
            >
              Close
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
