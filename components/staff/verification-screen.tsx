"use client"

import { useEffect, useMemo, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { QRScanner } from "@/components/qr/qr-scanner"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { getAuthHeadersAsync } from "@/lib/client-auth"
import {
  CheckCircle2,
  UtensilsCrossed,
  Clock,
} from "lucide-react"

type CounterOption = {
  id: string
  name: string
  type: string
  isActive: boolean
  assignedStaffId: string | null
}

export function VerificationScreen() {
  const { user } = useAuth()
  const currentStaffId = user?.staffId || null
  const [scanCount, setScanCount] = useState(0)
  const [counterOptions, setCounterOptions] = useState<CounterOption[]>([])
  const [selectedCounterId, setSelectedCounterId] = useState(user?.counterId || "")

  useEffect(() => {
    const loadCounters = async () => {
      try {
        const headers = await getAuthHeadersAsync()
        const response = await fetch('/api/counters', {
          cache: 'no-store',
          headers,
        })

        if (!response.ok) {
          setCounterOptions([])
          return
        }

        const data = await response.json()
        const counters: CounterOption[] = (data.counters || []).map((counter: any) => ({
          id: counter.id,
          name: counter.name,
          type: counter.type,
          isActive: Boolean(counter.isActive),
          assignedStaffId: counter.assignedStaffId || null,
        }))

        setCounterOptions(counters)
      } catch {
        setCounterOptions([])
      }
    }

    loadCounters()
  }, [])

  const countersWithAccess = useMemo(
    () => counterOptions.map((counter) => ({
      ...counter,
      isAssignedToCurrentStaff: Boolean(currentStaffId) && counter.assignedStaffId === currentStaffId,
      isUnassigned: !counter.assignedStaffId,
    })),
    [counterOptions, currentStaffId]
  )

  useEffect(() => {
    if (countersWithAccess.length === 0) {
      return
    }

    const selectedStillValid = countersWithAccess.some(
      (counter) => counter.id === selectedCounterId && counter.isAssignedToCurrentStaff
    )

    if (selectedStillValid) {
      return
    }

    const firstAssigned = countersWithAccess.find((counter) => counter.isAssignedToCurrentStaff)
    setSelectedCounterId(firstAssigned?.id || "")
  }, [countersWithAccess, selectedCounterId])

  const selectedCounterLabel = useMemo(() => {
    if (!selectedCounterId) {
      return 'No assigned counter'
    }

    const counter = countersWithAccess.find((item) => item.id === selectedCounterId)
    if (!counter) {
      return 'No assigned counter'
    }

    return `${counter.name} (${counter.type})`
  }, [countersWithAccess, selectedCounterId])

  const selectedCounter = useMemo(() => {
    if (!selectedCounterId) {
      return null
    }

    return countersWithAccess.find((item) => item.id === selectedCounterId) || null
  }, [countersWithAccess, selectedCounterId])

  const handleScanSuccess = () => {
    setScanCount(prev => prev + 1)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">QR Verification</h1>
          <p className="text-muted-foreground">Scan or paste token QR to verify against database</p>
        </div>
        <Badge variant="outline" className="text-lg px-4 py-2 font-mono text-foreground">
          <UtensilsCrossed className="h-4 w-4 mr-2" />
          Counter Verification
        </Badge>
      </div>

      {/* Stats Bar */}
      <div className="flex gap-4">
        <Card className="flex-1 border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
              <CheckCircle2 className="h-5 w-5 text-success" />
            </div>
            <div>
              <p className="text-2xl font-bold text-card-foreground">{scanCount}</p>
              <p className="text-xs text-muted-foreground">Served Today</p>
            </div>
          </CardContent>
        </Card>
        <Card className="flex-1 border-border/60">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
              <Clock className="h-5 w-5 text-primary" />
            </div>
            <div>
              <p className="text-sm font-bold text-card-foreground">
                {selectedCounter ? `${selectedCounter.name} (${selectedCounter.id.slice(0, 8)})` : selectedCounterLabel}
              </p>
              <p className="text-xs text-muted-foreground">Serving Counter</p>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card className="border-border/60">
        <CardContent className="p-4 space-y-2">
          <Label className="text-sm text-foreground">Serving Counter</Label>
          <Select value={selectedCounterId} onValueChange={setSelectedCounterId}>
            <SelectTrigger className="bg-background text-foreground">
              <SelectValue placeholder="Select Counter" />
            </SelectTrigger>
            <SelectContent>
              {countersWithAccess.map((counter) => (
                <SelectItem
                  key={counter.id}
                  value={counter.id}
                  disabled={!counter.isAssignedToCurrentStaff}
                >
                  {counter.name} ({counter.type})
                  {!counter.isAssignedToCurrentStaff
                    ? counter.isUnassigned
                      ? ' - Inactive (Not Assigned)'
                      : ' - Inactive (Assigned to other staff)'
                    : ''}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {selectedCounter && (
            <p className="text-sm text-muted-foreground mt-1">
              Counter ID: {selectedCounter.id}
            </p>
          )}
        </CardContent>
      </Card>

      <QRScanner
        counterId={selectedCounterId}
        staffId={currentStaffId || undefined}
        onScanSuccess={handleScanSuccess}
      />
    </div>
  )
}
