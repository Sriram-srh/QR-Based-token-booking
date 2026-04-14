"use client"

import { useEffect, useState } from "react"
import { getMealCost } from "@/lib/mock-data"
import type { Meal, MenuItem } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { clearAuthSession, getAuthHeadersAsync, isAuthFailureStatus, parseJsonSafe } from "@/lib/client-auth"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
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
  Pencil,
  Save,
  Plus,
  CalendarDays,
  Trash2,
  IndianRupee,
  AlertCircle,
} from "lucide-react"

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-5 w-5" />,
  Lunch: <Sun className="h-5 w-5" />,
  Dinner: <Moon className="h-5 w-5" />,
}

const mealGradients: Record<string, string> = {
  Breakfast: "from-[hsl(43,96%,56%)] to-[hsl(35,96%,50%)]",
  Lunch: "from-[hsl(217,91%,60%)] to-[hsl(230,91%,55%)]",
  Dinner: "from-[hsl(262,83%,58%)] to-[hsl(280,83%,50%)]",
}

function MealCard({ meal, onEdit, onToggle }: { meal: Meal; onEdit: () => void; onToggle: () => void }) {
  const totalCost = getMealCost(meal)
  return (
    <Card className="overflow-hidden border-border/60">
      <div className={`p-4 bg-gradient-to-br ${mealGradients[meal.type]} text-[hsl(0,0%,100%)]`}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            {mealIcons[meal.type]}
            <h3 className="text-lg font-bold">{meal.type}</h3>
          </div>
          <Switch
            checked={meal.isOpen}
            onCheckedChange={() => onToggle()}
            aria-label={`Toggle ${meal.type}`}
          />
        </div>
      </div>
      <CardContent className="p-4 space-y-4">
        <div className="space-y-2">
          <div className="flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-medium">Menu Items</span>
            <span className="text-xs font-mono text-primary">Total: {"Rs."}{totalCost}</span>
          </div>
          <div className="space-y-1.5">
            {meal.menuItems.map(item => (
              <div key={item.id} className="flex items-center justify-between p-2 rounded bg-muted/50 text-sm">
                <div className="flex-1">
                  <p className="text-foreground">{item.name}</p>
                  <p className="text-xs text-muted-foreground">Max Qty: {item.maxQuantity}</p>
                </div>
                <span className="font-mono text-muted-foreground">{"Rs."}{item.cost}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Booking Window</p>
            <p className="text-sm font-mono text-foreground">{meal.bookingStart} - {meal.bookingEnd}</p>
          </div>
          <div className="p-2 rounded-lg bg-muted/50">
            <p className="text-xs text-muted-foreground">Quota</p>
            <p className="text-sm font-mono text-foreground">{meal.bookedCount} / {meal.maxQuota}</p>
          </div>
        </div>

        <div className="flex items-center justify-between">
          <Badge variant={meal.isOpen ? "default" : "secondary"} className={meal.isOpen ? "bg-success text-success-foreground" : ""}>
            {meal.isOpen ? "Open for Booking" : "Closed"}
          </Badge>
          <Button variant="outline" size="sm" className="gap-1" onClick={onEdit}>
            <Pencil className="h-3 w-3" />
            Edit
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

export function MealManagement() {
  const [todayMeals, setTodayMeals] = useState<Meal[]>([])
  const [futureMeals, setFutureMeals] = useState<Meal[]>([])
  const [menuLibrary, setMenuLibrary] = useState<MenuItem[]>([])
  const [editingMeal, setEditingMeal] = useState<Meal | null>(null)
  const [selectedItems, setSelectedItems] = useState<MenuItem[]>([])
  const [newItem, setNewItem] = useState<{ menu_item_id: string; quantity_limit: string }>({ menu_item_id: "", quantity_limit: "" })
  const [editOpen, setEditOpen] = useState(false)
  const [dateError, setDateError] = useState("")

  const formatDateLocal = (input: Date): string => {
    const date = new Date(input)
    const y = date.getFullYear()
    const m = String(date.getMonth() + 1).padStart(2, "0")
    const d = String(date.getDate()).padStart(2, "0")
    return `${y}-${m}-${d}`
  }

  const formatTimeHHMM = (value: string | null | undefined): string => {
    if (!value) return "00:00"
    // Handles both "HH:mm:ss" and ISO timestamp formats.
    const match = String(value).match(/(\d{2}:\d{2})/)
    return match ? match[1] : "00:00"
  }

  const normalizeMeal = (row: any): Meal => {
    const apiMenuItems = Array.isArray(row?.menuItems) ? row.menuItems : []
    const normalizedMenuItems = apiMenuItems.map((item: any, idx: number) => ({
      id: String(item?.id ?? `menu-item-${idx}`),
      name: String(item?.name ?? "Menu Item"),
      cost: Number(item?.cost ?? 0),
      maxQuantity: Number(item?.maxQuantity ?? item?.max_quantity ?? 1),
    }))
    return {
      id: String(row?.id ?? ""),
      type: (row?.type ?? "Breakfast") as Meal["type"],
      menuItems: normalizedMenuItems,
      date: String(row?.meal_date ?? formatDateLocal(new Date())),
      bookingStart: formatTimeHHMM(row?.booking_start),
      bookingEnd: formatTimeHHMM(row?.booking_end),
      maxQuota: Number(row?.max_quota ?? 0),
      bookedCount: Number(row?.booked_count ?? 0),
      isOpen: Boolean(row?.is_open),
    }
  }

  const fetchMeals = async () => {
    try {
      const headers = await getAuthHeadersAsync()
      if (!headers.Authorization) {
        return
      }

      const response = await fetch('/api/meals?view=admin', { cache: 'no-store', headers })
      const payload = await parseJsonSafe(response)

      if (!response.ok) {
        if (isAuthFailureStatus(response.status)) {
          clearAuthSession()
          window.location.reload()
          return
        }
        console.error('Failed to fetch meals:', payload)
        return
      }

      const rawMeals = Array.isArray(payload?.data) ? payload.data : []
      const meals = rawMeals.map((row: any) => normalizeMeal(row))
      const todayStr = formatDateLocal(new Date())

      setTodayMeals(meals.filter((meal: Meal) => meal.date === todayStr))
      setFutureMeals(meals.filter((meal: Meal) => meal.date > todayStr))
    } catch (error) {
      console.error('Failed to fetch meals:', error)
    }
  }

  const fetchMenuLibrary = async () => {
    try {
      const headers = await getAuthHeadersAsync()
      if (!headers.Authorization) {
        return
      }

      const response = await fetch('/api/menu-items', { cache: 'no-store', headers })
      const payload = await parseJsonSafe(response)
      if (!response.ok) {
        if (isAuthFailureStatus(response.status)) {
          clearAuthSession()
          window.location.reload()
          return
        }
        console.error('Failed to fetch menu items:', payload)
        return
      }

      const items = Array.isArray(payload?.data) ? payload.data : []
      const normalized = items.map((item: any) => ({
        id: String(item?.id || ''),
        name: String(item?.name || 'Menu Item'),
        cost: Number(item?.cost || 0),
        maxQuantity: Number(item?.max_quantity || 1),
      }))

      setMenuLibrary(normalized)
    } catch (error) {
      console.error('Failed to fetch menu items:', error)
    }
  }

  useEffect(() => {
    fetchMeals()
    fetchMenuLibrary()
  }, [])

  const extractMealId = (meal: Meal) => {
    return (
      meal?.id ||
      (meal as any)?.meal_id ||
      (meal as any)?.meal?.id ||
      (meal as any)?.mealId ||
      ""
    )
  }

  const isUuid = (value: string) => {
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value)
  }

  const toggleMeal = async (meal: Meal, source: "today" | "future") => {
    console.log("🔥 FULL MEAL OBJECT:", meal)
    const mealId = extractMealId(meal)
    const newValue = !meal?.isOpen

    console.log("🚀 SENDING REQUEST:", { mealId, isOpen: newValue, source })

    if (!mealId) {
      console.error("NO MEAL ID FOUND", meal)
      return
    }

    // Prevent opaque API failures when UI is still using mock IDs like "meal-1".
    if (!isUuid(String(mealId))) {
      console.error("Toggle blocked: invalid UUID mealId from UI data", {
        mealId,
        reason: "Meal cards are using mock IDs; DB update endpoints require real UUIDs from meals table.",
      })
      return
    }

    const payload = {
      mealId: String(mealId),
      isOpen: Boolean(newValue),
    }

    console.log("🚀 PAYLOAD JSON:", JSON.stringify(payload))

    let response = await fetch('/api/meals/toggle', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(await getAuthHeadersAsync()),
      },
      body: JSON.stringify(payload),
      cache: 'no-store',
    })

    let data: any = {}
    try {
      const raw = await response.text()
      data = raw ? JSON.parse(raw) : {}
    } catch {
      data = {}
    }

    if (!response.ok && (!data || Object.keys(data).length === 0)) {
      response = await fetch(`/api/meals/${payload.mealId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...(await getAuthHeadersAsync()),
        },
        body: JSON.stringify({ is_open: payload.isOpen }),
        cache: 'no-store',
      })

      try {
        const raw = await response.text()
        data = raw ? JSON.parse(raw) : {}
      } catch {
        data = {}
      }
    }

    console.log("TOGGLE RESPONSE:", {
      status: response.status,
      ok: response.ok,
      statusText: response.statusText,
      data,
    })

    if (!response.ok) {
      console.error("Toggle failed", data)
      return
    }

    await fetchMeals()

    if (source === "today") {
      setTodayMeals(prev => prev.map(m => extractMealId(m) === payload.mealId ? { ...m, isOpen: payload.isOpen } : m))
      return
    }

    setFutureMeals(prev => prev.map(m => extractMealId(m) === payload.mealId ? { ...m, isOpen: payload.isOpen } : m))
  }

  const toggleTodayMeal = async (meal: Meal) => {
    await toggleMeal(meal, "today")
  }

  const toggleFutureMeal = async (meal: Meal) => {
    await toggleMeal(meal, "future")
  }

  const openEdit = (meal: Meal) => {
    setEditingMeal({ ...meal, menuItems: meal.menuItems.map(mi => ({ ...mi })) })
    setSelectedItems(meal.menuItems.map(mi => ({ ...mi })))
    setEditOpen(true)
    setNewItem({ menu_item_id: "", quantity_limit: "" })
    setDateError("")
  }

  const addMenuItem = () => {
    if (!newItem.menu_item_id || !newItem.quantity_limit) return
    const selectedItem = menuLibrary.find(item => item.id === newItem.menu_item_id)
    if (!selectedItem) return
    if (selectedItems.some(item => item.id === newItem.menu_item_id)) return

    const itemToAdd: MenuItem = {
      id: selectedItem.id,
      name: selectedItem.name,
      cost: selectedItem.cost,
      maxQuantity: parseInt(newItem.quantity_limit) || selectedItem.maxQuantity || 1,
    }
    setSelectedItems(prev => [...prev, itemToAdd])
    setNewItem({ menu_item_id: "", quantity_limit: "" })
  }

  const removeMenuItem = (itemId: string) => {
    setSelectedItems(prev => prev.filter(mi => mi.id !== itemId))
  }

  const updateMenuItemCost = (itemId: string, cost: number) => {
    setSelectedItems(prev => prev.map(mi => mi.id === itemId ? { ...mi, cost } : mi))
  }

  const updateMenuItemMaxQty = (itemId: string, maxQty: number) => {
    setSelectedItems(prev => prev.map(mi => mi.id === itemId ? { ...mi, maxQuantity: maxQty } : mi))
  }

  const validateDate = (dateStr: string): boolean => {
    const selectedDate = new Date(dateStr)
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const maxDate = new Date(today)
    maxDate.setDate(today.getDate() + 10)

    if (selectedDate < today) {
      setDateError("Cannot schedule meals in the past")
      return false
    }
    if (selectedDate > maxDate) {
      setDateError("Can only schedule meals up to 10 days in advance")
      return false
    }
    setDateError("")
    return true
  }

  // ✅ FIX: Save meal with API update + detailed error logging
  const saveMeal = async () => {
    if (!editingMeal) return
    if (!validateDate(editingMeal.date)) return

    try {
      console.log('[meal-management] Saving meal:', editingMeal.id)
      const payload = {
        mealId: editingMeal.id,
        items: selectedItems.map((item) => ({
          menu_item_id: item.id,
          quantity_limit: item.maxQuantity,
        })),
      }

      console.log('🚀 SAVE PAYLOAD:', JSON.stringify(payload, null, 2))
      
      const response = await fetch('/api/meals/save', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', ...(await getAuthHeadersAsync()) },
        body: JSON.stringify(payload)
      })

      let data: any = {}
      try {
        const raw = await response.text()
        data = raw ? JSON.parse(raw) : { error: 'Empty response body' }
      } catch {
        data = { error: 'Response is not valid JSON' }
      }

      if (!response.ok && (!data || Object.keys(data).length === 0)) {
        data = {
          error: `HTTP ${response.status} ${response.statusText} with empty response body`,
          endpoint: '/api/meals/save',
        }
      }

      if (!response.ok) {
        console.error('[meal-management] ❌ Save failed:', {
          status: response.status,
          statusText: response.statusText,
          response: data
        })
        return
      }

      console.log('[meal-management] ✅ Save success:', data)
      // Update local state after API success
      const updatedMeal: Meal = {
        ...editingMeal,
        menuItems: selectedItems,
      }
      setTodayMeals(prev => prev.map(m => m.id === editingMeal.id ? updatedMeal : m))
      setFutureMeals(prev => prev.map(m => m.id === editingMeal.id ? updatedMeal : m))
      setEditOpen(false)
      setEditingMeal(null)
      setSelectedItems([])
      setNewItem({ menu_item_id: "", quantity_limit: "" })
    } catch (error) {
      console.error('[meal-management] ❌ Save exception:', error)
    }
  }

  const getMaxScheduleDate = (): string => {
    const maxDate = new Date()
    maxDate.setDate(maxDate.getDate() + 10)
    return maxDate.toISOString().split('T')[0]
  }

  const mealTypeOrder: Meal["type"][] = ["Breakfast", "Lunch", "Dinner"]
  const groupedFutureMeals = futureMeals.reduce((acc, meal) => {
    if (!acc[meal.date]) {
      acc[meal.date] = []
    }
    acc[meal.date].push(meal)
    return acc
  }, {} as Record<string, Meal[]>)
  const sortedFutureDates = Object.keys(groupedFutureMeals).sort()

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Meal Management</h1>
          <p className="text-muted-foreground">
            Schedule meals, manage menu items with prices & quantity limits
          </p>
        </div>
      </div>

      <Tabs defaultValue="today" className="space-y-6">
        <TabsList>
          <TabsTrigger value="today" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Today ({new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short" })})
          </TabsTrigger>
          <TabsTrigger value="future" className="gap-2">
            <CalendarDays className="h-4 w-4" />
            Future (Next 10 Days)
          </TabsTrigger>
        </TabsList>

        <TabsContent value="today">
          <div className="grid gap-6 md:grid-cols-3">
            {todayMeals.map(meal => (
              <MealCard key={meal.id} meal={meal} onEdit={() => openEdit(meal)} onToggle={() => toggleTodayMeal(meal)} />
            ))}
          </div>
        </TabsContent>

        <TabsContent value="future">
          <div className="space-y-4">
            <div className="bg-primary/5 border border-primary/20 rounded-lg p-3 flex items-start gap-2">
              <AlertCircle className="h-4 w-4 text-primary flex-shrink-0 mt-0.5" />
              <p className="text-xs text-muted-foreground">
                You can schedule meals up to <strong>10 days in advance</strong>. Meals beyond this period cannot be created.
              </p>
            </div>
            {sortedFutureDates.length === 0 ? (
              <div className="text-sm text-muted-foreground p-4 border border-dashed rounded-lg">No upcoming meals configured for the next 10 days.</div>
            ) : (
              <div className="space-y-6">
                {sortedFutureDates.map((dateStr) => {
                  const dateObj = new Date(dateStr)
                  const dateLabel = dateObj.toLocaleDateString("en-IN", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                    weekday: "short",
                  })

                  return (
                    <div key={dateStr} className="space-y-3">
                      <div className="border-b pb-2">
                        <h3 className="text-sm font-semibold text-foreground">{dateLabel}</h3>
                      </div>
                      <div className="grid gap-6 md:grid-cols-3">
                        {mealTypeOrder.map((mealType) => {
                          const meal = groupedFutureMeals[dateStr].find((m) => m.type === mealType)
                          if (!meal) {
                            return (
                              <Card key={`${dateStr}-${mealType}`} className="border border-dashed border-border/60">
                                <CardContent className="p-4 text-sm text-muted-foreground">
                                  {mealType}: Not configured
                                </CardContent>
                              </Card>
                            )
                          }

                          return (
                            <MealCard
                              key={meal.id}
                              meal={meal}
                              onEdit={() => openEdit(meal)}
                              onToggle={() => toggleFutureMeal(meal)}
                            />
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Edit Meal Dialog */}
      <Dialog open={editOpen} onOpenChange={() => { setEditOpen(false); setEditingMeal(null); setSelectedItems([]); setNewItem({ menu_item_id: "", quantity_limit: "" }); setDateError("") }}>
        <DialogContent className="sm:max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-foreground">
              Edit {editingMeal?.type} - {editingMeal?.date}
            </DialogTitle>
            <DialogDescription>Update menu items, prices, max quantities, timing, and quota</DialogDescription>
          </DialogHeader>
          {editingMeal && (
            <div className="space-y-5">
              {/* Menu Items */}
              <div className="space-y-3">
                <Label className="text-foreground font-medium">Menu Items (with Price & Max Quantity)</Label>
                <div className="space-y-2">
                  {selectedItems.map(item => (
                    <div key={item.id} className="flex items-center gap-2">
                      <div className="flex-1 px-3 py-2 rounded-md border border-border bg-background text-foreground text-sm">
                        {item.name}
                      </div>
                      <div className="flex items-center gap-1 w-24">
                        <IndianRupee className="h-3 w-3 text-muted-foreground" />
                        <Input
                          type="number"
                          value={item.cost}
                          onChange={e => updateMenuItemCost(item.id, parseFloat(e.target.value) || 0)}
                          placeholder="Price"
                          className="bg-background text-foreground"
                        />
                      </div>
                      <Input
                        type="number"
                        value={item.maxQuantity}
                        onChange={e => updateMenuItemMaxQty(item.id, parseInt(e.target.value) || 1)}
                        placeholder="Max Qty"
                        className="w-20 bg-background text-foreground"
                        min="1"
                      />
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-destructive hover:bg-destructive/10"
                        onClick={() => removeMenuItem(item.id)}
                      >
                        <Trash2 className="h-3 w-3" />
                      </Button>
                    </div>
                  ))}
                </div>

                {/* Add New Item */}
                <div className="flex items-center gap-2 p-3 rounded-lg bg-muted/50 border border-dashed border-border">
                  <select
                    value={newItem.menu_item_id}
                    onChange={e => setNewItem(prev => ({ ...prev, menu_item_id: e.target.value }))}
                    className="flex-1 h-10 rounded-md border border-border bg-background px-3 text-sm text-foreground"
                  >
                    <option value="">Select menu item</option>
                    {menuLibrary
                      .filter(item => !selectedItems.some(mi => mi.id === item.id))
                      .map(item => (
                        <option key={item.id} value={item.id}>
                          {item.name} - Rs.{item.cost}
                        </option>
                      ))}
                  </select>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={newItem.quantity_limit}
                    onChange={e => setNewItem(prev => ({ ...prev, quantity_limit: e.target.value }))}
                    className="w-20 bg-background text-foreground"
                    min="1"
                  />
                  <Button variant="outline" size="icon" className="h-8 w-8" onClick={addMenuItem}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>

                <div className="text-right text-sm text-muted-foreground">
                  Total per plate: <span className="font-bold text-primary font-mono">{"Rs."}{selectedItems.reduce((sum, item) => sum + Number(item.cost || 0), 0)}</span>
                </div>
              </div>

              {/* Timing */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="start" className="text-foreground">Booking Start</Label>
                  <Input
                    id="start"
                    type="time"
                    value={editingMeal.bookingStart}
                    onChange={e => setEditingMeal({ ...editingMeal, bookingStart: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="end" className="text-foreground">Booking End</Label>
                  <Input
                    id="end"
                    type="time"
                    value={editingMeal.bookingEnd}
                    onChange={e => setEditingMeal({ ...editingMeal, bookingEnd: e.target.value })}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>

              {/* Date & Quota */}
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="date" className="text-foreground">Date</Label>
                  <Input
                    id="date"
                    type="date"
                    value={editingMeal.date}
                    onChange={e => {
                      validateDate(e.target.value)
                      setEditingMeal({ ...editingMeal, date: e.target.value })
                    }}
                    max={getMaxScheduleDate()}
                    className="bg-background text-foreground"
                  />
                  {dateError && <p className="text-xs text-destructive">{dateError}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="quota" className="text-foreground">Max Quota</Label>
                  <Input
                    id="quota"
                    type="number"
                    value={editingMeal.maxQuota}
                    onChange={e => setEditingMeal({ ...editingMeal, maxQuota: parseInt(e.target.value) || 0 })}
                    className="bg-background text-foreground"
                  />
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => { setEditOpen(false); setEditingMeal(null); setSelectedItems([]); setNewItem({ menu_item_id: "", quantity_limit: "" }); setDateError("") }}>Cancel</Button>
            <Button variant="chrome" onClick={saveMeal} className="gap-2 px-5 py-2">
              <Save className="h-4 w-4" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}
