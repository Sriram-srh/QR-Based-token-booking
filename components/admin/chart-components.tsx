'use client'

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area,
  LineChart,
  Line,
} from 'recharts'

export function MealParticipationChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <BarChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="day" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Legend />
        <Bar dataKey="breakfast" fill="hsl(var(--chart-3))" radius={[4, 4, 0, 0]} name="Breakfast" />
        <Bar dataKey="lunch" fill="hsl(var(--chart-1))" radius={[4, 4, 0, 0]} name="Lunch" />
        <Bar dataKey="dinner" fill="hsl(var(--chart-5))" radius={[4, 4, 0, 0]} name="Dinner" />
      </BarChart>
    </ResponsiveContainer>
  )
}

export function TokenStatusChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <PieChart>
        <Pie
          data={data}
          cx="50%"
          cy="50%"
          innerRadius={60}
          outerRadius={100}
          paddingAngle={4}
          dataKey="value"
          label={({ name, percent }: any) => `${name} ${(percent * 100).toFixed(0)}%`}
        >
          {data.map((entry: any, index: number) => (
            <Cell key={`cell-${index}`} fill={entry.fill} />
          ))}
        </Pie>
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--card-foreground))",
          }}
        />
      </PieChart>
    </ResponsiveContainer>
  )
}

export function RevenueChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <LineChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="month" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} tickFormatter={(val: number) => `${(val / 1000).toFixed(0)}k`} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--card-foreground))",
          }}
          formatter={(value: number) => [`Rs.${value.toLocaleString("en-IN")}`, "Revenue"]}
        />
        <Line
          type="monotone"
          dataKey="revenue"
          stroke="hsl(var(--accent))"
          strokeWidth={3}
          dot={{ fill: "hsl(var(--accent))", strokeWidth: 2 }}
          name="Revenue"
        />
      </LineChart>
    </ResponsiveContainer>
  )
}

export function PeakServingChart({ data }: { data: any }) {
  return (
    <ResponsiveContainer width="100%" height="100%">
      <AreaChart data={data}>
        <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
        <XAxis dataKey="time" stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <YAxis stroke="hsl(var(--muted-foreground))" fontSize={12} />
        <Tooltip
          contentStyle={{
            backgroundColor: "hsl(var(--card))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
            color: "hsl(var(--card-foreground))",
          }}
        />
        <Area
          type="monotone"
          dataKey="count"
          stroke="hsl(var(--primary))"
          fill="hsl(var(--primary) / 0.15)"
          strokeWidth={2}
          name="Students Served"
        />
      </AreaChart>
    </ResponsiveContainer>
  )
}
