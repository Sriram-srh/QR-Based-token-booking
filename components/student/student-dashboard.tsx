"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getMealCost } from "@/lib/mock-data"
import type { Meal } from "@/lib/mock-data"
import { UpcomingBookings } from "./upcoming-bookings"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Progress } from "@/components/ui/progress"
import {
  Coffee,
  Sun,
  Moon,
  Ticket,
  CheckCircle2,
  Clock,
  XCircle,
  IndianRupee,
  AlertCircle,
  ArrowRight,
  User,
} from "lucide-react"
import { getAuthHeadersAsync, parseJsonSafe } from "@/lib/client-auth"

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-5 w-5" />,
  Lunch: <Sun className="h-5 w-5" />,
  Dinner: <Moon className="h-5 w-5" />,
}

const mealColors: Record<string, string> = {
  Breakfast: "from-[hsl(43,96%,56%)] to-[hsl(35,96%,50%)]",
  Lunch: "from-[hsl(217,91%,60%)] to-[hsl(230,91%,55%)]",
  Dinner: "from-[hsl(262,83%,58%)] to-[hsl(280,83%,50%)]",
}

export function StudentDashboard({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { student } = useAuth()
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [upcomingAvailableMeals, setUpcomingAvailableMeals] = useState<Meal[]>([])
  const [tokens, setTokens] = useState<any[]>([])
  const [usedCount, setUsedCount] = useState(0)
  const [expiredCount, setExpiredCount] = useState(0)

  const activeTokens = tokens.filter(t => t.status === "VALID")
  const activeCount = activeTokens.length
  const usedTokens = usedCount
  const billing = {
    totalAmount: Math.round(tokens.reduce((sum, t) => sum + Number(t.total_cost || 0), 0)),
    paymentStatus: "Not Paid",
  }

  const toLocalDateString = (input: Date): string => {
    const date = new Date(input)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const formatTimeHHMM = (value: string | null | undefined): string => {
    if (!value) return "00:00"
    const match = String(value).match(/(\d{2}:\d{2})/)
    return match ? match[1] : "00:00"
  }

  const normalizeMeal = (row: any): Meal => {
    const rawItems = Array.isArray(row?.menuItems) ? row.menuItems : []
    return {
      id: String(row?.id ?? ""),
      type: row?.type ?? "Breakfast",
      menuItems: rawItems.map((item: any, idx: number) => ({
        id: String(item?.id ?? `menu-${idx}`),
        name: String(item?.name ?? "Menu Item"),
        cost: Number(item?.cost ?? 0),
        maxQuantity: Number(item?.maxQuantity ?? item?.max_quantity ?? 1),
      })),
      date: String(row?.meal_date ?? toLocalDateString(new Date())),
      bookingStart: formatTimeHHMM(row?.booking_start),
      bookingEnd: formatTimeHHMM(row?.booking_end),
      maxQuota: Number(row?.max_quota ?? 0),
      bookedCount: Number(row?.booked_count ?? 0),
      isOpen: Boolean(row?.is_open),
    }
  }

  useEffect(() => {
    const fetchTokens = async () => {
      if (!student?.id) return
      try {
        const headers = await getAuthHeadersAsync()
        const response = await fetch(`/api/tokens?studentId=${student.id}`, {
          cache: 'no-store',
          headers,
        })
        if (!response.ok) {
          setTokens([])
          setUsedCount(0)
          setExpiredCount(0)
          return
        }
        const payload = await parseJsonSafe(response)
        const allTokens = Array.isArray(payload.tokens) ? payload.tokens : []
        setTokens(allTokens)
        setUsedCount(allTokens.filter((t: any) => t.status === 'USED').length)
        setExpiredCount(allTokens.filter((t: any) => t.status === 'EXPIRED').length)
      } catch {
        setTokens([])
        setUsedCount(0)
        setExpiredCount(0)
      }
    }

    const fetchMeals = async () => {
      try {
        const headers = await getAuthHeadersAsync()
        const response = await fetch('/api/meals?view=student', { cache: 'no-store', headers })
        const payload = await parseJsonSafe(response)
        if (!response.ok) return

        const rows = Array.isArray(payload?.data) ? payload.data : []
        const meals = rows.map((row: any) => normalizeMeal(row))
        const today = toLocalDateString(new Date())
        setTodayMeals(meals.filter((meal: Meal) => meal.date === today))
        setUpcomingAvailableMeals(
          meals
            .filter((meal: Meal) => meal.date > today && meal.isOpen)
            .sort((a: Meal, b: Meal) => a.date.localeCompare(b.date))
            .slice(0, 6)
        )
      } catch {
        setTodayMeals([])
        setUpcomingAvailableMeals([])
      }
    }

    fetchMeals()
    fetchTokens()
  }, [student?.id])

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center gap-4">
        <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center overflow-hidden border-2 border-primary/20">
          <User className="h-7 w-7 text-primary" />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-foreground">
            Welcome back, {student?.name?.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            {student?.hostel} &middot; Room {student?.room}
          </p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <Ticket className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{activeCount}</p>
                <p className="text-xs text-muted-foreground">Active Tokens</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-5 w-5 text-success" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{usedTokens}</p>
                <p className="text-xs text-muted-foreground">Meals Served</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <Clock className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{expiredCount}</p>
                <p className="text-xs text-muted-foreground">Expired</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <button onClick={() => onNavigate("billing")} className="text-left">
          <Card className={`border-2 cursor-pointer transition-shadow hover:shadow-md ${billing.paymentStatus === "Not Paid" ? "border-warning/40" : "border-success/40"}`}>
            <CardContent className="p-4">
              <div className="flex items-center gap-3">
                <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${billing.paymentStatus === "Not Paid" ? "bg-warning/10" : "bg-success/10"}`}>
                  <IndianRupee className={`h-5 w-5 ${billing.paymentStatus === "Not Paid" ? "text-warning" : "text-success"}`} />
                </div>
                <div>
                  <p className="text-2xl font-bold text-card-foreground font-mono">
                    {"Rs."}{billing.totalAmount.toLocaleString("en-IN")}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {billing.paymentStatus === "Not Paid" ? "Due Amount" : "Paid"}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </button>
      </div>

      {/* Upcoming Pre-bookings Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Upcoming Pre-bookings</h2>
          <Button variant="ghost" size="sm" className="gap-1 text-primary" onClick={() => onNavigate("upcoming")}>
            Open Upcoming Menus
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>
        <UpcomingBookings onNavigateToUpcoming={() => onNavigate("upcoming")} />
      </div>

      {/* Available Upcoming Meals Section */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-foreground">Available Upcoming Meals</h2>
          <Button variant="outline" size="sm" className="gap-1" onClick={() => onNavigate("upcoming")}>
            View All
            <ArrowRight className="h-3.5 w-3.5" />
          </Button>
        </div>

        {upcomingAvailableMeals.length === 0 ? (
          <Card className="border-border/60">
            <CardContent className="p-6 text-center">
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming meals available right now</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-3">
            {upcomingAvailableMeals.map((meal) => {
              const mealCost = getMealCost(meal)
              const remaining = meal.maxQuota - meal.bookedCount
              return (
                <Card key={`upcoming-${meal.id}`} className="border-border/60">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2">
                        <div className={`h-8 w-8 rounded-lg bg-gradient-to-br ${mealColors[meal.type]} flex items-center justify-center text-[hsl(0,0%,100%)]`}>
                          {mealIcons[meal.type]}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-foreground">{meal.type}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(meal.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })}
                          </p>
                        </div>
                      </div>
                      <Badge variant="outline" className="text-xs font-mono text-foreground">
                        Rs.{mealCost}
                      </Badge>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs text-muted-foreground">
                      <span>{meal.bookingStart} - {meal.bookingEnd}</span>
                      <span>{remaining} slots left</span>
                    </div>
                  </CardContent>
                </Card>
              )
            })}
          </div>
        )}
      </div>

      {/* Today's Meals */}
      <div>
        <h2 className="text-lg font-semibold mb-4 text-foreground">{"Today's Meals"}</h2>
        <div className="grid gap-4 md:grid-cols-3">
          {todayMeals.map(meal => {
            const percentBooked = Math.round((meal.bookedCount / meal.maxQuota) * 100)
            const remaining = meal.maxQuota - meal.bookedCount
            const mealCost = getMealCost(meal)
            const hasToken = tokens.some(
              t => t.meal_type === meal.type && (t.status === "VALID" || t.status === "USED")
            )

            return (
              <Card key={meal.id} className="overflow-hidden border-border/60 hover:shadow-lg transition-shadow">
                <div className={`h-2 bg-gradient-to-r ${mealColors[meal.type]}`} />
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${mealColors[meal.type]} flex items-center justify-center text-[hsl(0,0%,100%)]`}>
                        {mealIcons[meal.type]}
                      </div>
                      <div>
                        <CardTitle className="text-base text-card-foreground">{meal.type}</CardTitle>
                        <p className="text-xs text-muted-foreground font-mono">{"Rs."}{mealCost}/plate</p>
                      </div>
                    </div>
                    <Badge variant={meal.isOpen ? "default" : "secondary"} className={meal.isOpen ? "bg-success text-success-foreground" : ""}>
                      {meal.isOpen ? "Open" : "Closed"}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent className="space-y-3">
                  <p className="text-sm text-muted-foreground">{meal.menuItems.map(mi => mi.name).join(", ")}</p>
                  <div className="flex items-center justify-between text-xs text-muted-foreground">
                    <span>{meal.bookingStart} - {meal.bookingEnd}</span>
                    <span className="font-mono">{remaining} slots left</span>
                  </div>
                  <Progress value={percentBooked} className="h-2" />
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {meal.bookedCount}/{meal.maxQuota} booked
                    </span>
                    {hasToken ? (
                      <Badge variant="outline" className="text-success border-success/30 text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        Booked
                      </Badge>
                    ) : meal.isOpen ? (
                      <button
                        onClick={() => onNavigate("book")}
                        className="text-xs font-semibold text-primary hover:underline"
                      >
                        Book Now
                      </button>
                    ) : (
                      <Badge variant="outline" className="text-destructive border-destructive/30 text-xs">
                        <XCircle className="h-3 w-3 mr-1" />
                        Full
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            )
          })}
        </div>
      </div>
    </div>
  )
}
