"use client"

import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import * as XLSX from "xlsx"
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
  Search,
  FileText,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Shield,
  Ticket,
  Clock,
  Download,
} from "lucide-react"
import { getAuthHeaders } from "@/lib/client-auth"

type AuditLogRow = {
  id: string
  action: string
  user: string
  role: string
  details: string
  timestamp: string
}

const actionIcons: Record<string, React.ReactNode> = {
  "Token Generated": <Ticket className="h-4 w-4 text-primary" />,
  "Token Scanned": <CheckCircle2 className="h-4 w-4 text-success" />,
  "Token Expired": <Clock className="h-4 w-4 text-muted-foreground" />,
  "Token Cancelled": <XCircle className="h-4 w-4 text-destructive" />,
  "Duplicate Scan": <AlertTriangle className="h-4 w-4 text-warning" />,
  "Manual Override": <Shield className="h-4 w-4 text-warning" />,
  "Meal Published": <FileText className="h-4 w-4 text-primary" />,
  "Quota Updated": <FileText className="h-4 w-4 text-primary" />,
}

const actionColors: Record<string, string> = {
  "Token Generated": "bg-primary/10 text-primary border-primary/20",
  "Token Scanned": "bg-success/10 text-success border-success/20",
  "Token Expired": "bg-muted text-muted-foreground border-border",
  "Token Cancelled": "bg-destructive/10 text-destructive border-destructive/20",
  "Duplicate Scan": "bg-warning/10 text-warning border-warning/20",
  "Manual Override": "bg-warning/10 text-warning border-warning/20",
  "Meal Published": "bg-primary/10 text-primary border-primary/20",
  "Quota Updated": "bg-primary/10 text-primary border-primary/20",
}

export function AuditLogs() {
  const [logs, setLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [filter, setFilter] = useState("all")

  useEffect(() => {
    const loadLogs = async () => {
      try {
        setLoading(true)
        const response = await fetch('/api/admin/audit-logs', {
          cache: 'no-store',
          headers: {
            ...getAuthHeaders(),
          },
        })
        if (!response.ok) {
          throw new Error('Failed to load audit logs')
        }
        const data = await response.json()
        setLogs(data.logs || [])
      } catch (error) {
        console.error('Error loading audit logs:', error)
      } finally {
        setLoading(false)
      }
    }

    loadLogs()
  }, [])

  const filtered = logs
    .filter(log => {
      if (filter !== "all" && log.action !== filter) return false
      if (search && !log.details.toLowerCase().includes(search.toLowerCase()) && !log.user.toLowerCase().includes(search.toLowerCase())) return false
      return true
    })
    .sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())

  const uniqueActions = useMemo(() => [...new Set(logs.map(l => l.action))], [logs])

  const handleExportExcel = () => {
    const exportRows = filtered.map((log) => ({
      Action: log.action,
      User: log.user,
      Role: log.role,
      Details: log.details,
      Timestamp: new Date(log.timestamp).toLocaleString(),
    }))

    const worksheet = XLSX.utils.json_to_sheet(exportRows)
    const workbook = XLSX.utils.book_new()
    XLSX.utils.book_append_sheet(workbook, worksheet, 'AuditLogs')
    XLSX.writeFile(workbook, `audit-logs-${new Date().toISOString().slice(0, 10)}.xlsx`)
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Audit Logs</h1>
        <p className="text-muted-foreground">Complete security and activity trail</p>
      </div>

      <div className="flex justify-end">
        <Button variant="threed" onClick={handleExportExcel} className="gap-2" disabled={loading || filtered.length === 0}>
          <Download className="h-4 w-4" />
          Export to Excel
        </Button>
      </div>

      {/* Filters */}
      <Card className="border-border/60">
        <CardContent className="p-4">
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search logs..."
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="pl-9 bg-background text-foreground"
              />
            </div>
            <Select value={filter} onValueChange={setFilter}>
              <SelectTrigger className="w-full sm:w-48 bg-background text-foreground">
                <SelectValue placeholder="Filter by action" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Actions</SelectItem>
                {uniqueActions.map(action => (
                  <SelectItem key={action} value={action}>{action}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card className="border-border/60">
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow className="border-border">
                <TableHead className="text-muted-foreground">Action</TableHead>
                <TableHead className="text-muted-foreground">User</TableHead>
                <TableHead className="hidden md:table-cell text-muted-foreground">Role</TableHead>
                <TableHead className="hidden lg:table-cell text-muted-foreground">Details</TableHead>
                <TableHead className="text-right text-muted-foreground">Time</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow className="border-border">
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground py-8">
                    Loading logs...
                  </TableCell>
                </TableRow>
              )}
              {filtered.map(log => (
                <TableRow key={log.id} className="border-border">
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {actionIcons[log.action] || <FileText className="h-4 w-4 text-muted-foreground" />}
                      <Badge variant="outline" className={`text-xs ${actionColors[log.action] || ""}`}>
                        {log.action}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-foreground">{log.user}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant="secondary" className="text-xs capitalize">
                      {log.role}
                    </Badge>
                  </TableCell>
                  <TableCell className="hidden lg:table-cell text-sm text-muted-foreground max-w-xs truncate">
                    {log.details}
                  </TableCell>
                  <TableCell className="text-right text-sm text-muted-foreground whitespace-nowrap">
                    <div>
                      {new Date(log.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}
                    </div>
                    <div className="text-xs">
                      {new Date(log.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {filtered.length === 0 && (
        <div className="text-center py-12">
          <FileText className="h-12 w-12 mx-auto text-muted-foreground/30 mb-3" />
          <h3 className="font-semibold text-foreground mb-1">No logs found</h3>
          <p className="text-sm text-muted-foreground">Try adjusting your search or filter</p>
        </div>
      )}
    </div>
  )
}
