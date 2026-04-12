"use client"

import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import { Input } from "@/components/ui/input"
import {
  Bell,
  Shield,
  Clock,
  Smartphone,
  Mail,
  Database,
} from "lucide-react"

export function AdminSettings() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-foreground">Settings</h1>
        <p className="text-muted-foreground">Configure system preferences and notifications</p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        {/* Notification Settings */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
              <Bell className="h-5 w-5 text-primary" />
              Notification Preferences
            </CardTitle>
            <CardDescription>Configure alert triggers</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {[
              { label: "Token booked successfully", defaultOn: true },
              { label: "Meal quota full alert", defaultOn: true },
              { label: "Token expired notification", defaultOn: false },
              { label: "Duplicate scan attempt alert", defaultOn: true },
              { label: "Emergency override notification", defaultOn: true },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between">
                <Label className="text-sm text-foreground">{item.label}</Label>
                <Switch defaultChecked={item.defaultOn} />
              </div>
            ))}
          </CardContent>
        </Card>

        {/* Security */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
              <Shield className="h-5 w-5 text-primary" />
              Security Settings
            </CardTitle>
            <CardDescription>Access control and security</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Require PIN for manual override</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Auto-lock after inactivity (5 min)</Label>
              <Switch defaultChecked />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Two-factor authentication</Label>
              <Switch />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Admin PIN</Label>
              <Input type="password" placeholder="****" className="max-w-32 bg-background text-foreground" />
            </div>
          </CardContent>
        </Card>

        {/* Token Settings */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
              <Clock className="h-5 w-5 text-primary" />
              Token Configuration
            </CardTitle>
            <CardDescription>Default token behavior</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Max tokens per student per meal</Label>
              <Input type="number" defaultValue="3" className="max-w-24 bg-background text-foreground" />
            </div>
            <div className="space-y-2">
              <Label className="text-sm text-foreground">Token expiry buffer (minutes after meal end)</Label>
              <Input type="number" defaultValue="15" className="max-w-24 bg-background text-foreground" />
            </div>
            <div className="flex items-center justify-between">
              <Label className="text-sm text-foreground">Auto-expire unused tokens</Label>
              <Switch defaultChecked />
            </div>
          </CardContent>
        </Card>

        {/* System Info */}
        <Card className="border-border/60">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2 text-card-foreground">
              <Database className="h-5 w-5 text-primary" />
              System Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {[
              { label: "System Version", value: "1.0.0" },
              { label: "Database", value: "Connected" },
              { label: "QR Scanner API", value: "Online" },
              { label: "Last Backup", value: "Today 02:00 AM" },
              { label: "Total Students", value: "486" },
              { label: "Total Staff", value: "12" },
            ].map((item, i) => (
              <div key={i} className="flex items-center justify-between py-1">
                <span className="text-sm text-muted-foreground">{item.label}</span>
                <Badge variant="secondary" className="text-xs font-mono">
                  {item.value}
                </Badge>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button variant="chrome" className="gap-2 px-5 py-2">
          Save Settings
        </Button>
      </div>
    </div>
  )
}
