"use client"

import { createContext, useContext, useState, useEffect, type ReactNode } from "react"
import { useRouter } from "next/navigation"
import type { User } from "@/lib/types"
import { User as ApiUser } from "@/lib/api-client"

interface AuthContextType {
  user: User | ApiUser | null
  accessToken: string | null
  isLoading: boolean
  login: (user: User | ApiUser, accessToken: string, refreshToken: string) => void
  logout: () => void
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | ApiUser | null>(null)
  const [accessToken, setAccessToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const router = useRouter()

  useEffect(() => {
    // Load auth from localStorage on mount
    const storedUser = localStorage.getItem("user")
    const storedToken = localStorage.getItem("accessToken")

    if (storedUser && storedToken) {
      setUser(JSON.parse(storedUser))
      setAccessToken(storedToken)
    }
    setIsLoading(false)
  }, [])

  const login = (user: User | ApiUser, accessToken: string, refreshToken: string) => {
    setUser(user)
    setAccessToken(accessToken)
    localStorage.setItem("user", JSON.stringify(user))
    localStorage.setItem("accessToken", accessToken)
    localStorage.setItem("refreshToken", refreshToken)
  }

  const logout = () => {
    setUser(null)
    setAccessToken(null)
    localStorage.removeItem("user")
    localStorage.removeItem("accessToken")
    localStorage.removeItem("refreshToken")
    router.push("/login")
  }

  return <AuthContext.Provider value={{ user, accessToken, isLoading, login, logout }}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}
