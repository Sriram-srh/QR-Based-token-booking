'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import jsQR from 'jsqr';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Switch } from '@/components/ui/switch';
import { getAuthHeadersAsync, parseJsonSafe } from '@/lib/client-auth';
import { toast } from 'sonner';
import { AlertCircle, CheckCircle2, Flashlight, ScanLine, XCircle } from 'lucide-react';

interface QRScannerProps {
  counterId: string;
  staffId?: string;
  onScanSuccess?: (result: any) => void;
}

interface ScanResult {
  success: boolean;
  reason?: string;
  token?: {
    id: string;
    studentId: string;
    mealType: string;
    status: string;
    expiresAt?: string;
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

type ResultState = 'valid' | 'used' | 'invalid';

export function QRScanner({ counterId, staffId, onScanSuccess }: QRScannerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const videoTrackRef = useRef<MediaStreamTrack | null>(null);
  const scanLoopActiveRef = useRef(false);
  const scanLockRef = useRef(false);
  const lastScannedCodeRef = useRef<string | null>(null);
  const [scanning, setScanning] = useState(false);
  const [lastScannedCode, setLastScannedCode] = useState<string | null>(null);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [manualQRCode, setManualQRCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [isSecureContextReady, setIsSecureContextReady] = useState(true);
  const [scannedAt, setScannedAt] = useState<string | null>(null);
  const [torchSupported, setTorchSupported] = useState(false);
  const [torchOn, setTorchOn] = useState(false);
  const [autoScanNext, setAutoScanNext] = useState(true);

  const stopScanner = () => {
    scanLoopActiveRef.current = false;
    setTorchOn(false);
    setTorchSupported(false);

    if (videoRef.current && videoRef.current.srcObject) {
      const tracks = (videoRef.current.srcObject as MediaStream).getTracks();
      tracks.forEach((track) => track.stop());
      videoRef.current.srcObject = null;
    }

    videoTrackRef.current = null;

    setScanning(false);
  };

  const resetForNextScan = () => {
    scanLockRef.current = false;
    lastScannedCodeRef.current = null;
    setLastScannedCode(null);
    setScanResult(null);
    setScannedAt(null);
  };

  const triggerFeedback = (state: ResultState) => {
    if (typeof window === 'undefined') {
      return;
    }

    const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;

    if (AudioCtx) {
      try {
        const ctx = new AudioCtx();
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        const tone = state === 'valid' ? 980 : state === 'used' ? 620 : 420;
        osc.frequency.value = tone;
        osc.type = 'sine';

        gain.gain.setValueAtTime(0.0001, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.08, ctx.currentTime + 0.02);
        gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.16);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start();
        osc.stop(ctx.currentTime + 0.16);
      } catch {
        // No-op: audio feedback is optional and should never block scanning UX.
      }
    }

    const vibrateMs = state === 'valid' ? 120 : 220;
    navigator.vibrate?.(vibrateMs);
  };

  const resultState = useMemo<ResultState | null>(() => {
    if (!scanResult) {
      return null;
    }

    if (scanResult.success) {
      return 'valid';
    }

    if (scanResult.reason === 'ALREADY_USED' || scanResult.token?.status === 'USED') {
      return 'used';
    }

    return 'invalid';
  }, [scanResult]);

  const tokenExpiryInfo = useMemo(() => {
    const expiresAtRaw = scanResult?.token?.expiresAt;
    if (!expiresAtRaw) {
      return null;
    }

    const expiresAt = new Date(expiresAtRaw);
    if (!Number.isFinite(expiresAt.getTime())) {
      return null;
    }

    const remainingMs = expiresAt.getTime() - Date.now();
    const minutes = Math.max(0, Math.ceil(remainingMs / 60000));

    return {
      expiresAt,
      minutes,
      expired: remainingMs <= 0,
    };
  }, [scanResult]);

  useEffect(() => {
    if (!autoScanNext || !scanResult) {
      return;
    }

    const timeout = window.setTimeout(() => {
      resetForNextScan();
      setScanning(true);
    }, 2500);

    return () => window.clearTimeout(timeout);
  }, [autoScanNext, scanResult]);

  const handleTorchToggle = async () => {
    const track = videoTrackRef.current as any;

    if (!track || !torchSupported) {
      return;
    }

    const nextTorchState = !torchOn;

    try {
      await track.applyConstraints({
        advanced: [{ torch: nextTorchState }],
      });
      setTorchOn(nextTorchState);
    } catch {
      toast.error('Torch control is not available on this device.');
    }
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

        const [videoTrack] = stream.getVideoTracks();
        videoTrackRef.current = videoTrack || null;

        if (videoTrack && typeof (videoTrack as any).getCapabilities === 'function') {
          const capabilities = (videoTrack as any).getCapabilities();
          setTorchSupported(Boolean(capabilities?.torch));
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
        setScannedAt(new Date().toISOString());
        triggerFeedback('valid');
        toast.success(`Meal verified for ${data.student?.name}`);
        onScanSuccess?.(data);
      } else {
        setScanResult(data);
        setScannedAt(new Date().toISOString());
        const state = data?.reason === 'ALREADY_USED' || data?.status === 'USED' ? 'used' : 'invalid';
        triggerFeedback(state);
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
          <div className="relative w-full max-w-md mx-auto">
            <div className="relative w-full h-[260px] bg-black rounded-xl overflow-hidden border border-border/50">
              {scanning ? (
                <video
                  ref={videoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="h-full w-full flex flex-col items-center justify-center text-white/80 gap-2">
                  <ScanLine className="h-8 w-8" />
                  <p className="text-sm">Scanner is ready</p>
                </div>
              )}
              <canvas ref={canvasRef} className="hidden" />

              {scanning && (
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                  <div className="w-64 h-64 border-[3px] border-white rounded-xl relative shadow-[0_0_0_9999px_rgba(0,0,0,0.26)]">
                    <div className="absolute left-0 w-full h-1 bg-success animate-scan-line" />
                  </div>
                </div>
              )}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-3">
            {!scanning ? (
              <Button onClick={() => setScanning(true)} className="w-full" disabled={loading}>
                Start Scan
              </Button>
            ) : (
              <Button onClick={stopScanner} variant="outline" className="w-full" disabled={loading}>
                Stop
              </Button>
            )}

            <Button
              onClick={() => {
                resetForNextScan();
                setScanning(true);
              }}
              variant={scanResult ? 'default' : 'secondary'}
              className="w-full"
              disabled={loading}
            >
              Scan Next
            </Button>
          </div>

          <div className="grid grid-cols-2 gap-3 items-center">
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={handleTorchToggle}
              disabled={!scanning || !torchSupported}
            >
              <Flashlight className="h-4 w-4 mr-2" />
              {torchOn ? 'Torch Off' : 'Torch On'}
            </Button>
            <div className="flex items-center justify-end gap-2">
              <Label htmlFor="auto-scan-next" className="text-sm text-muted-foreground">Auto next</Label>
              <Switch
                id="auto-scan-next"
                checked={autoScanNext}
                onCheckedChange={setAutoScanNext}
              />
            </div>
          </div>

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
        <Card
          className={
            resultState === 'valid'
              ? 'border-success/70 bg-success/5'
              : resultState === 'used'
                ? 'border-warning/70 bg-warning/10'
                : 'border-destructive/70 bg-destructive/5'
          }
        >
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-lg">
              {resultState === 'valid' ? (
                <>
                  <CheckCircle2 className="w-5 h-5 text-success" />
                  Token Verified
                </>
              ) : resultState === 'used' ? (
                <>
                  <AlertCircle className="w-5 h-5 text-warning" />
                  Already Used
                </>
              ) : (
                <>
                  <XCircle className="w-5 h-5 text-destructive" />
                  Invalid Token
                </>
              )}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="text-center">
              <p
                className={
                  resultState === 'valid'
                    ? 'text-3xl font-extrabold text-success'
                    : resultState === 'used'
                      ? 'text-3xl font-extrabold text-warning'
                      : 'text-3xl font-extrabold text-destructive'
                }
              >
                {resultState === 'valid' ? 'VALID' : resultState === 'used' ? 'USED' : 'INVALID'}
              </p>
            </div>

            {!scanResult.success && resultState === 'invalid' && (
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
                  <p className="text-muted-foreground">{scanResult.student.name} • {scanResult.student.registerNumber}</p>
                  <p>
                    <strong>Hostel:</strong> {scanResult.student.hostel || 'N/A'}
                  </p>
                  <p>
                    <strong>Room:</strong> {scanResult.student.room || 'N/A'}
                  </p>
                </div>
              </div>
            )}

            {scannedAt && (
              <div className="text-xs text-muted-foreground space-y-1">
                <p>Scanned at {new Date(scannedAt).toLocaleTimeString()}</p>
                {tokenExpiryInfo && (
                  <p>
                    Expires {tokenExpiryInfo.expired ? 'now' : `in ${tokenExpiryInfo.minutes} min`} ({tokenExpiryInfo.expiresAt.toLocaleTimeString()})
                  </p>
                )}
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
