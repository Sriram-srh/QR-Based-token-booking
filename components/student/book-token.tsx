"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeadersAsync } from "@/lib/client-auth"
import type { Meal, MealType, MenuItem, BookedItem } from "@/lib/mock-data"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Coffee,
  Sun,
  Moon,
  Ticket,
  CheckCircle2,
  AlertCircle,
  Info,
  Plus,
  Minus,
} from "lucide-react"

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-6 w-6" />,
  Lunch: <Sun className="h-6 w-6" />,
  Dinner: <Moon className="h-6 w-6" />,
}

const mealGradients: Record<string, string> = {
  Breakfast: "from-[hsl(43,96%,56%)] to-[hsl(35,96%,50%)]",
  Lunch: "from-[hsl(217,91%,60%)] to-[hsl(230,91%,55%)]",
  Dinner: "from-[hsl(262,83%,58%)] to-[hsl(280,83%,50%)]",
}

interface SelectedItem extends BookedItem {
  maxQuantity: number
}

export function BookToken({ onNavigate }: { onNavigate: (tab: string) => void }) {
  const { user } = useAuth()
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [confirmMeal, setConfirmMeal] = useState<MealType | null>(null)
  const [selectedItems, setSelectedItems] = useState<Map<string, SelectedItem>>(new Map())
  const [booked, setBooked] = useState(false)
  const [booking, setBooking] = useState(false)
  const [bookingError, setBookingError] = useState<string | null>(null)

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
    const fetchMeals = async () => {
      try {
        const headers = await getAuthHeadersAsync()
        const response = await fetch('/api/meals?view=student', { cache: 'no-store', headers })
        const payload = await response.json()
        if (!response.ok) return

        const rows = Array.isArray(payload?.data) ? payload.data : []
        const meals = rows.map((row: any) => normalizeMeal(row))
        const today = toLocalDateString(new Date())
        setTodayMeals(meals.filter((meal: Meal) => meal.date === today))
      } catch {
        setTodayMeals([])
      }
    }

    fetchMeals()
  }, [])

  const handleBook = async () => {
    if (!confirmMeal || !user?.studentId) {
      setBookingError('Unable to identify student account. Please sign in again.')
      return
    }

    try {
      setBooking(true)
      setBookingError(null)
      const headers = await getAuthHeadersAsync()

      const response = await fetch('/api/tokens', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...headers },
        body: JSON.stringify({
          studentId: user.studentId,
          mealType: confirmMeal,
          totalCost,
        }),
      })

      const data = await response.json()
      if (!response.ok) {
        throw new Error(data.error || 'Failed to book token')
      }

      setBooked(true)
      setTimeout(() => {
        setConfirmMeal(null)
        setBooked(false)
        setSelectedItems(new Map())
        onNavigate("tokens")
      }, 1200)
    } catch (error) {
      setBookingError(error instanceof Error ? error.message : 'Failed to book token')
    } finally {
      setBooking(false)
    }
  }

  const openConfirm = (mealType: MealType) => {
    setConfirmMeal(mealType)
    setSelectedItems(new Map())
  }

  const toggleItem = (item: MenuItem) => {
    const newSelected = new Map(selectedItems)
    if (newSelected.has(item.id)) {
      newSelected.delete(item.id)
    } else {
      newSelected.set(item.id, {
        itemId: item.id,
        name: item.name,
        cost: item.cost,
        quantity: 1,
        maxQuantity: item.maxQuantity,
      })
    }
    setSelectedItems(newSelected)
  }

  const updateQuantity = (itemId: string, delta: number) => {
    const newSelected = new Map(selectedItems)
    const item = newSelected.get(itemId)
    if (!item) return

    const newQty = Math.max(1, Math.min(item.maxQuantity, item.quantity + delta))
    newSelected.set(itemId, { ...item, quantity: newQty })
    setSelectedItems(newSelected)
  }

  const selectedMeal = confirmMeal ? todayMeals.find(m => m.type === confirmMeal) : null

  const selectedMenuItems = selectedMeal
    ? selectedMeal.menuItems.filter(item => selectedItems.has(item.id))
    : []

  const totalCost = Array.from(selectedItems.values()).reduce(
    (sum, item) => sum + item.cost * item.quantity,
    0
  )

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Book Meal Token</h1>
        <p className="text-muted-foreground">
          Select individual food items from your preferred meal. You control quantity for each item.
        </p>
      </div>

      {/* Rules Card */}
      <Card className="bg-primary/5 border-primary/20">
        <CardContent className="p-4">
          <div className="flex gap-3">
            <Info className="h-5 w-5 text-primary flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-medium text-card-foreground">Booking Rules</p>
              <ul className="text-xs text-muted-foreground space-y-1 list-disc pl-4">
                <li>Select individual items from the meal menu and choose quantity</li>
                <li>Each item has a maximum quantity limit set by admin</li>
                <li>You cannot exceed the maximum allowed quantity per item</li>
                <li>Total bill is calculated based on items and quantities selected</li>
                <li>Tokens expire automatically at meal end time</li>
                <li>Charges apply only when token is scanned at the counter</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Meal Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        {todayMeals.map(meal => {
          const percentBooked = Math.round((meal.bookedCount / meal.maxQuota) * 100)
          const remaining = meal.maxQuota - meal.bookedCount
          const canBook = meal.isOpen && remaining > 0

          return (
            <Card key={meal.id} className={`overflow-hidden border-border/60 transition-all ${canBook ? "hover:shadow-lg hover:border-primary/40" : "opacity-70"}`}>
              <div className={`p-6 bg-gradient-to-br ${mealGradients[meal.type]} text-[hsl(0,0%,100%)]`}>
                <div className="flex items-center justify-between mb-3">
                  {mealIcons[meal.type]}
                  <Badge variant="outline" className="bg-[hsl(0,0%,100%)]/20 text-[hsl(0,0%,100%)] border-[hsl(0,0%,100%)]/30">
                    {meal.bookingStart} - {meal.bookingEnd}
                  </Badge>
                </div>
                <h3 className="text-xl font-bold">{meal.type}</h3>
                <p className="text-sm opacity-90 mt-1 line-clamp-2">Pick your items and quantities</p>
              </div>
              <CardContent className="p-4 space-y-4">
                {/* Menu items with max quantity */}
                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {meal.menuItems.map(item => (
                    <div key={item.id} className="flex items-center justify-between text-sm border border-border/40 rounded-lg p-2 hover:bg-muted/50 transition-colors">
                      <div className="flex-1">
                        <span className="text-muted-foreground block">{item.name}</span>
                        <span className="text-xs text-muted-foreground">Max: {item.maxQuantity}</span>
                      </div>
                      <span className="font-mono text-card-foreground font-semibold">Rs.{item.cost}</span>
                    </div>
                  ))}
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Quota</span>
                    <span className="font-mono text-card-foreground">{meal.bookedCount}/{meal.maxQuota}</span>
                  </div>
                  <Progress value={percentBooked} className="h-2" />
                  <p className="text-xs text-muted-foreground">{remaining} slots remaining</p>
                </div>

                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-1 text-xs text-muted-foreground">
                    <Ticket className="h-3 w-3" />
                    Live quota status
                  </div>
                  <Badge variant={meal.isOpen ? "default" : "secondary"} className={meal.isOpen ? "bg-success text-success-foreground" : ""}>
                    {meal.isOpen ? "Open" : "Closed"}
                  </Badge>
                </div>

                <Button
                  className="w-full gap-2"
                  disabled={!canBook}
                  onClick={() => openConfirm(meal.type)}
                >
                  {!meal.isOpen ? (
                    "Booking Closed"
                  ) : remaining <= 0 ? (
                    "Quota Full"
                  ) : (
                    <>
                      <Ticket className="h-4 w-4" />
                      Select Items
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>
          )
        })}
      </div>

      {/* Confirmation Dialog with Item Selector */}
      <Dialog open={confirmMeal !== null} onOpenChange={() => { setConfirmMeal(null); setBooked(false); setSelectedItems(new Map()) }}>
        <DialogContent className="sm:max-w-md">
          {!booked ? (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Select Items for {confirmMeal}</DialogTitle>
                <DialogDescription>
                  Choose items and set quantities. Each item has a max limit set by admin.
                </DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-2">
                {/* Menu Items with Quantity Selector */}
                <div className="space-y-2 max-h-64 overflow-y-auto border border-border/40 rounded-lg p-3 bg-muted/20">
                  {selectedMeal?.menuItems.map(item => {
                    const selected = selectedItems.get(item.id)
                    const quantity = selected?.quantity || 0

                    return (
                      <div
                        key={item.id}
                        className={`p-3 rounded-lg transition-colors ${
                          quantity > 0 ? "bg-primary/5 border border-primary/20" : "bg-muted/50 border border-transparent"
                        }`}
                      >
                        <div className="flex items-start justify-between mb-2">
                          <div className="flex-1">
                            <p className="text-sm font-medium text-card-foreground">{item.name}</p>
                            <p className="text-xs text-muted-foreground">Price: Rs.{item.cost} | Max: {item.maxQuantity}</p>
                          </div>
                          <span className="text-sm font-semibold text-primary">Rs.{item.cost}</span>
                        </div>

                        {quantity === 0 ? (
                          <Button
                            variant="outline"
                            size="sm"
                            className="w-full"
                            onClick={() => toggleItem(item)}
                          >
                            <Plus className="h-3 w-3 mr-1" />
                            Add Item
                          </Button>
                        ) : (
                          <div className="flex items-center justify-between bg-background rounded p-2 border border-border/40">
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="text-sm font-mono font-bold text-foreground w-6 text-center">{quantity}</span>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6"
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={quantity >= item.maxQuantity}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                            <div className="flex-1 flex justify-end text-xs font-semibold text-primary ml-2">
                              Rs.{item.cost * quantity}
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-6 w-6 text-destructive hover:bg-destructive/10"
                              onClick={() => toggleItem(item)}
                            >
                              ✕
                            </Button>
                          </div>
                        )}
                      </div>
                    )
                  })}
                </div>

                {/* Selected Items Summary */}
                {selectedMenuItems.length > 0 && (
                  <div className="p-3 rounded-lg bg-accent/5 border border-accent/20">
                    <p className="text-xs font-medium text-muted-foreground mb-2">YOUR SELECTION:</p>
                    <div className="space-y-1.5">
                      {selectedMeal?.menuItems.map(item => {
                        const selected = selectedItems.get(item.id)
                        if (!selected || selected.quantity === 0) return null
                        return (
                          <div key={item.id} className="flex items-center justify-between text-sm">
                            <span className="text-card-foreground">✓ {item.name} × {selected.quantity}</span>
                            <span className="font-mono text-accent font-semibold">Rs.{item.cost * selected.quantity}</span>
                          </div>
                        )
                      })}
                    </div>
                  </div>
                )}

                {/* Total Cost */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
                  <span className="text-sm font-semibold text-muted-foreground">Total Bill</span>
                  <span className="text-xl font-bold font-mono text-primary">
                    Rs.{totalCost}
                  </span>
                </div>

                {selectedMenuItems.length === 0 && (
                  <div className="p-3 rounded-lg bg-warning/5 border border-warning/20">
                    <p className="text-sm text-warning-foreground font-medium">
                      Please select at least one item to proceed
                    </p>
                  </div>
                )}

                {bookingError && (
                  <div className="p-3 rounded-lg bg-destructive/10 border border-destructive/30 text-sm text-destructive">
                    {bookingError}
                  </div>
                )}
              </div>

              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => { setConfirmMeal(null); setSelectedItems(new Map()) }}>
                  Cancel
                </Button>
                <Button
                  onClick={handleBook}
                  disabled={selectedMenuItems.length === 0 || booking}
                  className="gap-2"
                >
                  <Ticket className="h-4 w-4" />
                  {booking ? 'Booking...' : `Confirm Booking (Rs.${totalCost})`}
                </Button>
              </DialogFooter>
            </>
          ) : (
            <div className="flex flex-col items-center gap-4 py-6">
              <div className="h-16 w-16 rounded-full bg-success/10 flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-success" />
              </div>
              <div className="text-center">
                <h3 className="text-lg font-semibold text-foreground">
                  Token Booked!
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  Total Amount: <span className="font-bold text-primary">Rs.{totalCost}</span>
                </p>
                <p className="text-xs text-muted-foreground mt-2">Redirecting to your tokens...</p>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
