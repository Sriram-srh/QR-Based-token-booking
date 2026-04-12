"use client"

import { useEffect, useState } from "react"
import type { Counter } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Monitor,
  Plus,
  CheckCircle2,
  AlertTriangle,
  ShieldAlert,
  Trash2,
} from "lucide-react"
import { getAuthHeaders } from "@/lib/client-auth"

type StaffOption = {
  id: string
  name: string
  employeeNumber: string
  assignedCounter: string | null
}

export function CounterManagement() {
  const [counters, setCounters] = useState<Counter[]>([])
  const [staffOptions, setStaffOptions] = useState<StaffOption[]>([])
  const [busyCounterId, setBusyCounterId] = useState<string | null>(null)
  const [addingCounter, setAddingCounter] = useState(false)
  const [overrideOpen, setOverrideOpen] = useState(false)
  const [overrideReason, setOverrideReason] = useState("")
  const [overrideStudentId, setOverrideStudentId] = useState("")
  const [addCounterOpen, setAddCounterOpen] = useState(false)
  const [newCounterName, setNewCounterName] = useState("")
  const [newCounterType, setNewCounterType] = useState("Veg")
  const [newCounterStaff, setNewCounterStaff] = useState("none")

  const fetchCounters = async () => {
    const response = await fetch('/api/counters', {
      cache: 'no-store',
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      setCounters([])
      return
    }

    const data = await response.json()
    const nextCounters: Counter[] = (data.counters || []).map((counter: any) => ({
      id: counter.id,
      name: counter.name,
      type: counter.type,
      isActive: Boolean(counter.isActive),
      tokensServed: Number(counter.tokensServed || 0),
      assignedStaff: counter.assignedStaffId || null,
    }))

    setCounters(nextCounters)
  }

  const fetchStaff = async () => {
    const response = await fetch('/api/admin/staff', {
      cache: 'no-store',
      headers: {
        ...getAuthHeaders(),
      },
    })

    if (!response.ok) {
      setStaffOptions([])
      return
    }

    const data = await response.json()
    const nextStaff: StaffOption[] = (data.staff || []).map((member: any) => ({
      id: member.id,
      name: member.name,
      employeeNumber: member.employeeNumber,
      assignedCounter: member.assignedCounter || null,
    }))

    setStaffOptions(nextStaff)
  }

  const loadData = async () => {
    try {
      await Promise.all([fetchCounters(), fetchStaff()])
    } catch {
      setCounters([])
      setStaffOptions([])
    }
  }

  useEffect(() => {
    loadData()
  }, [])

  const toggleCounter = async (id: string) => {
    const counter = counters.find((item) => item.id === id)
    if (!counter) return

    try {
      setBusyCounterId(id)
      const response = await fetch('/api/counters', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ id, isActive: !counter.isActive }),
      })

      if (!response.ok) {
        return
      }

      await fetchCounters()
    } finally {
      setBusyCounterId(null)
    }
  }

  const handleAddCounter = async () => {
    if (!newCounterName.trim()) return

    try {
      setAddingCounter(true)
      const response = await fetch('/api/counters', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          name: newCounterName.trim(),
          type: newCounterType,
          assignedStaffId: newCounterStaff === 'none' ? null : newCounterStaff,
        }),
      })

      if (!response.ok) {
        return
      }

      await loadData()
      setNewCounterName("")
      setNewCounterType("Veg")
      setNewCounterStaff("none")
      setAddCounterOpen(false)
    } finally {
      setAddingCounter(false)
    }
  }

  const handleDeleteCounter = async (id: string) => {
    try {
      setBusyCounterId(id)
      const response = await fetch(`/api/counters?id=${id}`, {
        method: 'DELETE',
        headers: {
          ...getAuthHeaders(),
        },
      })

      if (!response.ok) {
        return
      }

      await loadData()
    } finally {
      setBusyCounterId(null)
    }
  }

  const handleOverride = () => {
    // Placeholder: would log to audit trail
    setOverrideOpen(false)
    setOverrideReason("")
    setOverrideStudentId("")
  }

  const availableStaff = staffOptions.filter((s) => !s.assignedCounter || s.id === newCounterStaff)

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Counter Management</h1>
          <p className="text-muted-foreground">Add, manage counters and handle emergency overrides</p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="chrome" className="gap-2 px-5 py-2" onClick={() => setAddCounterOpen(true)}>
            <Plus className="h-4 w-4" />
            Add Counter
          </Button>
          <Button variant="destructive" className="gap-2" onClick={() => setOverrideOpen(true)}>
            <ShieldAlert className="h-4 w-4" />
            Emergency Override
          </Button>
        </div>
      </div>

      {/* Counters Info */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-primary">{counters.length}</p>
            <p className="text-sm text-muted-foreground">Total Counters</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-success">{counters.filter(c => c.isActive).length}</p>
            <p className="text-sm text-muted-foreground">Active Counters</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-primary">{counters.reduce((sum, c) => sum + c.tokensServed, 0)}</p>
            <p className="text-sm text-muted-foreground">Total Tokens Served</p>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <p className="text-3xl font-bold text-warning">{counters.filter(c => !c.isActive).length}</p>
            <p className="text-sm text-muted-foreground">Offline Counters</p>
          </CardContent>
        </Card>
      </div>

      {/* Counters Grid */}
      <div className="grid gap-4 md:grid-cols-3">
        {counters.map(counter => (
          <Card key={counter.id} className={`border-border/60 overflow-hidden ${counter.isActive ? "" : "opacity-60"}`}>
            <div className={`h-1.5 ${counter.isActive ? "bg-success" : "bg-muted"}`} />
            <CardContent className="p-5 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className={`h-12 w-12 rounded-xl flex items-center justify-center ${counter.isActive ? "bg-success/10" : "bg-muted"}`}>
                    <Monitor className={`h-6 w-6 ${counter.isActive ? "text-success" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold text-card-foreground">{counter.name}</h3>
                    <p className="text-sm text-muted-foreground">{counter.type}</p>
                    <p className="text-xs text-muted-foreground">ID: {counter.id.slice(0, 8)}</p>
                  </div>
                </div>
                <Switch
                  checked={counter.isActive}
                  onCheckedChange={() => toggleCounter(counter.id)}
                  disabled={busyCounterId === counter.id}
                  aria-label={`Toggle ${counter.name}`}
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-2xl font-bold text-card-foreground">{counter.tokensServed}</p>
                  <p className="text-xs text-muted-foreground">Tokens Served</p>
                </div>
                <div className="p-3 rounded-lg bg-muted/50 text-center">
                  <p className="text-sm font-bold text-card-foreground">
                    {staffOptions.find((staff) => staff.id === counter.assignedStaff)?.name || "Unassigned"}
                  </p>
                  <p className="text-xs text-muted-foreground">Staff</p>
                </div>
              </div>

              <Badge variant={counter.isActive ? "default" : "secondary"} className={`w-full justify-center ${counter.isActive ? "bg-success text-success-foreground" : ""}`}>
                <div className={`h-2 w-2 rounded-full mr-2 ${counter.isActive ? "bg-success-foreground animate-pulse" : "bg-muted-foreground"}`} />
                {counter.isActive ? "Online - Serving" : "Offline"}
              </Badge>

              <Button
                variant="outline"
                size="sm"
                className="w-full text-destructive border-destructive/30 hover:bg-destructive/10"
                onClick={() => handleDeleteCounter(counter.id)}
                disabled={busyCounterId === counter.id}
              >
                <Trash2 className="h-3 w-3 mr-1" />
                Delete Counter
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Add Counter Dialog */}
      <Dialog open={addCounterOpen} onOpenChange={setAddCounterOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <Plus className="h-5 w-5 text-primary" />
              Add New Counter
            </DialogTitle>
            <DialogDescription>
              Create a new serving counter and optionally assign serving staff
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="counterName" className="text-foreground">Counter Name</Label>
              <Input
                id="counterName"
                placeholder="e.g., Counter 4, Veg Counter 2"
                value={newCounterName}
                onChange={e => setNewCounterName(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="counterType" className="text-foreground">Counter Type</Label>
              <Select value={newCounterType} onValueChange={setNewCounterType}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Veg">Vegetarian</SelectItem>
                  <SelectItem value="Non-Veg">Non-Vegetarian</SelectItem>
                  <SelectItem value="Special">Special/Beverages</SelectItem>
                  <SelectItem value="General">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="staffAssign" className="text-foreground">Assign Staff (Optional)</Label>
              <Select value={newCounterStaff} onValueChange={setNewCounterStaff}>
                <SelectTrigger className="bg-background text-foreground">
                  <SelectValue placeholder="No staff assigned" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">No staff assigned</SelectItem>
                  {availableStaff.map(staff => (
                    <SelectItem key={staff.id} value={staff.id}>
                      {staff.name} ({staff.employeeNumber})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <Card className="bg-primary/5 border-primary/20">
              <CardContent className="p-3 flex items-start gap-2">
                <CheckCircle2 className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  The counter will be activated immediately and ready to serve. You can toggle it offline anytime.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setAddCounterOpen(false)}>Cancel</Button>
            <Button
              variant="chrome"
              onClick={handleAddCounter}
              disabled={!newCounterName.trim() || addingCounter}
              className="gap-2 px-5 py-2"
            >
              <Plus className="h-4 w-4" />
              {addingCounter ? "Adding..." : "Add Counter"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Emergency Override Dialog */}
      <Dialog open={overrideOpen} onOpenChange={setOverrideOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-foreground">
              <AlertTriangle className="h-5 w-5 text-warning" />
              Emergency Manual Override
            </DialogTitle>
            <DialogDescription>
              Use this only when the QR scanner fails. This action will be logged in the audit trail.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="studentId" className="text-foreground">Student Register Number</Label>
              <Input
                id="studentId"
                placeholder="e.g. 21BCE1234"
                value={overrideStudentId}
                onChange={e => setOverrideStudentId(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="reason" className="text-foreground">
                Override Reason <span className="text-destructive">*</span>
              </Label>
              <Textarea
                id="reason"
                placeholder="e.g. QR scanner malfunction, student has valid token on phone..."
                value={overrideReason}
                onChange={e => setOverrideReason(e.target.value)}
                className="bg-background text-foreground"
              />
            </div>
            <Card className="bg-warning/10 border-warning/20">
              <CardContent className="p-3 flex items-start gap-2">
                <AlertTriangle className="h-4 w-4 text-warning flex-shrink-0 mt-0.5" />
                <p className="text-xs text-muted-foreground">
                  This override will be permanently logged with your admin ID, timestamp, and the reason provided. Misuse may result in disciplinary action.
                </p>
              </CardContent>
            </Card>
          </div>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={() => setOverrideOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={handleOverride}
              disabled={!overrideReason.trim() || !overrideStudentId.trim()}
              className="gap-2"
            >
              <ShieldAlert className="h-4 w-4" />
              Approve Override
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
