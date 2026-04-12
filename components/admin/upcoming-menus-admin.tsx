"use client"

import { mockUpcomingMeals, getMealCost } from "@/lib/mock-data"
import type { Meal } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coffee, Sun, Moon, CalendarDays, ChevronRight, AlertCircle } from "lucide-react"

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

function MealPreviewCard({ meal }: { meal: Meal }) {
  const totalCost = getMealCost(meal)
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

        {/* Quick Stats */}
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
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next10Days = new Date(today)
  next10Days.setDate(next10Days.getDate() + 10)
  const todayStr = today.toISOString().split('T')[0]
  const next10Str = next10Days.toISOString().split('T')[0]

  const filteredUpcomingMeals = mockUpcomingMeals.filter((meal) => meal.date >= todayStr && meal.date <= next10Str)

  const groupedMeals: Record<string, Meal[]> = {}
  filteredUpcomingMeals.slice(0, 9).forEach(meal => {
    if (!groupedMeals[meal.date]) {
      groupedMeals[meal.date] = []
    }
    groupedMeals[meal.date].push(meal)
  })

  const sortedDates = Object.keys(groupedMeals).sort().slice(0, 3)

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
          You can schedule meals up to <strong>10 days in advance</strong>. Currently managing {filteredUpcomingMeals.length} meals across next 10 days.
        </p>
      </div>

      {sortedDates.length > 0 ? (
        <div className="space-y-4">
          {sortedDates.map(dateStr => {
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
                  {groupedMeals[dateStr].map(meal => (
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
            <p className="text-sm text-muted-foreground">Create meals for the next 10 days</p>
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
