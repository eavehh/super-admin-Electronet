"use client"

import React, { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { wsClient } from "@/lib/websocket-client"
import { Search, Download, MoreVertical, Zap, PlayCircle, StopCircle, ChevronDown, ChevronRight } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu"
import { Badge } from "@/components/ui/badge"
import { useToast } from "@/hooks/use-toast"
import type { Station, ConnectorStatus } from "@/lib/types"

export default function StationsPage() {
  const { accessToken } = useAuth()
  const { toast } = useToast()
  const [stations, setStations] = useState<Station[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")
  const [siteFilter, setSiteFilter] = useState("")
  const [expandedStations, setExpandedStations] = useState<Set<string>>(new Set())
  const [processingActions, setProcessingActions] = useState<Set<string>>(new Set()) // Track ongoing actions

  useEffect(() => {
    const loadStations = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const response = await apiClient.stations.getAll({ limit: 100 })
        if (response.success && response.data) {
          // Преобразуем формат ответа
          const stationsData = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
          setStations(stationsData)
        } else {
          toast({
            title: "Error loading stations",
            description: response.error || "Failed to load stations",
            variant: "destructive",
          })
        }
      } catch (error: any) {
        console.error("Failed to load stations:", error)
        toast({
          title: "Error loading stations",
          description: error.message,
          variant: "destructive",
        })
      } finally {
        setLoading(false)
      }
    }

    loadStations()
  }, [accessToken, toast])

  useEffect(() => {
    if (!accessToken) return

    wsClient.connect()

    const handleStatusUpdate = (data: any) => {
      console.log("[StationsPage] WebSocket status update received:", data)
      setStations((prev) =>
        prev.map((station) =>
          station.stationId === data.stationId
            ? {
                ...station,
                isConnected: data.isConnected ?? station.isConnected,
                connectors: data.connectors || station.connectors,
                status: data.status || station.status,
              }
            : station,
        ),
      )
    }

    // Listen for various WebSocket events
    wsClient.on("station_status", handleStatusUpdate)
    wsClient.on("connector_status", handleStatusUpdate)
    wsClient.on("status_update", handleStatusUpdate)

    // Also set up periodic refresh as fallback (every 5 seconds)
    const refreshInterval = setInterval(async () => {
      try {
        const response = await apiClient.stations.getAll({ limit: 100 })
        if (response.success && response.data) {
          const stationsData = Array.isArray(response.data) ? response.data : (response.data as any).data || [];
          setStations(stationsData)
        }
      } catch (error) {
        console.error("Failed to refresh stations:", error)
      }
    }, 5000)

    return () => {
      wsClient.off("station_status", handleStatusUpdate)
      wsClient.off("connector_status", handleStatusUpdate)
      wsClient.off("status_update", handleStatusUpdate)
      clearInterval(refreshInterval)
    }
  }, [accessToken])

  const filteredStations = stations.filter((station) => {
    const matchesSearch = station.displayName.toLowerCase().includes(search.toLowerCase())
    const matchesSite = !siteFilter || station.siteId === siteFilter
    return matchesSearch && matchesSite
  })

  const handleExport = () => {
    const csv = [
      ["Station ID", "Display Name", "Site", "Status", "Connectors", "Power"],
      ...filteredStations.map((s) => [
        s.stationId,
        s.displayName,
        s.siteId,
        s.isConnected ? "Connected" : "Disconnected",
        s.connectors.length,
        s.connectors.reduce((sum, c) => sum + (c.currentPower || 0), 0) / 1000,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "stations.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  const toggleStationExpanded = (stationId: string) => {
    setExpandedStations((prev) => {
      const newSet = new Set(prev)
      if (newSet.has(stationId)) {
        newSet.delete(stationId)
      } else {
        newSet.add(stationId)
      }
      return newSet
    })
  }

  const getConnectorStatusBadge = (status: ConnectorStatus | string) => {
    const statusStr = String(status)
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      Available: "default",
      Occupied: "secondary",
      Charging: "secondary",
      Preparing: "secondary", // Preparing status
      Finishing: "secondary", // Finishing status
      Faulted: "destructive",
      Unavailable: "outline",
      Reserved: "outline",
    }
    return variants[statusStr] || "outline"
  }

  const handleRemoteStart = async (stationId: string, connectorId: number) => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }

    const actionKey = `${stationId}-${connectorId}-start`
    if (processingActions.has(actionKey)) {
      return // Already processing
    }

    setProcessingActions((prev) => new Set(prev).add(actionKey))

    try {
      const response = await apiClient.stations.remoteControl(stationId, "RemoteStartTransaction", {
        connectorId,
        idTag: "ADMIN",
      })

      if (response.success) {
        toast({
          title: "Success",
          description: `Remote start initiated for ${stationId} connector ${connectorId}`,
        })
        // Refresh stations to get updated status
        setTimeout(async () => {
          const refreshResponse = await apiClient.stations.getAll({ limit: 100 })
          if (refreshResponse.success && refreshResponse.data) {
            const stationsData = Array.isArray(refreshResponse.data) ? refreshResponse.data : (refreshResponse.data as any).data || [];
            setStations(stationsData)
          }
        }, 1000)
      } else {
        toast({
          title: "Error",
          description: response.error || "Failed to start charging",
          variant: "destructive",
        })
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to start charging",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setProcessingActions((prev) => {
          const newSet = new Set(prev)
          newSet.delete(actionKey)
          return newSet
        })
      }, 2000)
    }
  }

  const handleRemoteStop = async (stationId: string, connectorId: number, transactionId?: string) => {
    if (!accessToken) {
      toast({
        title: "Error",
        description: "Not authenticated",
        variant: "destructive",
      });
      return;
    }

    const actionKey = `${stationId}-${connectorId}-stop`
    if (processingActions.has(actionKey)) {
      return // Already processing
    }

    if (!transactionId) {
      toast({
        title: "Error",
        description: "No active transaction found for this connector",
        variant: "destructive",
      })
      return
    }

    setProcessingActions((prev) => new Set(prev).add(actionKey))

    try {
      // Extract numeric part if transactionId is in format "TXN-..." or full UUID
      let txIdToSend = transactionId
      if (transactionId.startsWith("TXN-")) {
        // Keep full UUID format for backend
        txIdToSend = transactionId
      } else if (/^\d+$/.test(transactionId)) {
        // Already numeric, use as is
        txIdToSend = transactionId
      }

      console.log(`[handleRemoteStop] Sending stop for ${stationId}:${connectorId}, transactionId: ${txIdToSend} (original: ${transactionId})`)

      const response = await apiClient.stations.remoteControl(stationId, "RemoteStopTransaction", {
        connectorId,
        transactionId: txIdToSend,
      })

      if (response.success) {
        toast({
          title: "Success",
          description: `Remote stop initiated for ${stationId} connector ${connectorId}`,
        })
        // Refresh stations to get updated status
        setTimeout(async () => {
          const refreshResponse = await apiClient.stations.getAll({ limit: 100 })
          if (refreshResponse.success && refreshResponse.data) {
            const stationsData = Array.isArray(refreshResponse.data) ? refreshResponse.data : (refreshResponse.data as any).data || [];
            setStations(stationsData)
          }
        }, 1000)
      } else {
        // Check if it's a rejected response
        const errorMsg = response.error || "Failed to stop charging"
        if (errorMsg.includes("Rejected") || response.data?.status === "rejected") {
          toast({
            title: "Stop Rejected",
            description: `Station rejected stop command. Transaction may have already ended or connector is not charging. Connector: ${connectorId}`,
            variant: "destructive",
          })
        } else {
          toast({
            title: "Error",
            description: errorMsg,
            variant: "destructive",
          })
        }
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to stop charging",
        variant: "destructive",
      })
    } finally {
      setTimeout(() => {
        setProcessingActions((prev) => {
          const newSet = new Set(prev)
          newSet.delete(actionKey)
          return newSet
        })
      }, 2000)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading stations...
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to view stations</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Charging Stations</h1>
        <Button variant="outline" onClick={handleExport} disabled={stations.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      {/* Filters */}
      <Card className="p-4">
        <div className="flex gap-4">
          <div className="flex-1 relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search stations..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <select
            className="px-3 py-2 rounded-md border bg-background"
            value={siteFilter}
            onChange={(e) => setSiteFilter(e.target.value)}
          >
            <option value="">All Sites</option>
            {Array.from(new Set(stations.map((s) => s.siteId))).map((site) => (
              <option key={site} value={site}>
                {site}
              </option>
            ))}
          </select>
        </div>
      </Card>

      {/* Stations Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-sm text-muted-foreground">
                <th className="text-left p-4 font-medium w-8"></th>
                <th className="text-left p-4 font-medium">Name</th>
                <th className="text-left p-4 font-medium">Site</th>
                <th className="text-left p-4 font-medium">Status</th>
                <th className="text-left p-4 font-medium">Connectors</th>
                <th className="text-left p-4 font-medium">Power</th>
                <th className="text-left p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredStations.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No stations found
                  </td>
                </tr>
              ) : (
                filteredStations.map((station) => {
                  const totalPower = station.connectors.reduce((sum, c) => sum + (c.currentPower || 0), 0) / 1000
                  const isExpanded = expandedStations.has(station.stationId)
                  return (
                    <React.Fragment key={station.stationId}>
                      <tr 
                        className="border-b hover:bg-muted/50 cursor-pointer"
                        onClick={() => toggleStationExpanded(station.stationId)}
                      >
                        <td className="p-4">
                          {isExpanded ? (
                            <ChevronDown className="h-4 w-4 text-muted-foreground" />
                          ) : (
                            <ChevronRight className="h-4 w-4 text-muted-foreground" />
                          )}
                        </td>
                        <td className="p-4">
                          <div className="flex items-center gap-2">
                            <Zap className="h-4 w-4 text-muted-foreground" />
                            <span className="font-medium">{station.displayName}</span>
                          </div>
                        </td>
                        <td className="p-4 text-sm">{station.siteId || "Unknown"}</td>
                        <td className="p-4">
                          <Badge variant={station.isConnected ? "default" : "destructive"}>
                            {station.isConnected ? "Connected" : "Disconnected"}
                          </Badge>
                        </td>
                        <td className="p-4 text-sm">{station.connectors.length}</td>
                        <td className="p-4 text-sm">{totalPower.toFixed(1)} kW</td>
                        <td className="p-4" onClick={(e) => e.stopPropagation()}>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => toggleStationExpanded(station.stationId)}>
                                {isExpanded ? "Hide Connectors" : "Show Connectors"}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </td>
                      </tr>
                      {isExpanded && station.connectors.map((connector) => (
                        <tr 
                          key={`${station.stationId}-${connector.connectorId}`}
                          className="border-b bg-muted/20 hover:bg-muted/40"
                        >
                          <td></td>
                          <td className="p-4 pl-12">
                            <div className="flex items-center gap-2">
                              <span className="text-sm text-muted-foreground">Connector {connector.connectorId}</span>
                              {connector.type && (
                                <Badge variant="outline" className="text-xs">
                                  {connector.type}
                                </Badge>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm text-muted-foreground">
                            {connector.maxPower ? `${(connector.maxPower / 1000).toFixed(1)} kW max` : "-"}
                          </td>
                          <td className="p-4">
                            <div className="flex flex-col gap-1">
                              <Badge variant={getConnectorStatusBadge(connector.status)}>
                                {String(connector.status)}
                              </Badge>
                              {String(connector.status) === "Preparing" && connector.activeTransactionId && (
                                <div className="text-xs text-amber-500 mt-1">
                                  ⚠️ Stuck in Preparing state
                                </div>
                              )}
                              {connector.errorCode && connector.errorCode !== "NoError" && (
                                <div className="text-xs text-destructive mt-1">
                                  Error: {connector.errorCode}
                                </div>
                              )}
                            </div>
                          </td>
                          <td className="p-4 text-sm">
                            {connector.currentPower ? `${(connector.currentPower / 1000).toFixed(1)} kW` : "0.0 kW"}
                          </td>
                          <td className="p-4 text-sm">
                            {connector.activeTransactionId ? (
                              <span className="text-muted-foreground">Tx: {connector.activeTransactionId}</span>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </td>
                          <td className="p-4" onClick={(e) => e.stopPropagation()}>
                            <div className="flex items-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoteStart(station.stationId, connector.connectorId)}
                                disabled={
                                  (String(connector.status) === "Charging" || 
                                   String(connector.status) === "Occupied" ||
                                   String(connector.status) === "Preparing" ||
                                   String(connector.status) === "Finishing") || 
                                  !station.isConnected ||
                                  processingActions.has(`${station.stationId}-${connector.connectorId}-start`)
                                }
                                className="h-8"
                              >
                                <PlayCircle className="h-3 w-3 mr-1" />
                                {processingActions.has(`${station.stationId}-${connector.connectorId}-start`) ? "Starting..." : "Start"}
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoteStop(station.stationId, connector.connectorId, connector.activeTransactionId || undefined)}
                                disabled={
                                  (String(connector.status) !== "Charging" && 
                                   String(connector.status) !== "Occupied" &&
                                   String(connector.status) !== "Preparing") || 
                                  !station.isConnected ||
                                  !connector.activeTransactionId ||
                                  processingActions.has(`${station.stationId}-${connector.connectorId}-stop`)
                                }
                                className="h-8"
                              >
                                <StopCircle className="h-3 w-3 mr-1" />
                                {processingActions.has(`${station.stationId}-${connector.connectorId}-stop`) ? "Stopping..." : "Stop"}
                              </Button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </React.Fragment>
                  )
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredStations.length} of {stations.length} stations
      </div>
    </div>
  )
}
