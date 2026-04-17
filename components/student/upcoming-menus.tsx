"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { getMealCost } from "@/lib/mock-data"
import type { Meal, MenuItem, PreBooking } from "@/lib/mock-data"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeadersAsync, parseJsonSafe } from "@/lib/client-auth"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Coffee, Sun, Moon, Plus, Minus, Check, AlertCircle, IndianRupee } from "lucide-react"
import { toast } from "sonner"

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

interface SelectedItem extends MenuItem {
  selectedQuantity: number
}

export function UpcomingMenus() {
  const { user } = useAuth()
  const router = useRouter()
  const [selectedMeal, setSelectedMeal] = useState<Meal | null>(null)
  const [preBookingOpen, setPreBookingOpen] = useState(false)
  const [selectedItems, setSelectedItems] = useState<SelectedItem[]>([])
  const [preBookings, setPreBookings] = useState<PreBooking[]>([])
  const [upcomingMeals, setUpcomingMeals] = useState<Meal[]>([])
  const [loadingMeals, setLoadingMeals] = useState(true)
  const [submitting, setSubmitting] = useState(false)

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

  const studentId = user?.studentId

  // ✅ FIX 2: Fetch meals from API with auto-refresh
  const fetchMeals = async () => {
    try {
      const headers = await getAuthHeadersAsync()
      const response = await fetch('/api/meals?view=student', { cache: 'no-store', headers })
      const data = await parseJsonSafe(response)

      if (!response.ok) {
        console.error('[upcoming-menus] Fetch meals failed:', data)
        return
      }

      const rows = Array.isArray(data?.data) ? data.data : []
      const mappedMeals = rows.map((row: any) => normalizeMeal(row))
      const today = toLocalDateString(new Date())
      setUpcomingMeals(mappedMeals.filter((meal: Meal) => meal.date > today))
    } catch (error) {
      console.error('[upcoming-menus] Failed to load meals:', error)
    } finally {
      setLoadingMeals(false)
    }
  }

  useEffect(() => {
    fetchMeals()
    // ✅ Optional: Auto-refresh every 30 seconds to catch admin edits
    const interval = setInterval(fetchMeals, 30000)
    return () => clearInterval(interval)
  }, [])

  const fetchPreBookings = async () => {
    if (!studentId) return

    try {
      const headers = await getAuthHeadersAsync()
      const response = await fetch(`/api/pre-bookings?studentId=${studentId}`, {
        cache: 'no-store',
        headers,
      })
      const data = await parseJsonSafe(response)

      if (!response.ok) {
        console.error('[v0] Fetch failed:', data)
        return
      }

      const sourceRows = data.data || data.preBookings || []
      const mapped: PreBooking[] = sourceRows.map((row: any) => ({
        id: row.id,
        studentId: row.student_id,
        mealDate: row.meal_date,
        mealType: row.meal_type,
        bookedItems: [],
        totalCost: Number(row.total_cost || 0),
        status: row.status,
        createdAt: new Date(row.created_at),
        qrTokenId: row.qr_token_id || undefined,
      }))

      setPreBookings(mapped)
    } catch (error) {
      console.error('[v0] Failed to load pre-bookings:', error)
    }
  }

  useEffect(() => {
    fetchPreBookings()
  }, [studentId])

  const groupedMeals: Record<string, Meal[]> = {}
  upcomingMeals.forEach(meal => {
    if (!groupedMeals[meal.date]) {
      groupedMeals[meal.date] = []
    }
    groupedMeals[meal.date].push(meal)
  })

  const sortedDates = Object.keys(groupedMeals).sort()

  const openPreBooking = (meal: Meal) => {
    setSelectedMeal(meal)
    setSelectedItems([])
    setPreBookingOpen(true)
  }

  const updateItemQuantity = (itemId: string, quantity: number) => {
    const item = selectedMeal?.menuItems.find((mi) => mi.id === itemId)
    const maxQty = Number(item?.maxQuantity || 1)
    const clampedQty = Math.max(0, Math.min(Number(quantity || 0), maxQty))

    if (quantity === 0) {
      setSelectedItems(prev => prev.filter(i => i.id !== itemId))
    } else {
      setSelectedItems(prev => {
        const existing = prev.find(i => i.id === itemId)
        if (existing) {
          return prev.map(i => i.id === itemId ? { ...i, selectedQuantity: clampedQty } : i)
        } else {
          if (item) {
            return [...prev, { ...item, selectedQuantity: clampedQty }]
          }
          return prev
        }
      })
    }
  }

  const calculateTotal = () => {
    return selectedItems.reduce((sum, item) => sum + (item.cost * item.selectedQuantity), 0)
  }

  const confirmPreBooking = async () => {
    if (!selectedMeal || selectedItems.length === 0 || !studentId) return

    console.log('CONFIRM CLICKED')
    setSubmitting(true)
    try {
      const headers = await getAuthHeadersAsync()
      const payloadItems = selectedItems.map(item => ({
        itemId: item.id,
        name: item.name,
        cost: item.cost,
        quantity: item.selectedQuantity,
      }))

      const response = await fetch('/api/pre-bookings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          studentId,
          mealDate: selectedMeal.date,
          mealType: selectedMeal.type,
          totalCost: calculateTotal(),
          items: payloadItems,
        }),
      })

      const data = await parseJsonSafe(response)
      if (!response.ok) {
        console.error('[v0] Create pre-booking failed:', data)
        toast.error(data.error || 'Failed to create pre-booking')
        return
      }

      toast.success('Meal booked successfully')
      setPreBookingOpen(false)
      setSelectedMeal(null)
      setSelectedItems([])
      await fetchPreBookings()
      router.refresh()
    } catch (error) {
      console.error('[v0] Failed to create pre-booking:', error)
      toast.error(error instanceof Error ? error.message : 'Failed to create pre-booking')
    } finally {
      setSubmitting(false)
    }
  }

  const hasPreBooked = (meal: Meal) => {
    return preBookings.some(pb => pb.mealDate === meal.date && pb.mealType === meal.type && pb.status !== 'CANCELLED')
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Upcoming Menus</h1>
        <p className="text-muted-foreground">View meals for the next 10 days and pre-book your meals</p>
      </div>

      <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
        <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
        <p className="text-xs text-muted-foreground">
          Pre-book meals up to 10 days in advance. QR tokens will be generated on the actual meal day.
        </p>
      </div>

      <div className="space-y-6">
        {sortedDates.map(dateStr => {
          const date = new Date(dateStr)
          const dayName = date.toLocaleDateString("en-IN", { weekday: "long" })
          const dateDisplay = date.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })

          return (
            <div key={dateStr} className="space-y-3">
              <div className="flex items-center justify-between border-b border-border pb-2">
                <div>
                  <h2 className="text-lg font-semibold text-foreground">{dayName}</h2>
                  <p className="text-xs text-muted-foreground">{dateDisplay}</p>
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                {groupedMeals[dateStr].map(meal => {
                  const isPreBooked = hasPreBooked(meal)
                  const totalCost = getMealCost(meal)

                  return (
                    <Card key={meal.id} className="overflow-hidden border-border/60 hover:shadow-md transition-shadow">
                      <div className={`h-2 bg-gradient-to-r ${mealColors[meal.type]}`} />
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <div className={`h-9 w-9 rounded-lg bg-gradient-to-br ${mealColors[meal.type]} flex items-center justify-center text-white`}>
                              {mealIcons[meal.type]}
                            </div>
                            <div>
                              <CardTitle className="text-base text-card-foreground">{meal.type}</CardTitle>
                              <p className="text-xs text-muted-foreground font-mono">{"Rs."}{totalCost}/plate</p>
                            </div>
                          </div>
                          {isPreBooked && (
                            <Badge className="bg-success text-success-foreground gap-1 text-xs">
                              <Check className="h-3 w-3" />
                              Pre-booked
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm text-muted-foreground line-clamp-2">{meal.menuItems.map(mi => mi.name).join(", ")}</p>

                        <div className="space-y-1.5 text-xs">
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Booking Window:</span>
                            <span className="font-mono text-foreground">{meal.bookingStart} - {meal.bookingEnd}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-muted-foreground">Quota:</span>
                            <span className="font-mono text-foreground">{meal.bookedCount} / {meal.maxQuota}</span>
                          </div>
                        </div>

                        <Button
                          onClick={() => openPreBooking(meal)}
                          variant={isPreBooked ? "outline" : "default"}
                          className="w-full gap-2 text-xs"
                          disabled={isPreBooked || !meal.isOpen}
                        >
                          {isPreBooked ? (
                            <>
                              <Check className="h-3 w-3" />
                              Already Pre-booked
                            </>
                          ) : !meal.isOpen ? (
                            <>
                              <AlertCircle className="h-3 w-3" />
                              Closed for Booking
                            </>
                          ) : (
                            <>
                              <Plus className="h-3 w-3" />
                              Pre-book Now
                            </>
                          )}
                        </Button>
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )
        })}
      </div>

      {/* Pre-booking Dialog */}
      <Dialog open={preBookingOpen} onOpenChange={() => { setPreBookingOpen(false); setSelectedMeal(null); setSelectedItems([]) }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground flex items-center gap-2">
              {selectedMeal && mealIcons[selectedMeal.type]}
              {selectedMeal?.type} - {new Date(selectedMeal?.date || "").toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
            </DialogTitle>
            <DialogDescription>Select items and quantity (within maximum allowed)</DialogDescription>
          </DialogHeader>

          {selectedMeal && (
            <div className="space-y-4">
              {/* Menu Items Selection */}
              <div className="space-y-3">
                {selectedMeal.menuItems.map(item => {
                  const selectedQty = selectedItems.find(i => i.id === item.id)?.selectedQuantity || 0

                  return (
                    <div key={item.id} className="flex items-center justify-between p-3 rounded-lg border border-border/60 bg-muted/30">
                      <div className="flex-1">
                        <p className="text-sm font-medium text-foreground">{item.name}</p>
                        <div className="flex items-center gap-2 mt-1">
                          <span className="text-xs text-muted-foreground font-mono">{"Rs."}{item.cost}</span>
                          <span className="text-xs text-warning">Max: {item.maxQuantity}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-2 bg-background rounded-lg border border-border/60 px-2 py-1">
                        <input
                          type="number"
                          min={0}
                          max={item.maxQuantity}
                          value={selectedQty}
                          onChange={(e) => {
                            const next = Math.min(Number(e.target.value || 0), item.maxQuantity)
                            updateItemQuantity(item.id, next)
                          }}
                          className="w-16 bg-transparent text-center text-sm text-foreground outline-none"
                        />
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* Order Summary */}
              {selectedItems.length > 0 && (
                <div className="bg-muted/50 rounded-lg p-4 space-y-2 border border-border/60">
                  <p className="text-xs font-semibold text-muted-foreground mb-2">SELECTED ITEMS:</p>
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm">
                      <span className="text-foreground">{item.name} × {item.selectedQuantity}</span>
                      <span className="font-mono text-primary font-semibold">{"Rs."}{item.cost * item.selectedQuantity}</span>
                    </div>
                  ))}
                  <div className="flex items-center justify-between text-sm font-bold pt-2 border-t border-border/60">
                    <span className="text-foreground">Total Cost</span>
                    <span className="font-mono text-primary text-lg">{"Rs."}{calculateTotal()}</span>
                  </div>
                </div>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => { setPreBookingOpen(false); setSelectedMeal(null); setSelectedItems([]) }}>
              Cancel
            </Button>
            <Button
              onClick={confirmPreBooking}
              disabled={selectedItems.length === 0 || submitting}
              className="gap-2"
            >
              <Check className="h-4 w-4" />
              Confirm Pre-booking
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
