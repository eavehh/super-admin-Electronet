export const API_CONFIG = {
  // API Base URL через nginx (порт 80)
  // ВАЖНО: Указывайте URL через nginx, НЕ напрямую на порт backend (не :8081)!
  // Формат: http://YOUR_SERVER_IP/api (без порта, так как nginx на порту 80)
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://YOUR_SERVER_IP/api",
} as const

export type ApiConfig = typeof API_CONFIG
