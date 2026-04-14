"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/lib/auth-context"
import { clearAuthSession, getAuthHeadersAsync, isAuthFailureStatus, parseJsonSafe } from "@/lib/client-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  QrCode,
  Clock,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Coffee,
  Sun,
  Moon,
  X,
  User,
  Hash,
  Ticket,
} from "lucide-react"

type TokenStatus = "VALID" | "USED" | "EXPIRED" | "CANCELLED" | "UPCOMING"

type TokenItem = {
  id: string
  mealType: string
  status: TokenStatus
  totalCost: number
  createdAt: Date
  expiresAt: Date
  qrCode: string
  backupCode?: string
  bookedItems: Array<{ name: string; quantity: number; cost: number }>
  counter?: string
}

const statusConfig: Record<TokenStatus, { label: string; color: string; icon: React.ReactNode }> = {
  VALID: {
    label: "VALID",
    color: "bg-success text-success-foreground",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  USED: {
    label: "USED",
    color: "bg-primary text-primary-foreground",
    icon: <CheckCircle2 className="h-4 w-4" />,
  },
  EXPIRED: {
    label: "EXPIRED",
    color: "bg-muted text-muted-foreground",
    icon: <Clock className="h-4 w-4" />,
  },
  CANCELLED: {
    label: "CANCELLED",
    color: "bg-destructive text-destructive-foreground",
    icon: <XCircle className="h-4 w-4" />,
  },
  UPCOMING: {
    label: "UPCOMING",
    color: "bg-warning text-warning-foreground",
    icon: <Clock className="h-4 w-4" />,
  },
}

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-5 w-5" />,
  Lunch: <Sun className="h-5 w-5" />,
  Dinner: <Moon className="h-5 w-5" />,
}

function CountdownTimer({ expiresAt }: { expiresAt: Date }) {
  const [timeLeft, setTimeLeft] = useState("")

  useEffect(() => {
    const update = () => {
      const now = new Date()
      const diff = expiresAt.getTime() - now.getTime()
      if (diff <= 0) {
        setTimeLeft("Expired")
        return
      }
      const h = Math.floor(diff / 3600000)
      const m = Math.floor((diff % 3600000) / 60000)
      const s = Math.floor((diff % 60000) / 1000)
      setTimeLeft(`${h.toString().padStart(2, "0")}:${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`)
    }
    update()
    const interval = setInterval(update, 1000)
    return () => clearInterval(interval)
  }, [expiresAt])

  return (
    <span className="font-mono text-sm tabular-nums text-foreground">{timeLeft}</span>
  )
}

// Simple SVG QR code generator (deterministic pattern from token ID)
function QRCodeDisplay({
  tokenId,
  hideQR,
  watermarkText,
}: {
  tokenId: string
  hideQR?: boolean
  watermarkText?: string
}) {
  const size = 180
  const moduleCount = 21
  const moduleSize = size / moduleCount

  const seed = tokenId.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0)
  const modules: boolean[][] = []

  for (let r = 0; r < moduleCount; r++) {
    modules[r] = []
    for (let c = 0; c < moduleCount; c++) {
      const inTopLeft = r < 7 && c < 7
      const inTopRight = r < 7 && c >= moduleCount - 7
      const inBottomLeft = r >= moduleCount - 7 && c < 7
      if (inTopLeft || inTopRight || inBottomLeft) {
        const inOuter = r === 0 || c === 0 || r === 6 || c === 6 ||
          (inTopRight && (c === moduleCount - 7 || c === moduleCount - 1)) ||
          (inBottomLeft && (r === moduleCount - 7 || r === moduleCount - 1))
        const inInner = (
          (inTopLeft && r >= 2 && r <= 4 && c >= 2 && c <= 4) ||
          (inTopRight && r >= 2 && r <= 4 && c >= moduleCount - 5 && c <= moduleCount - 3) ||
          (inBottomLeft && r >= moduleCount - 5 && r <= moduleCount - 3 && c >= 2 && c <= 4)
        )
        modules[r][c] = inOuter || inInner
      } else {
        modules[r][c] = ((seed * (r + 1) * (c + 1) + r * 7 + c * 13) % 3) === 0
      }
    }
  }

  if (hideQR) {
    return (
      <div className="mx-auto w-[180px] h-[180px] rounded-lg border border-destructive/30 bg-destructive/5 flex items-center justify-center p-3 text-center">
        <p className="text-sm text-destructive font-medium">QR hidden for security</p>
      </div>
    )
  }

  return (
    <div className="relative w-fit mx-auto select-none" aria-label="secured-qr-code">
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="mx-auto">
        <rect width={size} height={size} fill="white" rx="8" />
        {modules.map((row, r) =>
          row.map((filled, c) =>
            filled ? (
              <rect
                key={`${r}-${c}`}
                x={c * moduleSize}
                y={r * moduleSize}
                width={moduleSize}
                height={moduleSize}
                fill="#1a1a2e"
                rx={1}
              />
            ) : null
          )
        )}
      </svg>
      {watermarkText && (
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <span className="text-[10px] font-semibold text-foreground/20 rotate-[-20deg] tracking-wide">
            {watermarkText}
          </span>
        </div>
      )}
    </div>
  )
}

