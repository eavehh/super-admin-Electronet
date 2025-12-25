"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { MapPin, Download, Plus } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Site } from "@/lib/types"

export default function SitesPage() {
  const { accessToken } = useAuth()
  const [sites, setSites] = useState<Site[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const loadSites = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const response = await apiClient.sites.getAll()
        if (response.success && response.data) {
          setSites(response.data)
        }
      } catch (error) {
        console.error("Failed to load sites:", error)
      } finally {
        setLoading(false)
      }
    }

    loadSites()
  }, [accessToken])

  const filteredSites = sites.filter((site) => site.name.toLowerCase().includes(search.toLowerCase()))

  const handleExport = () => {
    const csv = [
      ["Site ID", "Name", "Address", "Total Stations", "Connected Stations"],
      ...filteredSites.map((s) => [
        s.siteId,
        s.name,
        s.address,
        s.stats?.totalStations || 0,
        s.stats?.connectedStations || 0,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "sites.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading sites...
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to view sites</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Sites</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={sites.length === 0}>
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            Add Site
          </Button>
        </div>
      </div>

      <Card className="p-4">
        <Input placeholder="Search sites..." value={search} onChange={(e) => setSearch(e.target.value)} />
      </Card>

      {filteredSites.length === 0 ? (
        <Card className="p-12">
          <div className="text-center text-muted-foreground">No sites found</div>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {filteredSites.map((site) => (
            <Card key={site.siteId} className="p-6 hover:shadow-lg transition-shadow cursor-pointer">
              <div className="flex items-start gap-4">
                <div className="h-12 w-12 rounded-full bg-blue-500/10 flex items-center justify-center shrink-0">
                  <MapPin className="h-6 w-6 text-blue-500" />
                </div>
                <div className="flex-1 min-w-0">
                  <h3 className="font-semibold truncate">{site.name}</h3>
                  <p className="text-sm text-muted-foreground mt-1">{site.address}</p>
                  <div className="flex items-center gap-2 mt-3">
                    <Badge variant="secondary">{site.stats?.totalStations || 0} stations</Badge>
                    <Badge variant="default">{site.stats?.connectedStations || 0} active</Badge>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}
