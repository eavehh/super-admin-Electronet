import { API_CONFIG } from "./config"
import { getAccessToken } from "./auth"

// WebSocket URL - использует тот же домен что и API (через nginx)
// Если API_URL = http://domain/api, то WS_URL = ws://domain/ws
const getWsUrl = () => {
  // Используем NEXT_PUBLIC_API_URL и заменяем /api на /ws
  const apiUrl = process.env.NEXT_PUBLIC_API_URL || API_CONFIG.baseUrl || 'http://localhost/api';
  // Преобразуем http://domain/api -> ws://domain/ws
  // Убираем /api в конце, добавляем /ws, меняем протокол
  const baseUrl = apiUrl.replace(/\/api\/?$/, ''); // Убираем /api
  const wsUrl = baseUrl.replace('http://', 'ws://').replace('https://', 'wss://') + '/ws';
  return wsUrl;
}

export type StationStatus = {
  stationId: string
  status: "Available" | "Occupied" | "Faulted" | "Unavailable"
  connectors: Array<{
    connectorId: number
    status: string
    currentPower?: number
  }>
  timestamp: string
}

export class WebSocketClient {
  private ws: WebSocket | null = null
  private listeners: Map<string, Set<(data: any) => void>> = new Map()
  private reconnectTimeout: NodeJS.Timeout | null = null
  private isConnecting = false

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.isConnecting) {
      return
    }

    this.isConnecting = true
    const token = getAccessToken()

    if (!token) {
      console.warn("No auth token, skipping WebSocket connection")
      this.isConnecting = false
      return
    }

    try {
      // getWsUrl() уже возвращает правильный ws://domain/ws (без /ws в конце)
      // Поэтому просто добавляем query параметры
      const wsBaseUrl = getWsUrl();
      const wsUrl = `${wsBaseUrl}?token=${token}`;
      this.ws = new WebSocket(wsUrl)

      this.ws.onopen = () => {
        console.log("WebSocket connected")
        this.isConnecting = false
      }

      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data)
          this.emit(data.type, data.payload)
        } catch (error) {
          console.error("Failed to parse WebSocket message:", error)
        }
      }

      this.ws.onerror = (error) => {
        console.error("WebSocket error:", error)
        this.isConnecting = false
      }

      this.ws.onclose = () => {
        console.log("WebSocket disconnected")
        this.isConnecting = false
        this.ws = null

        // Reconnect after 5 seconds
        this.reconnectTimeout = setTimeout(() => {
          this.connect()
        }, 5000)
      }
    } catch (error) {
      console.error("Failed to create WebSocket:", error)
      this.isConnecting = false
    }
  }

  disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout)
      this.reconnectTimeout = null
    }

    if (this.ws) {
      this.ws.close()
      this.ws = null
    }

    this.listeners.clear()
  }

  on(event: string, callback: (data: any) => void) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set())
    }
    this.listeners.get(event)!.add(callback)
  }

  off(event: string, callback: (data: any) => void) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.delete(callback)
    }
  }

  private emit(event: string, data: any) {
    const listeners = this.listeners.get(event)
    if (listeners) {
      listeners.forEach((callback) => callback(data))
    }
  }

  send(event: string, data: any) {
    if (this.ws?.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify({ type: event, payload: data }))
    }
  }
}

export const wsClient = new WebSocketClient()