export function MyTokens() {
  const { student, user } = useAuth()
  const [activeTokens, setActiveTokens] = useState<TokenItem[]>([])
  const [upcomingTokens, setUpcomingTokens] = useState<TokenItem[]>([])
  const [usedTokens, setUsedTokens] = useState<TokenItem[]>([])
  const [loading, setLoading] = useState(true)
  const [actionLoading, setActionLoading] = useState(false)
  const [cancelToken, setCancelToken] = useState<string | null>(null)
  const [expandedToken, setExpandedToken] = useState<string | null>(null)
  const [hideSensitiveQr, setHideSensitiveQr] = useState(false)
  const [copiedBackupCode, setCopiedBackupCode] = useState<string | null>(null)

  useEffect(() => {
    const handleVisibility = () => {
      setHideSensitiveQr(document.hidden)
    }

    document.addEventListener('visibilitychange', handleVisibility)
    handleVisibility()
    return () => {
      document.removeEventListener('visibilitychange', handleVisibility)
    }
  }, [])

  const handleCopyBackupCode = async (code: string) => {
    try {
      await navigator.clipboard.writeText(code)
      setCopiedBackupCode(code)
      window.setTimeout(() => setCopiedBackupCode((current) => (current === code ? null : current)), 2000)
    } catch (err) {
      console.error('[v0] Backup code copy failed:', err)
    }
  }

  const loadTokens = async () => {
    if (!user?.studentId) {
      setLoading(false)
      return
    }

    // Check if auth token exists
    const token = typeof window !== 'undefined'
      ? (window.localStorage.getItem('auth_token') || window.localStorage.getItem('token'))
      : null
    if (!token) {
      console.error('[v0] No authentication token found. User may need to login again.')
      setActiveTokens([])
      setUpcomingTokens([])
      setUsedTokens([])
      setLoading(false)
      return
    }

    try {
      setLoading(true)
      const headers = await getAuthHeadersAsync()
      const response = await fetch(`/api/tokens?studentId=${user.studentId}`, { 
        cache: 'no-store',
        headers,
      })
      const data = await parseJsonSafe(response)

      if (!response.ok) {
        if (isAuthFailureStatus(response.status)) {
          clearAuthSession()
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
          return
        }

        throw new Error(data.error || 'Failed to fetch tokens')
      }

      const mapToken = (token: any): TokenItem => ({
        id: token.id,
        mealType: token.meal_type,
        status: token.status as TokenStatus,
        totalCost: Number(token.total_cost || 0),
        createdAt: new Date(token.created_at || Date.now()),
        expiresAt: new Date(token.expires_at || `${token.meal_date || new Date().toISOString()}T23:59:59.999Z`),
        qrCode: token.qr_code,
        backupCode: token.backupCode || token.backup_code || undefined,
        bookedItems: [],
        counter: token.counter_id || undefined,
      })

      const mappedActive: TokenItem[] = (data.active || []).map(mapToken)
      const mappedUpcoming: TokenItem[] = (data.upcoming || []).map(mapToken)
      const mappedUsed: TokenItem[] = (data.used || []).map(mapToken)

      setActiveTokens(mappedActive)
      setUpcomingTokens(mappedUpcoming)
      setUsedTokens(mappedUsed)
    } catch (error) {
      console.error('[v0] Failed to fetch tokens:', error)
      setActiveTokens([])
      setUpcomingTokens([])
      setUsedTokens([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (user?.studentId) {
      loadTokens()
    }
  }, [user?.studentId])

  const allTokens = [...activeTokens, ...upcomingTokens, ...usedTokens]

  const handleCancelToken = async () => {
    if (!cancelToken || !user?.studentId) return

    try {
      setActionLoading(true)
      const headers = await getAuthHeadersAsync()
      const response = await fetch('/api/tokens', { 
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({ tokenId: cancelToken, studentId: user.studentId }),
      })

      const data = await parseJsonSafe(response)
      if (!response.ok) {
        if (isAuthFailureStatus(response.status)) {
          clearAuthSession()
          if (typeof window !== 'undefined') {
            window.location.reload()
          }
          return
        }

        throw new Error(data.error || 'Failed to cancel token')
      }

      setCancelToken(null)
      await loadTokens()
    } catch (error) {
      console.error('[v0] Failed to cancel token:', error)
    } finally {
      setActionLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">My Tokens</h1>
        <p className="text-muted-foreground">View and manage your meal QR tokens with booked items</p>
      </div>

      <Tabs defaultValue="active" className="space-y-4">
        <TabsList>
          <TabsTrigger value="active" className="gap-2">
            <QrCode className="h-4 w-4" />
            Active ({activeTokens.length})
          </TabsTrigger>
          <TabsTrigger value="upcoming" className="gap-2">
            <Clock className="h-4 w-4" />
            Upcoming ({upcomingTokens.length})
          </TabsTrigger>
          <TabsTrigger value="history" className="gap-2">
            <Clock className="h-4 w-4" />
            Used/Expired ({usedTokens.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="active" className="space-y-4">
          {loading && (
            <Card className="border-border/60">
              <CardContent className="p-6 text-center text-sm text-muted-foreground">Loading tokens...</CardContent>
            </Card>
          )}
          {activeTokens.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-8 text-center">
                <QrCode className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="font-semibold text-card-foreground mb-1">No Active Tokens</h3>
                <p className="text-sm text-muted-foreground">Book a meal token to get started</p>
              </CardContent>
            </Card>
          ) : (
            activeTokens.map(token => (
              <Card key={token.id} className="border-border/60 overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center text-success">
                        {mealIcons[token.mealType]}
                      </div>
                      <div>
                        <CardTitle className="text-base text-card-foreground">{token.mealType} Token</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono">{token.id}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="outline" className="text-xs text-foreground gap-1">
                        <Ticket className="h-3 w-3" />
                        Items: {token.bookedItems.length}
                      </Badge>
                      <Badge className={statusConfig[token.status].color}>
                        {statusConfig[token.status].icon}
                        <span className="ml-1">{statusConfig[token.status].label}</span>
                      </Badge>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {/* Booking info */}
                  <div className="flex items-center gap-2 text-xs text-muted-foreground bg-muted/50 rounded-lg p-2.5">
                    <Clock className="h-3.5 w-3.5 flex-shrink-0" />
                    <span>Booked at {token.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} on {token.createdAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}</span>
                  </div>

                  {/* Booked Items List */}
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2">
                    <p className="text-xs font-medium text-muted-foreground mb-2">BOOKED ITEMS:</p>
                    <div className="space-y-1.5">
                      {token.bookedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-sm p-2 bg-background rounded border border-border/40">
                          <div className="flex-1">
                            <span className="text-foreground font-medium">{item.name}</span>
                            <span className="text-xs text-muted-foreground ml-2">Qty: {item.quantity}</span>
                          </div>
                          <span className="font-mono text-primary font-semibold">Rs.{item.cost * item.quantity}</span>
                        </div>
                      ))}
                    </div>
                    <div className="flex items-center justify-between pt-2 border-t border-border/40 text-sm font-bold">
                      <span className="text-foreground">Total</span>
                      <span className="font-mono text-primary">Rs.{token.totalCost}</span>
                    </div>
                  </div>

                  {/* QR Code with Student Profile */}
                  <div
                    className="bg-card border border-border rounded-xl p-6 cursor-pointer hover:shadow-md transition-shadow"
                    onClick={() => setExpandedToken(token.id)}
                    role="button"
                    tabIndex={0}
                    aria-label="Expand QR code"
                    onKeyDown={(e) => { if (e.key === 'Enter') setExpandedToken(token.id) }}
                  >
                    {/* Student mini-profile above QR */}
                    <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                      <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center overflow-hidden">
                        <User className="h-5 w-5 text-primary" />
                      </div>
                      <div className="flex-1">
                        <p className="text-sm font-semibold text-foreground">{student?.name}</p>
                        <p className="text-xs text-muted-foreground font-mono">{student?.registerNumber}</p>
                      </div>
                      <Badge variant="outline" className="text-xs gap-1 text-foreground">
                        Rs.{token.totalCost}
                      </Badge>
                    </div>

                    <QRCodeDisplay
                      tokenId={token.id}
                      hideQR={hideSensitiveQr}
                      watermarkText={user?.email || student?.registerNumber || token.id.slice(0, 8)}
                    />
                    {token.backupCode && (
                      <div className="mt-3 text-center space-y-1.5" onClick={(e) => e.stopPropagation()}>
                        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Backup Code</p>
                        <div className="flex items-center justify-center gap-2">
                          <span
                            className="font-mono text-sm font-semibold text-foreground select-none"
                            onCopy={(e) => e.preventDefault()}
                          >
                            {token.backupCode}
                          </span>
                          <Button
                            type="button"
                            size="sm"
                            variant="outline"
                            className="h-7 px-2 text-xs"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleCopyBackupCode(token.backupCode as string)
                            }}
                          >
                            {copiedBackupCode === token.backupCode ? 'Copied' : 'Copy'}
                          </Button>
                        </div>
                      </div>
                    )}
                    <p className="text-xs text-center text-muted-foreground mt-3">
                      Tap to enlarge - Show this at the serving counter
                    </p>
                  </div>

                  {/* Timer & Actions */}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4 text-warning" />
                      <span className="text-sm text-muted-foreground">Expires in:</span>
                      <CountdownTimer expiresAt={token.expiresAt} />
                    </div>
                    {new Date() < token.expiresAt ? (
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-destructive border-destructive/30 hover:bg-destructive/10"
                      onClick={() => setCancelToken(token.id)}
                    >
                      <X className="h-3 w-3 mr-1" />
                      Cancel
                    </Button>
                    ) : (
                      <Badge variant="outline" className="text-xs text-muted-foreground">Expired</Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="upcoming" className="space-y-3">
          {upcomingTokens.length === 0 ? (
            <Card className="border-border/60">
              <CardContent className="p-8 text-center">
                <Clock className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
                <h3 className="font-semibold text-card-foreground mb-1">No Upcoming Pre-bookings</h3>
                <p className="text-sm text-muted-foreground">Future meal bookings will appear here</p>
              </CardContent>
            </Card>
          ) : (
            upcomingTokens.map(token => (
              <Card key={token.id} className="border-border/60">
                <CardContent className="p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="h-9 w-9 rounded-lg bg-warning/10 flex items-center justify-center text-warning">
                        {mealIcons[token.mealType]}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-card-foreground">{token.mealType}</p>
                        <p className="text-xs text-muted-foreground">
                          Meal Date: {token.expiresAt.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                        </p>
                        <p className="text-xs text-muted-foreground">QR will be generated on meal day</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <Badge className={statusConfig.UPCOMING.color}>
                        {statusConfig.UPCOMING.icon}
                        <span className="ml-1">{statusConfig.UPCOMING.label}</span>
                      </Badge>
                      <p className="text-xs text-muted-foreground font-mono mt-1">Rs.{token.totalCost}</p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="history" className="space-y-3">
          {usedTokens.map(token => (
            <Card key={token.id} className="border-border/60">
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="h-9 w-9 rounded-lg bg-muted flex items-center justify-center text-muted-foreground">
                      {mealIcons[token.mealType]}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-card-foreground">{token.mealType}</p>
                      <p className="text-xs text-muted-foreground font-mono">{token.id}</p>
                      <p className="text-xs text-muted-foreground">
                        Booked: {token.createdAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} &middot; Items: {token.bookedItems.length} &middot; Total: Rs.{token.totalCost}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <Badge variant="outline" className="text-xs mb-1">
                      {statusConfig[token.status].icon}
                      <span className="ml-1">{token.status}</span>
                    </Badge>
                    <p className="text-xs text-muted-foreground">
                      {token.createdAt.toLocaleDateString()}
                    </p>
                    {token.backupCode && (
                      <div className="flex items-center justify-end gap-2">
                        <span
                          className="text-xs font-mono text-muted-foreground select-none"
                          onCopy={(e) => e.preventDefault()}
                        >
                          Backup: {token.backupCode}
                        </span>
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-6 px-2 text-[10px]"
                          onClick={() => handleCopyBackupCode(token.backupCode as string)}
                        >
                          {copiedBackupCode === token.backupCode ? 'Copied' : 'Copy'}
                        </Button>
                      </div>
                    )}
                    {token.status === "USED" && token.counter && (
                      <p className="text-xs text-success">{token.counter}</p>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </TabsContent>
      </Tabs>

      {/* Cancel Dialog */}
      <Dialog open={cancelToken !== null} onOpenChange={() => setCancelToken(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Cancel Token
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to cancel this token? This action cannot be undone.
              No charges will be applied for cancelled tokens.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setCancelToken(null)}>
              Keep Token
            </Button>
            <Button variant="destructive" onClick={handleCancelToken} disabled={actionLoading}>
              Cancel Token
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Expanded QR Dialog */}
      <Dialog open={expandedToken !== null} onOpenChange={() => setExpandedToken(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-center text-foreground">Scan This QR Code</DialogTitle>
            <DialogDescription className="text-center">
              Show this to the serving staff at the counter
            </DialogDescription>
          </DialogHeader>
          {expandedToken && (
            <div className="p-4">
              {/* Student profile in expanded view */}
              <div className="flex items-center gap-3 mb-4 p-3 bg-muted/50 rounded-lg">
                <div className="h-10 w-10 rounded-lg bg-primary/10 flex items-center justify-center">
                  <User className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold text-foreground">{student?.name}</p>
                  <p className="text-xs text-muted-foreground font-mono">{student?.registerNumber}</p>
                </div>
              </div>

              <QRCodeDisplay
                tokenId={expandedToken}
                hideQR={hideSensitiveQr}
                watermarkText={user?.email || student?.registerNumber || expandedToken.slice(0, 8)}
              />
              {(() => {
                const token = allTokens.find(t => t.id === expandedToken)
                return token?.backupCode ? (
                  <div className="mt-3 text-center space-y-1.5">
                    <p className="text-[11px] text-muted-foreground uppercase tracking-wide">Backup Code</p>
                    <div className="flex items-center justify-center gap-2">
                      <span
                        className="font-mono text-sm font-semibold text-foreground select-none"
                        onCopy={(e) => e.preventDefault()}
                      >
                        {token.backupCode}
                      </span>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        className="h-7 px-2 text-xs"
                        onClick={() => handleCopyBackupCode(token.backupCode as string)}
                      >
                        {copiedBackupCode === token.backupCode ? 'Copied' : 'Copy'}
                      </Button>
                    </div>
                  </div>
                ) : null
              })()}

              {(() => {
                const token = allTokens.find(t => t.id === expandedToken)
                return token ? (
                  <div className="text-center mt-4 space-y-2">
                    {/* Booked items summary */}
                    <div className="bg-muted/50 rounded-lg p-3 space-y-1.5">
                      <p className="text-xs font-semibold text-muted-foreground mb-2">ITEMS IN THIS TOKEN:</p>
                      {token.bookedItems.map((item, idx) => (
                        <div key={idx} className="flex items-center justify-between text-xs">
                          <span className="text-foreground">{item.name} × {item.quantity}</span>
                          <span className="font-mono text-primary font-semibold">Rs.{item.cost * item.quantity}</span>
                        </div>
                      ))}
                      <div className="flex items-center justify-between text-xs font-bold pt-2 border-t border-border/40">
                        <span className="text-foreground">Total</span>
                        <span className="font-mono text-primary">Rs.{token.totalCost}</span>
                      </div>
                    </div>
                  </div>
                ) : null
              })()}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
