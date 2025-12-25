"use client"

import type React from "react"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { apiClient } from "@/lib/api-client"
import Link from "next/link"
import { useAuth } from "@/components/auth-provider"

export default function LoginPage() {
  const router = useRouter()
  const { login: setAuth } = useAuth()
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState("")

  async function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setIsLoading(true)
    setError("")

    const formData = new FormData(e.currentTarget)
    const email = formData.get("email") as string
    const password = formData.get("password") as string

    try {
      const result = await apiClient.auth.login(email, password)

      if (result.success && result.data) {
        // Преобразуем формат пользователя для совместимости
        const user = result.data.user;
        const tokens = result.data.tokens || { accessToken: result.data.accessToken, refreshToken: result.data.refreshToken };
        setAuth(user, tokens.accessToken, tokens.refreshToken);
        router.push("/dashboard")
      } else {
        setError(result.error || "Invalid credentials")
      }
    } catch (err: any) {
      setError(err.message || "Invalid credentials")
    } finally {
      setIsLoading(false)
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1">
          <div className="flex items-center gap-2">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <CardTitle className="text-2xl">CSMS Panel</CardTitle>
          </div>
          <CardDescription>Sign in to your super admin account</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                required
                disabled={isLoading}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Password</Label>
              <Input id="password" name="password" type="password" required disabled={isLoading} />
            </div>

            {error && (
              <div className="rounded-lg border border-red-500/20 bg-red-500/10 p-3 text-sm text-red-500">{error}</div>
            )}

            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? "Signing in..." : "Sign In"}
            </Button>

            <div className="text-center text-sm text-muted-foreground">
              Don't have an account?{" "}
              <Link href="/register" className="text-teal-500 hover:underline">
                Create account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
