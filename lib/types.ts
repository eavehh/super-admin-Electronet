export interface ApiResponse<T> {
  success: boolean
  data?: T
  error?: string
}

export interface User {
  userId: string
  email: string
  name: string
  role: string
  phone?: string
  siteId?: string
}

export interface Station {
  stationId: string
  displayName: string
  siteId: string
  isConnected: boolean
  lastHeartbeat?: string
  connectors: Connector[]
  location?: {
    latitude: number
    longitude: number
    address: string
  }
  maintenanceMode?: boolean
  firmware?: {
    version: string
    updateStatus?: string
  }
}

export interface Connector {
  connectorId: number
  status: ConnectorStatus
  errorCode?: string
  info?: string
  vendorErrorCode?: string
  currentPower?: number
  maxPower?: number
  type?: string
  activeTransactionId?: string | null
}

export type ConnectorStatus = "Available" | "Occupied" | "Faulted" | "Unavailable" | "Reserved" | "Charging" | "Preparing" | "Finishing"

export interface Transaction {
  transactionId: string
  stationId: string
  connectorId: number
  userId?: string
  idTag?: string
  startTime: string
  stopTime?: string
  meterStart: number
  meterStop?: number
  energyConsumed: number
  status: TransactionStatus
  cost?: {
    totalCost: number
    currency: string
  }
  stopReason?: string
}

export type TransactionStatus = "in_progress" | "completed" | "failed"

export interface Site {
  siteId: string
  name: string
  address: string
  location?: {
    latitude: number
    longitude: number
  }
  stats?: {
    totalStations: number
    connectedStations: number
    activeTransactions: number
  }
}

export interface DashboardStats {
  global: {
    totalSessions: number
    totalEnergyKwh: number
    totalRevenue: number
    activeSessions: number
    activeStations: number
    totalUsers: number
  }
  topStations?: Array<{
    stationId: string
    displayName: string
    sessions: number
    energyKwh: number
    revenue: number
  }>
}

export interface TrendsData {
  period: string
  data: Array<{
    timestamp: string
    sessions: number
    energy: number
    revenue: number
  }>
}
