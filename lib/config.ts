export const API_CONFIG = {
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://localhost:8081",
} as const

export type ApiConfig = typeof API_CONFIG
