"use client"

import { useState } from "react"
import { mockStudentPayments } from "@/lib/mock-data"
import type { StudentPayment, PaymentStatus } from "@/lib/mock-data"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  IndianRupee,
  Search,
  User,
  CheckCircle2,
  AlertCircle,
  Coffee,
  Sun,
  Moon,
  Eye,
} from "lucide-react"

export function PaymentControl() {
  const [payments, setPayments] = useState<StudentPayment[]>(mockStudentPayments)
  const [search, setSearch] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [detailStudent, setDetailStudent] = useState<StudentPayment | null>(null)

  const filtered = payments.filter(p => {
    if (statusFilter !== "all" && p.paymentStatus !== statusFilter) return false
    if (search && !p.studentName.toLowerCase().includes(search.toLowerCase()) && !p.registerNumber.toLowerCase().includes(search.toLowerCase())) return false
    return true
  })

  const totalUnpaid = payments.filter(p => p.paymentStatus === "Not Paid").reduce((sum, p) => sum + p.totalAmount, 0)
  const totalPaid = payments.filter(p => p.paymentStatus === "Paid").reduce((sum, p) => sum + p.totalAmount, 0)

  const togglePaymentStatus = (studentId: string) => {
    setPayments(prev => prev.map(p => {
      if (p.studentId === studentId) {
        const newStatus: PaymentStatus = p.paymentStatus === "Paid" ? "Not Paid" : "Paid"
        return {
          ...p,
          paymentStatus: newStatus,
          totalAmount: newStatus === "Paid" ? 0 : p.totalAmount,
          lastPaymentDate: newStatus === "Paid" ? new Date().toISOString().split("T")[0] : p.lastPaymentDate,
        }
      }
      return p
    }))
    setDetailStudent(null)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Student Payments</h1>
        <p className="text-muted-foreground">Track consumption, manage billing, and record payments</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-warning/10 flex items-center justify-center">
                <AlertCircle className="h-5 w-5 text-warning" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground font-mono">
                  {"Rs."}{totalUnpaid.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">Total Unpaid</p>
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
                <p className="text-2xl font-bold text-card-foreground font-mono">
                  {"Rs."}{totalPaid.toLocaleString("en-IN")}
                </p>
                <p className="text-xs text-muted-foreground">Total Collected</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-border/60">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 rounded-xl bg-primary/10 flex items-center justify-center">
                <User className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-2xl font-bold text-card-foreground">{payments.length}</p>
                <p className="text-xs text-muted-foreground">Total Students</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by name or register number..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background text-foreground"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full sm:w-44 bg-background text-foreground">
                <SelectValue placeholder="Filter status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="Not Paid">Not Paid</SelectItem>
                <SelectItem value="Paid">Paid</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Payment Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Student</TableHead>
                <TableHead className="text-muted-foreground">Meals</TableHead>
                <TableHead className="hidden md:table-cell text-muted-foreground">B / L / D</TableHead>
                <TableHead className="text-muted-foreground">Amount</TableHead>
                <TableHead className="text-muted-foreground">Status</TableHead>
                <TableHead className="text-right text-muted-foreground">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filtered.map(payment => (
                <TableRow key={payment.studentId} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="h-8 w-8 rounded-lg bg-primary/10 flex items-center justify-center">
                        <User className="h-4 w-4 text-primary" />
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{payment.studentName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{payment.registerNumber}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="font-mono text-sm text-foreground">{payment.totalMeals}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                      <span className="flex items-center gap-0.5"><Coffee className="h-3 w-3" />{payment.breakfastCount}</span>
                      <span className="flex items-center gap-0.5"><Sun className="h-3 w-3" />{payment.lunchCount}</span>
                      <span className="flex items-center gap-0.5"><Moon className="h-3 w-3" />{payment.dinnerCount}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm font-bold font-mono text-foreground">
                      {"Rs."}{payment.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </TableCell>
                  <TableCell>
                    <Badge className={`text-xs ${
                      payment.paymentStatus === "Paid"
                        ? "bg-success text-success-foreground"
                        : "bg-warning text-warning-foreground"
                    }`}>
                      {payment.paymentStatus === "Paid" ? (
                        <><CheckCircle2 className="h-3 w-3 mr-1" /> Paid</>
                      ) : (
                        <><AlertCircle className="h-3 w-3 mr-1" /> Not Paid</>
                      )}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" className="text-xs gap-1" onClick={() => setDetailStudent(payment)}>
                        <Eye className="h-3 w-3" />
                        Details
                      </Button>
                      <Button
                        variant={payment.paymentStatus === "Paid" ? "outline" : "default"}
                        size="sm"
                        className={`text-xs ${payment.paymentStatus === "Paid" ? "" : "bg-success text-success-foreground hover:bg-success/90"}`}
                        onClick={() => togglePaymentStatus(payment.studentId)}
                      >
                        {payment.paymentStatus === "Paid" ? "Mark Unpaid" : "Mark Paid"}
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={detailStudent !== null} onOpenChange={() => setDetailStudent(null)}>
        <DialogContent className="sm:max-w-md">
          {detailStudent && (
            <>
              <DialogHeader>
                <DialogTitle className="text-foreground">Student Billing Details</DialogTitle>
                <DialogDescription>{detailStudent.studentName} ({detailStudent.registerNumber})</DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-2">
                <div className="flex items-center gap-4">
                  <div className="h-14 w-14 rounded-xl bg-primary/10 flex items-center justify-center">
                    <User className="h-7 w-7 text-primary" />
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">{detailStudent.studentName}</p>
                    <p className="text-sm text-muted-foreground font-mono">{detailStudent.registerNumber}</p>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Coffee className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold text-foreground">{detailStudent.breakfastCount}</p>
                    <p className="text-xs text-muted-foreground">Breakfast</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Sun className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold text-foreground">{detailStudent.lunchCount}</p>
                    <p className="text-xs text-muted-foreground">Lunch</p>
                  </div>
                  <div className="p-3 rounded-lg bg-muted/50 text-center">
                    <Moon className="h-4 w-4 mx-auto text-muted-foreground mb-1" />
                    <p className="text-lg font-bold text-foreground">{detailStudent.dinnerCount}</p>
                    <p className="text-xs text-muted-foreground">Dinner</p>
                  </div>
                </div>

                <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">Total Payable</span>
                    <span className="text-xl font-bold font-mono text-primary">
                      {"Rs."}{detailStudent.totalAmount.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                {detailStudent.lastPaymentDate && (
                  <p className="text-xs text-muted-foreground">
                    Last payment: {new Date(detailStudent.lastPaymentDate).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                  </p>
                )}
              </div>
              <DialogFooter className="gap-2 sm:gap-0">
                <Button variant="outline" onClick={() => setDetailStudent(null)}>Close</Button>
                <Button
                  className={`gap-2 ${detailStudent.paymentStatus === "Paid" ? "" : "bg-success text-success-foreground hover:bg-success/90"}`}
                  onClick={() => togglePaymentStatus(detailStudent.studentId)}
                >
                  <IndianRupee className="h-4 w-4" />
                  {detailStudent.paymentStatus === "Paid" ? "Mark as Unpaid" : "Mark as Paid"}
                </Button>
              </DialogFooter>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}
