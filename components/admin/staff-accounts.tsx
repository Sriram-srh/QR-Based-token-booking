"use client"

import { useEffect, useState } from "react"
import type { StaffMember, Counter } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
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
  Users,
  Plus,
  Monitor,
  Hash,
  CheckCircle2,
  UserCog,
  ArrowRight,
} from "lucide-react"
import { clearAuthSession, getAuthHeaders, isAuthFailureStatus, parseJsonSafe } from "@/lib/client-auth"

export function StaffAccounts() {
  const [staff, setStaff] = useState<StaffMember[]>([])
  const [counters, setCounters] = useState<Counter[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [assigning, setAssigning] = useState<string | null>(null)
  const [createOpen, setCreateOpen] = useState(false)
  const [created, setCreated] = useState(false)
  const [newStaff, setNewStaff] = useState({ name: "", email: "", employeeNumber: "" })

  const loadStaff = async () => {
    try {
      setLoading(true)
      const headers = { ...getAuthHeaders() }
      if (!headers.Authorization) {
        setStaff([])
        setCounters([])
        return
      }

      const response = await fetch('/api/admin/staff', {
        cache: 'no-store',
        headers,
      })

      if (!response.ok) {
        const errorBody = await parseJsonSafe(response)
        if (isAuthFailureStatus(response.status)) {
          clearAuthSession()
          window.location.reload()
          return
        }

        console.error('[v0] Failed to load staff accounts:', {
          status: response.status,
          error: errorBody?.error || 'Unknown error',
          details: errorBody,
        })
        setStaff([])
        setCounters([])
        return
      }

      const data = await parseJsonSafe(response)
      const mappedStaff: StaffMember[] = (data.staff || []).map((member: any) => ({
        id: member.id,
        name: member.name,
        employeeNumber: member.employeeNumber,
        assignedCounter: member.assignedCounter || null,
      }))

      const mappedCounters: Counter[] = (data.counters || []).map((counter: any) => ({
        id: counter.id,
        name: counter.name,
        type: counter.type,
        isActive: Boolean(counter.isActive),
        tokensServed: Number(counter.tokensServed || 0),
        assignedStaff: null,
      }))

      setStaff(mappedStaff)
      setCounters(mappedCounters)
    } catch (error) {
      console.error('[v0] Failed to load staff accounts:', JSON.stringify(error, Object.getOwnPropertyNames(error || {}), 2))
      setStaff([])
      setCounters([])
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    loadStaff()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      setCreating(true)
      const response = await fetch('/api/admin/staff', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({
          name: newStaff.name,
          email: newStaff.email,
          employeeNumber: newStaff.employeeNumber,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to create staff account'}`)
        return
      }

      await loadStaff()
      setCreated(true)
      setTimeout(() => {
        setCreateOpen(false)
        setCreated(false)
        setNewStaff({ name: "", email: "", employeeNumber: "" })
      }, 1500)
    } catch (error) {
      console.error('[v0] Staff create failed:', error)
      alert('Failed to create staff account')
    } finally {
      setCreating(false)
    }
  }

  const assignCounter = async (staffId: string, counterId: string | null) => {
    try {
      setAssigning(staffId)
      const response = await fetch('/api/admin/staff', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ staffId, counterId }),
      })

      const data = await response.json()
      if (!response.ok) {
        alert(`Error: ${data.error || 'Failed to assign counter'}`)
        return
      }

      await loadStaff()
    } catch (error) {
      console.error('[v0] Counter assignment failed:', error)
      alert('Failed to assign counter')
    } finally {
      setAssigning(null)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Serving Staff</h1>
          <p className="text-muted-foreground">Manage staff accounts and counter assignments</p>
        </div>
        <Button className="gap-2" onClick={() => setCreateOpen(true)}>
          <Plus className="h-4 w-4" />
          Add Staff
        </Button>
      </div>

      {/* Staff Cards */}
      {loading && (
        <Card className="border-border/60">
          <CardContent className="p-6 text-sm text-muted-foreground">Loading staff accounts...</CardContent>
        </Card>
      )}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {staff.map(member => {
          const counter = counters.find(c => c.id === member.assignedCounter)
          return (
            <Card key={member.id} className="border-border/60">
              <CardContent className="p-5 space-y-4">
                <div className="flex items-center gap-3">
                  <div className="h-12 w-12 rounded-xl bg-accent/10 flex items-center justify-center">
                    <UserCog className="h-6 w-6 text-accent" />
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-card-foreground">{member.name}</h3>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <Hash className="h-3 w-3" />
                      {member.employeeNumber}
                    </div>
                  </div>
                </div>

                {/* Counter Assignment */}
                <div className="space-y-2">
                  <Label className="text-xs text-muted-foreground">Assigned Counter</Label>
                  <Select
                    value={member.assignedCounter || "none"}
                    onValueChange={val => assignCounter(member.id, val === "none" ? null : val)}
                    disabled={assigning === member.id}
                  >
                    <SelectTrigger className="bg-background text-foreground">
                      <SelectValue placeholder="Select counter" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="none">Unassigned</SelectItem>
                      {counters.map(c => (
                        <SelectItem key={c.id} value={c.id}>
                          {c.name} ({c.type})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Badge variant={counter ? "default" : "secondary"} className={`w-full justify-center text-xs ${counter ? "bg-success text-success-foreground" : ""}`}>
                  {counter ? (
                    <>
                      <Monitor className="h-3 w-3 mr-1" />
                      {counter.name} - {counter.type}
                    </>
                  ) : (
                    "Not Assigned"
                  )}
                </Badge>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Create Staff Dialog */}
      <Dialog open={createOpen} onOpenChange={() => { setCreateOpen(false); setCreated(false) }}>
        <DialogContent className="sm:max-w-md">
          {!created ? (
            <form onSubmit={handleCreate}>
              <DialogHeader>
                <DialogTitle className="text-foreground">Create Staff Account</DialogTitle>
                <DialogDescription>
                  Enter staff details. They will use their employee number to log in.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="staffName" className="text-foreground">Full Name</Label>
                  <Input
                    id="staffName"
                    placeholder="e.g. Ravi Shankar"
                    value={newStaff.name}
                    onChange={e => setNewStaff({ ...newStaff, name: e.target.value })}
                    className="bg-background text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="staffEmail" className="text-foreground">Email</Label>
                  <Input
                    id="staffEmail"
                    type="email"
                    placeholder="staff@college.edu"
                    value={newStaff.email}
                    onChange={e => setNewStaff({ ...newStaff, email: e.target.value })}
                    className="bg-background text-foreground"
                    required
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="empNo" className="text-foreground">Employee Number</Label>
                  <Input
                    id="empNo"
                    placeholder="e.g. EMP004"
                    value={newStaff.employeeNumber}
                    onChange={e => setNewStaff({ ...newStaff, employeeNumber: e.target.value })}
                    className="bg-background text-foreground"
                    required
                  />
                </div>
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button type="button" variant="outline" onClick={() => setCreateOpen(false)}>Cancel</Button>
                <Button type="submit" className="gap-2" disabled={creating}>
                  <Plus className="h-4 w-4" />
                  {creating ? 'Creating...' : 'Create Account'}
                </Button>
              </DialogFooter>
            </form>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">Staff Account Created!</h3>
                <p className="text-sm text-muted-foreground">Staff can now log in with their employee number.</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
