"use client"

import { useEffect, useState } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { Activity, Zap, TrendingUp, DollarSign } from "lucide-react"
import { Card } from "@/components/ui/card"
import type { DashboardStats } from "@/lib/types"

export default function DashboardPage() {
  const { user, accessToken } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const loadStats = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const response = await apiClient.analytics.getDashboard()
        if (response.success && response.data) {
          setStats(response.data)
        }
      } catch (err: any) {
        console.error("Failed to load dashboard stats:", err)
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }

    loadStats()
  }, [accessToken])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading dashboard...
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to view dashboard</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="text-center">
          <p className="text-destructive font-medium">Failed to load dashboard</p>
          <p className="text-sm text-muted-foreground mt-1">{error}</p>
        </div>
      </div>
    )
  }

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">No data available</p>
      </div>
    )
  }

  const global = stats.global

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-semibold tracking-tight">Dashboard</h1>
        <p className="text-muted-foreground mt-1">Welcome back, {user?.name || "Admin"}</p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Stations</p>
              <p className="text-2xl font-semibold mt-1">{global.activeStations}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center">
              <Zap className="h-6 w-6 text-blue-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-emerald-500">Online</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Active Sessions</p>
              <p className="text-2xl font-semibold mt-1">{global.activeSessions}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-emerald-500/10 flex items-center justify-center">
              <Activity className="h-6 w-6 text-emerald-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">Currently charging</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Energy</p>
              <p className="text-2xl font-semibold mt-1">{(global.totalEnergyKwh / 1000).toFixed(1)} MWh</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-cyan-500/10 flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-cyan-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">All time</div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Total Revenue</p>
              <p className="text-2xl font-semibold mt-1">${global.totalRevenue.toLocaleString()}</p>
            </div>
            <div className="h-12 w-12 rounded-full bg-purple-500/10 flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-purple-500" />
            </div>
          </div>
          <div className="mt-4 flex items-center text-xs text-muted-foreground">All time</div>
        </Card>
      </div>

      {/* Top Stations */}
      {stats.topStations && stats.topStations.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold mb-4">Top Performing Stations</h3>
          <div className="space-y-3">
            {stats.topStations.map((station) => (
              <div key={station.stationId} className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium">{station.displayName}</p>
                  <p className="text-xs text-muted-foreground">
                    {station.sessions} sessions · {station.energyKwh.toFixed(0)} kWh
                  </p>
                </div>
                <p className="text-sm font-medium">${station.revenue.toFixed(2)}</p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Stats Grid */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card className="p-6">
          <h3 className="font-semibold mb-4">System Overview</h3>
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Sessions</span>
              <span className="text-sm font-medium">{global.totalSessions.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Total Users</span>
              <span className="text-sm font-medium">{global.totalUsers.toLocaleString()}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Active Charging</span>
              <span className="text-sm font-medium">{global.activeSessions}</span>
            </div>
          </div>
        </Card>

        <Card className="p-6">
          <h3 className="font-semibold mb-4">Recent Activity</h3>
          <div className="space-y-3 text-sm">
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-emerald-500 mt-2" />
              <div>
                <p className="font-medium">System operational</p>
                <p className="text-xs text-muted-foreground">{global.activeStations} stations online</p>
              </div>
            </div>
            <div className="flex items-start gap-3">
              <div className="h-2 w-2 rounded-full bg-blue-500 mt-2" />
              <div>
                <p className="font-medium">{global.activeSessions} active sessions</p>
                <p className="text-xs text-muted-foreground">Currently charging</p>
              </div>
            </div>
          </div>
        </Card>
      </div>
    </div>
  )
}
