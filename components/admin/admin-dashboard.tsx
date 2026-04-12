"use client"

import { useEffect, useMemo, useState } from "react"
import { UpcomingMenusAdmin } from "./upcoming-menus-admin"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  Users,
  Monitor,
  AlertTriangle,
  Coffee,
  Sun,
  Moon,
  TrendingUp,
  ArrowRight,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { getAuthHeaders } from "@/lib/client-auth"

type DashboardMeal = {
  id: string
  type: string
  bookedCount: number
  maxQuota: number
  isOpen: boolean
}

type DashboardCounter = {
  id: string
  name: string
  type: string
  isActive: boolean
  tokensServed: number
}

type DashboardLog = {
  id: string
  action: string
  details: string
  timestamp: string
}

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-5 w-5" />,
  Lunch: <Sun className="h-5 w-5" />,
  Dinner: <Moon className="h-5 w-5" />,
}

export function AdminDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [meals, setMeals] = useState<DashboardMeal[]>([])
  const [counters, setCounters] = useState<DashboardCounter[]>([])
  const [logs, setLogs] = useState<DashboardLog[]>([])

  useEffect(() => {
    const load = async () => {
      try {
        const [mealsRes, staffRes, logsRes] = await Promise.all([
          fetch('/api/meals?view=admin', { cache: 'no-store', headers: { ...getAuthHeaders() } }),
          fetch('/api/admin/staff', { cache: 'no-store', headers: { ...getAuthHeaders() } }),
          fetch('/api/admin/audit-logs', { cache: 'no-store', headers: { ...getAuthHeaders() } }),
        ])

        if (mealsRes.ok) {
          const mealsPayload = await mealsRes.json()
          const mappedMeals = (mealsPayload.data || []).map((m: any) => ({
            id: m.id,
            type: m.type,
            bookedCount: Number(m.booked_count || 0),
            maxQuota: Number(m.max_quota || 0),
            isOpen: Boolean(m.is_open),
          }))
          setMeals(mappedMeals)
        }

        if (staffRes.ok) {
          const staffPayload = await staffRes.json()
          const mappedCounters = (staffPayload.counters || []).map((c: any) => ({
            id: c.id,
            name: c.name,
            type: c.type,
            isActive: Boolean(c.isActive),
            tokensServed: Number(c.tokensServed || 0),
          }))
          setCounters(mappedCounters)
        }

        if (logsRes.ok) {
          const logsPayload = await logsRes.json()
          setLogs(Array.isArray(logsPayload.logs) ? logsPayload.logs : [])
        }
      } catch {
        setMeals([])
        setCounters([])
        setLogs([])
      }
    }

    load()
  }, [])

  const totalBooked = meals.reduce((sum, m) => sum + m.bookedCount, 0)
  const totalCapacity = meals.reduce((sum, m) => sum + m.maxQuota, 0)
  const totalServed = useMemo(() => logs.filter((l) => /SCANNED|QR_SCAN_SUCCESS/i.test(l.action)).length, [logs])
  const totalExpired = useMemo(() => logs.filter((l) => /EXPIRED/i.test(l.action)).length, [logs])
  const activeCounters = counters.filter(c => c.isActive).length
  const utilizationPercent = totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0
  const servedPercent = totalBooked > 0 ? Math.round((totalServed / totalBooked) * 100) : 0
  const expiredPercent = totalBooked > 0 ? Math.round((totalExpired / totalBooked) * 100) : 0

  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-gray-50 to-blue-50 dark:from-[#0F1115] dark:to-[#0F172A] p-4 lg:p-6">
      <div className="pointer-events-none absolute -top-24 -right-24 h-72 w-72 rounded-full bg-blue-400/20 dark:bg-blue-600/20 blur-3xl" />
      <div className="pointer-events-none absolute -bottom-20 -left-20 h-64 w-64 rounded-full bg-indigo-400/10 dark:bg-indigo-500/20 blur-3xl" />

      <div className="relative z-10 space-y-6 animate-fadeInUp">
      <div className="flex items-center justify-between border-b border-gray-200 dark:border-white/10 pb-4">
        <div>
          <h1 className="text-3xl font-semibold text-foreground">Admin Dashboard</h1>
          <p className="text-sm text-muted-foreground/80">
            {"Today's"} overview &middot; {new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" })}
          </p>
        </div>
      </div>

      {/* Upcoming Menus */}
      <UpcomingMenusAdmin onNavigate={onNavigate} />

      {/* Top Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        <Card className="rounded-xl border-border/60 bg-gradient-to-br from-white to-blue-50/70 dark:from-white/10 dark:to-transparent shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-card-foreground leading-none">{totalBooked}</p>
                <p className="text-xs text-muted-foreground">Total Booked</p>
                <p className="text-[11px] text-primary mt-1">{utilizationPercent}% of capacity</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-gradient-to-br from-white to-emerald-50/70 dark:from-white/10 dark:to-transparent shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-3xl font-bold text-card-foreground leading-none">{totalServed}</p>
                <p className="text-xs text-muted-foreground">Served</p>
                <p className="text-[11px] text-success mt-1">+{servedPercent}% conversion</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-gradient-to-br from-white to-amber-50/70 dark:from-white/10 dark:to-transparent shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-3xl font-bold text-card-foreground leading-none">{totalExpired}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
                <p className="text-[11px] text-warning mt-1">{expiredPercent}% drop-off</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-gradient-to-br from-white to-violet-50/70 dark:from-white/10 dark:to-transparent shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-accent/10 flex items-center justify-center">
                <Users className="h-5 w-5 text-accent" />
              </div>
              <div>
                <p className="text-3xl font-bold text-card-foreground leading-none">{totalCapacity}</p>
                <p className="text-xs text-muted-foreground">Total Capacity</p>
                <p className="text-[11px] text-accent mt-1">Across all meals</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="rounded-xl border-border/60 bg-gradient-to-br from-white to-cyan-50/70 dark:from-white/10 dark:to-transparent shadow-md hover:shadow-lg hover:-translate-y-1 transition-all duration-200 cursor-pointer">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Monitor className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-3xl font-bold text-card-foreground leading-none">{activeCounters}/{counters.length || 0}</p>
                <p className="text-xs text-muted-foreground">Active Counters</p>
                <p className="text-[11px] text-primary mt-1">Live serving points</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button
          variant="ghost"
          size="sm"
          className="px-4 py-2 rounded-lg bg-white/60 dark:bg-white/5 backdrop-blur-md shadow-md hover:shadow-lg transition-all duration-200"
          onClick={() => onNavigate("analytics")}
        >
          View Details
        </Button>
      </div>

      {/* Meal Status + Counters */}
      <div className="grid lg:grid-cols-2 gap-6">
        {/* Meals */}
        <Card className="rounded-xl border-border/60 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base text-card-foreground">Meal Status</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 gap-1 text-xs"
              onClick={() => onNavigate("meals")}
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-4">
            {meals.map(meal => {
              const percent = meal.maxQuota > 0 ? Math.round((meal.bookedCount / meal.maxQuota) * 100) : 0
              const isFull = meal.maxQuota > 0 && meal.bookedCount >= meal.maxQuota
              const status = isFull ? "Full" : meal.isOpen ? "Open" : "Closed"
              const statusClass = isFull
                ? "bg-destructive/15 text-destructive"
                : meal.isOpen
                ? "bg-success/15 text-success"
                : "bg-muted text-muted-foreground"
              const progressClass = isFull ? "bg-destructive" : meal.isOpen ? "bg-success" : "bg-muted-foreground/40"
              return (
                <div key={meal.id} className="flex items-center gap-4 p-2 rounded-xl hover:bg-muted/30 transition-colors">
                  <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center text-primary">
                    {mealIcons[meal.type]}
                  </div>
                  <div className="flex-1 space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="text-sm font-medium text-card-foreground">{meal.type}</span>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-muted-foreground">
                          {meal.bookedCount}/{meal.maxQuota}
                        </span>
                        <Badge variant="secondary" className={`text-xs border-0 ${statusClass}`}>
                          {status}
                        </Badge>
                      </div>
                    </div>
                    <div className="h-1.5 w-full rounded-full bg-muted/40 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all duration-300 ${progressClass}`}
                        style={{ width: `${Math.min(percent, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              )
            })}
          </CardContent>
        </Card>

        {/* Counters */}
        <Card className="rounded-xl border-border/60 shadow-md hover:shadow-lg transition-all duration-200">
          <CardHeader className="flex flex-row items-center justify-between pb-3">
            <CardTitle className="text-base text-card-foreground">Serving Counters</CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="px-4 py-2 rounded-lg border border-gray-300 dark:border-white/20 hover:bg-gray-100 dark:hover:bg-white/10 transition-all duration-200 gap-1 text-xs"
              onClick={() => onNavigate("counters")}
            >
              Manage <ArrowRight className="h-3 w-3" />
            </Button>
          </CardHeader>
          <CardContent className="space-y-3">
            {counters.map(counter => (
              <div key={counter.id} className="flex items-center justify-between p-3 rounded-xl bg-muted/50 border border-border/40 hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className={`h-3 w-3 rounded-full ${counter.isActive ? "bg-success" : "bg-muted-foreground/30"}`} />
                  <div>
                    <p className="text-sm font-medium text-foreground">{counter.name}</p>
                    <p className="text-xs text-muted-foreground">{counter.type}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-foreground">{counter.tokensServed}</p>
                  <p className="text-xs text-muted-foreground">served</p>
                </div>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity */}
      <Card className="rounded-xl border-border/60 shadow-md hover:shadow-lg transition-all duration-200">
        <CardHeader className="flex flex-row items-center justify-between pb-3">
          <CardTitle className="text-base text-card-foreground">Recent Activity</CardTitle>
          <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => onNavigate("logs")}>
            View All <ArrowRight className="h-3 w-3" />
          </Button>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {logs.slice(0, 5).map(log => (
              <div key={log.id} className="flex items-start gap-3 text-sm">
                <div className={`h-8 w-8 rounded-lg flex items-center justify-center flex-shrink-0 ${
                  log.action.includes("Override") || log.action.includes("Duplicate")
                    ? "bg-warning/10 text-warning"
                    : log.action.includes("Scanned") || log.action.includes("Generated")
                    ? "bg-success/10 text-success"
                    : "bg-primary/10 text-primary"
                }`}>
                  {log.action.includes("Override") ? <AlertTriangle className="h-4 w-4" /> :
                   log.action.includes("Duplicate") ? <XCircle className="h-4 w-4" /> :
                   log.action.includes("Scanned") ? <CheckCircle2 className="h-4 w-4" /> :
                   <TrendingUp className="h-4 w-4" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-foreground">{log.action}</p>
                  <p className="text-xs text-muted-foreground truncate">{log.details}</p>
                </div>
                <span className="text-xs text-muted-foreground whitespace-nowrap">
                  {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                </span>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
      </div>
    </div>
  )
}
