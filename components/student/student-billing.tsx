"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  IndianRupee,
  Receipt,
  Coffee,
  Sun,
  Moon,
  CheckCircle2,
  AlertCircle,
  History,
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { getAuthHeadersAsync } from "@/lib/client-auth"

const mealIcons: Record<string, React.ReactNode> = {
  Breakfast: <Coffee className="h-4 w-4" />,
  Lunch: <Sun className="h-4 w-4" />,
  Dinner: <Moon className="h-4 w-4" />,
}

export function StudentBilling() {
  const { student } = useAuth()
  const [tokens, setTokens] = useState<any[]>([])

  useEffect(() => {
    const load = async () => {
      if (!student?.id) return
      try {
        const headers = await getAuthHeadersAsync()
        const response = await fetch(`/api/tokens?studentId=${student.id}`, {
          cache: 'no-store',
          headers,
        })
        if (!response.ok) {
          setTokens([])
          return
        }
        const data = await response.json()
        setTokens(Array.isArray(data.tokens) ? data.tokens : [])
      } catch {
        setTokens([])
      }
    }
    load()
  }, [student?.id])

  const billing = useMemo(() => {
    const byMeal = {
      Breakfast: { meal: 'Breakfast', count: 0, amount: 0 },
      Lunch: { meal: 'Lunch', count: 0, amount: 0 },
      Dinner: { meal: 'Dinner', count: 0, amount: 0 },
    }

    for (const token of tokens) {
      const meal = token.meal_type
      if (meal in byMeal) {
        byMeal[meal as keyof typeof byMeal].count += 1
        byMeal[meal as keyof typeof byMeal].amount += Number(token.total_cost || 0)
      }
    }

    const totalAmount = Math.round(tokens.reduce((sum, t) => sum + Number(t.total_cost || 0), 0))

    return {
      totalAmount,
      paymentStatus: (totalAmount > 0 ? 'Not Paid' : 'Paid') as 'Paid' | 'Not Paid',
      breakdown: Object.values(byMeal),
      paymentHistory: [] as Array<{ id: string; date: string; amount: number; status: 'Paid' | 'Not Paid' }>,
    }
  }, [tokens])

  const isPaid = billing.paymentStatus === "Paid"

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Billing & Payments</h1>
        <p className="text-muted-foreground">View your meal charges and payment status</p>
      </div>

      {/* Total Amount Card */}
      <Card className={`border-2 ${isPaid ? "border-success/40 bg-success/5" : "border-warning/40 bg-warning/5"}`}>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className={`h-14 w-14 rounded-2xl flex items-center justify-center ${isPaid ? "bg-success/10" : "bg-warning/10"}`}>
                <IndianRupee className={`h-7 w-7 ${isPaid ? "text-success" : "text-warning"}`} />
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Current Outstanding</p>
                <p className="text-3xl font-bold text-foreground font-mono">
                  {"Rs."}{billing.totalAmount.toLocaleString("en-IN")}
                </p>
              </div>
            </div>
            <Badge className={`text-sm px-4 py-1.5 ${
              isPaid ? "bg-success text-success-foreground" : "bg-warning text-warning-foreground"
            }`}>
              {isPaid ? (
                <><CheckCircle2 className="h-4 w-4 mr-1.5" /> Paid</>
              ) : (
                <><AlertCircle className="h-4 w-4 mr-1.5" /> Payment Pending</>
              )}
            </Badge>
          </div>
          {!isPaid && (
            <p className="text-xs text-muted-foreground mt-3">
              Amount accumulates until Admin marks as Paid. Contact hostel admin for payment.
            </p>
          )}
        </CardContent>
      </Card>

      {/* Meal Breakdown */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
            <Receipt className="h-5 w-5 text-primary" />
            Meal Breakdown (Current Cycle)
          </CardTitle>
          <CardDescription>Charges accumulate based on meals served</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3">
            {billing.breakdown.map((item) => (
              <div key={item.meal} className="flex items-center justify-between p-3 rounded-lg bg-muted/50 border border-border/40">
                <div className="flex items-center gap-3">
                  <div className="h-9 w-9 rounded-lg bg-primary/10 flex items-center justify-center text-primary">
                    {mealIcons[item.meal]}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-foreground">{item.meal}</p>
                    <p className="text-xs text-muted-foreground">{item.count} meals consumed</p>
                  </div>
                </div>
                <p className="text-sm font-bold font-mono text-foreground">
                  {"Rs."}{item.amount.toLocaleString("en-IN")}
                </p>
              </div>
            ))}
            <div className="flex items-center justify-between p-3 rounded-lg bg-primary/5 border border-primary/20">
              <p className="text-sm font-semibold text-foreground">Total</p>
              <p className="text-lg font-bold font-mono text-primary">
                {"Rs."}{billing.totalAmount.toLocaleString("en-IN")}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Payment History */}
      <Card className="border-border/60">
        <CardHeader>
          <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
            <History className="h-5 w-5 text-primary" />
            Payment History
          </CardTitle>
          <CardDescription>Previous payment records</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {billing.paymentHistory.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="border-border">
                  <TableHead className="text-muted-foreground">Date</TableHead>
                  <TableHead className="text-muted-foreground">Amount</TableHead>
                  <TableHead className="text-right text-muted-foreground">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {billing.paymentHistory.map(payment => (
                  <TableRow key={payment.id} className="border-border">
                    <TableCell className="text-foreground">
                      {new Date(payment.date).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </TableCell>
                    <TableCell className="font-mono text-foreground">
                      {"Rs."}{payment.amount.toLocaleString("en-IN")}
                    </TableCell>
                    <TableCell className="text-right">
                      <Badge className="bg-success text-success-foreground text-xs">
                        <CheckCircle2 className="h-3 w-3 mr-1" />
                        {payment.status}
                      </Badge>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-8 text-center">
              <History className="h-10 w-10 mx-auto text-muted-foreground/30 mb-2" />
              <p className="text-sm text-muted-foreground">No payment history yet</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
