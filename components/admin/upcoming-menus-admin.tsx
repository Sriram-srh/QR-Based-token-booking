"use client"

import { useEffect, useMemo, useState } from "react"
import { getAuthHeadersAsync, parseJsonSafe } from "@/lib/client-auth"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coffee, Sun, Moon, CalendarDays, ChevronRight, AlertCircle } from "lucide-react"

type UpcomingMeal = {
  id: string
  type: "Breakfast" | "Lunch" | "Dinner"
  date: string
  bookingStart: string
  bookingEnd: string
  maxQuota: number
  menuItems: Array<{ id: string; name: string; cost: number; maxQuantity: number }>
}

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-4 w-4" />,
  Lunch: <Sun className="h-4 w-4" />,
  Dinner: <Moon className="h-4 w-4" />,
}

const mealColors: Record<string, string> = {
  Breakfast: "from-[hsl(43,96%,56%)] to-[hsl(35,96%,50%)]",
  Lunch: "from-[hsl(217,91%,60%)] to-[hsl(230,91%,55%)]",
  Dinner: "from-[hsl(262,83%,58%)] to-[hsl(280,83%,50%)]",
}

function formatDateLocal(input: Date): string {
  const date = new Date(input)
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

function formatTimeHHMM(value: string | null | undefined): string {
  if (!value) return "00:00"
  const match = String(value).match(/(\d{2}:\d{2})/)
  return match ? match[1] : "00:00"
}

function MealPreviewCard({ meal }: { meal: UpcomingMeal }) {
  const totalCost = meal.menuItems.reduce((sum, item) => sum + Number(item.cost || 0), 0)
  const daysFromToday = Math.floor((new Date(meal.date).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))

  return (
    <Card className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
      <div className={`h-1.5 bg-gradient-to-r ${mealColors[meal.type]}`} />
      <CardContent className="p-3 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className={`h-7 w-7 rounded-lg bg-gradient-to-br ${mealColors[meal.type]} flex items-center justify-center text-white`}>
              {mealIcons[meal.type]}
            </div>
            <div>
              <p className="text-sm font-semibold text-foreground">{meal.type}</p>
              <p className="text-xs text-muted-foreground">
                {new Date(meal.date).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
              </p>
            </div>
          </div>
          <Badge variant="outline" className="text-xs">
            +{daysFromToday} days
          </Badge>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <div className="bg-muted/50 rounded p-2 text-xs">
            <p className="text-muted-foreground">Items</p>
            <p className="font-bold text-foreground">{meal.menuItems.length}</p>
          </div>
          <div className="bg-muted/50 rounded p-2 text-xs">
            <p className="text-muted-foreground">Max: {"Rs."}{totalCost}</p>
            <p className="font-mono text-primary font-bold">per plate</p>
          </div>
        </div>

        <div className="text-xs text-muted-foreground">
          <span className="font-mono">{meal.bookingStart} - {meal.bookingEnd}</span>
          <span className="text-foreground ml-2 font-semibold">Quota: {meal.maxQuota}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function UpcomingMenusAdmin({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const [upcomingMeals, setUpcomingMeals] = useState<UpcomingMeal[]>([])

  useEffect(() => {
    const loadUpcomingMeals = async () => {
      try {
        const headers = await getAuthHeadersAsync()
        const response = await fetch('/api/meals?view=admin', { cache: 'no-store', headers })
        const payload = await parseJsonSafe(response)

        if (!response.ok) {
          setUpcomingMeals([])
          return
        }

        const rows = Array.isArray(payload?.data) ? payload.data : []
        const today = formatDateLocal(new Date())
        const next10 = new Date()
        next10.setDate(next10.getDate() + 10)
        const maxDate = formatDateLocal(next10)

        const mappedRows: UpcomingMeal[] = rows
          .map((row: any) => ({
            id: String(row?.id || ""),
            type: (row?.type || "Breakfast") as UpcomingMeal["type"],
            date: String(row?.meal_date || today),
            bookingStart: formatTimeHHMM(row?.booking_start),
            bookingEnd: formatTimeHHMM(row?.booking_end),
            maxQuota: Number(row?.max_quota || 0),
            menuItems: Array.isArray(row?.menuItems)
              ? row.menuItems.map((item: any, idx: number) => ({
                  id: String(item?.id || `menu-${idx}`),
                  name: String(item?.name || "Menu Item"),
                  cost: Number(item?.cost || 0),
                  maxQuantity: Number(item?.maxQuantity || item?.max_quantity || 1),
                }))
              : [],
          }))

        const mapped = mappedRows.filter((meal: UpcomingMeal) => meal.date > today && meal.date <= maxDate)

        setUpcomingMeals(mapped)
      } catch {
        setUpcomingMeals([])
      }
    }

    loadUpcomingMeals()
  }, [])

  const groupedMeals = useMemo(() => {
    const grouped: Record<string, UpcomingMeal[]> = {}
    upcomingMeals.slice(0, 9).forEach((meal) => {
      if (!grouped[meal.date]) {
        grouped[meal.date] = []
      }
      grouped[meal.date].push(meal)
    })
    return grouped
  }, [upcomingMeals])

  const sortedDates = useMemo(() => Object.keys(groupedMeals).sort().slice(0, 3), [groupedMeals])

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <CalendarDays className="h-5 w-5 text-primary" />
          <h2 className="text-lg font-semibold text-foreground">Upcoming Menus (Next 10 Days)</h2>
        </div>
        <Button variant="outline" size="sm" className="gap-1 text-xs" onClick={() => onNavigate("meals")}>
          Manage All <ChevronRight className="h-3 w-3" />
        </Button>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          You can schedule meals up to <strong>10 days in advance</strong>. Currently managing {upcomingMeals.length} upcoming meals across next 10 days.
        </p>
      </div>

      {sortedDates.length > 0 ? (
        <div className="space-y-4">
          {sortedDates.map((dateStr) => {
            const date = new Date(dateStr)
            const dayName = date.toLocaleDateString("en-IN", { weekday: "long" })
            const dateDisplay = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

            return (
              <div key={dateStr}>
                <div className="mb-2 pb-2 border-b border-border/40">
                  <p className="text-sm font-semibold text-foreground">{dayName}</p>
                  <p className="text-xs text-muted-foreground">{dateDisplay}</p>
                </div>
                <div className="grid gap-3 md:grid-cols-3">
                  {groupedMeals[dateStr].map((meal) => (
                    <MealPreviewCard key={meal.id} meal={meal} />
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <Card className="border-border/60">
          <CardContent className="p-8 text-center">
            <CalendarDays className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
            <h3 className="font-semibold text-card-foreground mb-1">No Upcoming Menus Scheduled</h3>
            <p className="text-sm text-muted-foreground">No meals scheduled</p>
            <Button onClick={() => onNavigate("meals")} className="mt-4 gap-2">
              <CalendarDays className="h-4 w-4" />
              Create Menus
            </Button>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
