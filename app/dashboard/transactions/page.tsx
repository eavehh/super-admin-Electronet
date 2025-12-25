"use client"

import { useState, useEffect } from "react"
import { useAuth } from "@/components/auth-provider"
import { apiClient } from "@/lib/api-client"
import { Download, Search } from "lucide-react"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import type { Transaction } from "@/lib/types"
import type { Transaction as ApiTransaction } from "@/lib/api-client"

export default function TransactionsPage() {
  const { accessToken } = useAuth()
  const [transactions, setTransactions] = useState<(Transaction | ApiTransaction)[]>([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState("")

  useEffect(() => {
    const loadTransactions = async () => {
      if (!accessToken) {
        setLoading(false)
        return
      }

      try {
        const response = await apiClient.transactions.getAll({ limit: 100 })
        if (response.success && response.data) {
          setTransactions(response.data)
        }
      } catch (error) {
        console.error("Failed to load transactions:", error)
      } finally {
        setLoading(false)
      }
    }

    loadTransactions()
  }, [accessToken])

  const filteredTransactions = transactions.filter(
    (tx) => {
      const stationId = (tx as any).stationId || (tx as any).chargePointId || '';
      const idTag = (tx as any).idTag || '';
      return stationId.toLowerCase().includes(search.toLowerCase()) ||
        idTag?.toLowerCase().includes(search.toLowerCase());
    }
  )

  const handleExport = () => {
    const csv = [
      ["Transaction ID", "Station", "ID Tag", "Start Time", "End Time", "Energy (kWh)", "Cost", "Status"],
      ...filteredTransactions.map((tx) => {
        const txId = (tx as any).transactionId || (tx as any).id || '';
        const stationId = (tx as any).stationId || (tx as any).chargePointId || '';
        const idTag = (tx as any).idTag || '';
        const startTime = (tx as any).startTime || '';
        const stopTime = (tx as any).stopTime || null;
        const energy = (tx as any).energyConsumed || (tx as any).totalKWh || 0;
        const cost = (tx as any).cost?.totalCost || (tx as any).cost || 0;
        const status = (tx as any).status || (stopTime ? 'completed' : 'in_progress');
        return [
          txId,
          stationId,
          idTag || "N/A",
          startTime ? new Date(startTime).toLocaleString() : "N/A",
          stopTime ? new Date(stopTime).toLocaleString() : "In Progress",
          energy,
          cost,
          status,
        ];
      }),
    ]
      .map((row) => row.join(","))
      .join("\n")

    const blob = new Blob([csv], { type: "text/csv" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = "transactions.csv"
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="flex items-center gap-2 text-muted-foreground">
          <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
          Loading transactions...
        </div>
      </div>
    )
  }

  if (!accessToken) {
    return (
      <div className="flex items-center justify-center h-full">
        <p className="text-muted-foreground">Please log in to view transactions</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-semibold tracking-tight">Transactions</h1>
        <Button variant="outline" onClick={handleExport} disabled={transactions.length === 0}>
          <Download className="h-4 w-4 mr-2" />
          Export
        </Button>
      </div>

      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
        </div>
      </Card>

      <Card>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b">
              <tr className="text-sm text-muted-foreground">
                <th className="text-left p-4 font-medium">Station</th>
                <th className="text-left p-4 font-medium">ID Tag</th>
                <th className="text-left p-4 font-medium">Start Time</th>
                <th className="text-left p-4 font-medium">End Time</th>
                <th className="text-left p-4 font-medium">Energy (kWh)</th>
                <th className="text-left p-4 font-medium">Cost</th>
                <th className="text-left p-4 font-medium">Status</th>
              </tr>
            </thead>
            <tbody>
              {filteredTransactions.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No transactions found
                  </td>
                </tr>
              ) : (
                filteredTransactions.map((tx) => {
                  const txId = (tx as any).transactionId || (tx as any).id || '';
                  const stationId = (tx as any).stationId || (tx as any).chargePointId || '';
                  const idTag = (tx as any).idTag || '';
                  const startTime = (tx as any).startTime || '';
                  const stopTime = (tx as any).stopTime || null;
                  const energy = (tx as any).energyConsumed || (tx as any).totalKWh || 0;
                  const cost = (tx as any).cost?.totalCost || (tx as any).cost || 0;
                  const status = (tx as any).status || (stopTime ? 'completed' : 'in_progress');
                  return (
                    <tr key={txId} className="border-b hover:bg-muted/50">
                      <td className="p-4 font-medium">{stationId}</td>
                      <td className="p-4 text-sm">{idTag || "N/A"}</td>
                      <td className="p-4 text-sm">{startTime ? new Date(startTime).toLocaleString() : "N/A"}</td>
                      <td className="p-4 text-sm">
                        {stopTime ? new Date(stopTime).toLocaleString() : "In Progress"}
                      </td>
                      <td className="p-4 text-sm">{typeof energy === 'number' ? energy.toFixed(1) : energy}</td>
                      <td className="p-4 text-sm">${(typeof cost === 'number' ? cost : 0).toFixed(2)}</td>
                      <td className="p-4">
                        <Badge
                          variant={
                            status === "in_progress"
                              ? "default"
                              : status === "completed"
                                ? "secondary"
                                : "destructive"
                          }
                        >
                          {status}
                        </Badge>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </Card>

      <div className="text-sm text-muted-foreground">
        Showing {filteredTransactions.length} of {transactions.length} transactions
      </div>
    </div>
  )
}
