"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Coffee, Sun, Moon, Trash2, AlertCircle } from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeaders, parseJsonSafe } from "@/lib/client-auth"

type PreBooking = {
  id: string
  mealType: 'Breakfast' | 'Lunch' | 'Dinner'
  mealDate: string
  status: 'PENDING' | 'ACTIVE' | 'SERVED' | 'CANCELLED'
  totalCost: number
  bookedItems: Array<{ name: string; cost: number; quantity: number }>
}

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-4 w-4" />,
  Lunch: <Sun className="h-4 w-4" />,
  Dinner: <Moon className="h-4 w-4" />,
}

const statusConfig: Record<string, { label: string; color: string }> = {
  PENDING: { label: "Pending", color: "bg-warning/10 text-warning border-warning/20" },
  ACTIVE: { label: "Active", color: "bg-success/10 text-success border-success/20" },
  SERVED: { label: "Served", color: "bg-primary/10 text-primary border-primary/20" },
  CANCELLED: { label: "Cancelled", color: "bg-destructive/10 text-destructive border-destructive/20" },
}

export function UpcomingBookings({ onNavigateToUpcoming }: { onNavigateToUpcoming?: () => void }) {
  const { student } = useAuth()
  const [pendingBookings, setPendingBookings] = useState<PreBooking[]>([])

  useEffect(() => {
    const load = async () => {
      if (!student?.id) return
      try {
        const response = await fetch(`/api/pre-bookings?studentId=${student.id}`, {
          cache: 'no-store',
          headers: {
            ...getAuthHeaders(),
          },
        })
        if (!response.ok) {
          setPendingBookings([])
          return
        }

        const data = await parseJsonSafe(response)
        const rows = Array.isArray(data.preBookings) ? data.preBookings : []
        const mapped = rows.map((pb: any) => ({
          id: pb.id,
          mealType: pb.meal_type,
          mealDate: pb.meal_date,
          status: pb.status,
          totalCost: Number(pb.total_cost || 0),
          bookedItems: [],
        }))
        setPendingBookings(mapped)
      } catch {
        setPendingBookings([])
      }
    }

    load()
  }, [student?.id])

  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const next10Days = new Date(today)
  next10Days.setDate(next10Days.getDate() + 10)
  const todayStr = today.toISOString().split('T')[0]
  const next10Str = next10Days.toISOString().split('T')[0]

  const filteredBookings = pendingBookings.filter(pb =>
    (pb.status === "PENDING" || pb.status === "ACTIVE") &&
    pb.mealDate >= todayStr &&
    pb.mealDate <= next10Str
  )

  if (filteredBookings.length === 0) {
    return (
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base text-card-foreground">Upcoming Bookings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-center p-6 text-center">
            <div>
              <AlertCircle className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No upcoming pre-bookings yet</p>
              <p className="text-xs text-muted-foreground mt-1">Pre-book meals from the upcoming menus</p>
              {onNavigateToUpcoming && (
                <Button
                  variant="link"
                  className="mt-2 h-auto p-0 text-primary"
                  onClick={onNavigateToUpcoming}
                >
                  Book your meal now -&gt;
                </Button>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <Card className="border-border/60">
      <CardHeader>
        <CardTitle className="text-base text-card-foreground">Upcoming Pre-bookings ({filteredBookings.length})</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {filteredBookings.map(booking => {
          const bookingDate = new Date(booking.mealDate)
          const dateDisplay = bookingDate.toLocaleDateString("en-IN", { day: "numeric", month: "short", weekday: "short" })

          return (
            <div key={booking.id} className="p-3 rounded-lg border border-border/60 bg-muted/30 hover:bg-muted/50 transition-colors">
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 space-y-2">
                  <div className="flex items-center gap-2">
                    <div className="h-7 w-7 rounded-lg bg-primary/10 flex items-center justify-center text-primary text-sm">
                      {mealIcons[booking.mealType]}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-foreground">{booking.mealType}</p>
                      <p className="text-xs text-muted-foreground">{dateDisplay}</p>
                    </div>
                  </div>

                  {/* Booked Items */}
                  <div className="ml-9 space-y-1">
                    {booking.bookedItems.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">{item.name} × {item.quantity}</span>
                        <span className="font-mono text-foreground">{"Rs."}{item.cost * item.quantity}</span>
                      </div>
                    ))}
                    {booking.bookedItems.length === 0 && (
                      <div className="text-xs text-muted-foreground">Items are linked to token details after generation.</div>
                    )}
                  </div>
                </div>

                <div className="flex flex-col items-end gap-2 text-right">
                  <div className="flex items-center gap-2">
                    <Badge variant="outline" className={`text-xs ${statusConfig[booking.status].color}`}>
                      {statusConfig[booking.status].label}
                    </Badge>
                  </div>
                  <div className="text-sm font-bold text-primary font-mono">{"Rs."}{booking.totalCost}</div>
                  {booking.status === "PENDING" && (
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-6 w-6 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              </div>
            </div>
          )
        })}
      </CardContent>
    </Card>
  )
}
