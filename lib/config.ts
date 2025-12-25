export const API_CONFIG = {
  // Используем NEXT_PUBLIC_API_URL из env (устанавливается через nginx)
  // Default: через nginx на порту 80 (замените YOUR_SERVER_IP на IP вашего сервера)
  baseUrl: process.env.NEXT_PUBLIC_API_URL || "http://YOUR_SERVER_IP/api",
} as const

export type ApiConfig = typeof API_CONFIG
