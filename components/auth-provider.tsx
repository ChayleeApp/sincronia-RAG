"use client"

import { type ReactNode, useState, useEffect } from "react"
import { AuthContext } from "@/lib/auth-context"
import { apiClient } from "@/lib/api-client"

// Função para validar se o token JWT está expirado
function isTokenExpired(token: string): boolean {
  try {
    const payload = JSON.parse(atob(token.split('.')[1]))
    const exp = payload.exp
    
    if (!exp) return true
    
    // Verifica se o token expira em menos de 30 segundos (margem de segurança)
    const now = Math.floor(Date.now() / 1000)
    return exp < (now + 30)
  } catch (err) {
    console.error("Erro ao validar token:", err)
    return true
  }
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [token, setToken] = useState<string | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Timeout fallback to ensure loading state is resolved even if localStorage fails
    const timeout = setTimeout(() => {
      setIsLoading(false)
    }, 1000)

    try {
      const storedToken = localStorage.getItem("api_token")
      if (storedToken) {
        // Valida se o token está expirado antes de usar
        if (isTokenExpired(storedToken)) {
          console.log("Token expirado, limpando storage")
          localStorage.removeItem("api_token")
          localStorage.removeItem("username")
          document.cookie = "api_token=; path=/; max-age=0"
          apiClient.clearToken()
        } else {
          setToken(storedToken)
          apiClient.setToken(storedToken)
        }
      }
    } catch (err) {
      console.error("Failed to access localStorage:", err)
    } finally {
      clearTimeout(timeout)
      setIsLoading(false)
    }
  }, [])

  const login = async (username: string, password: string) => {
    setIsLoading(true)
    setError(null)
    try {
      const response = await apiClient.login(username, password)
      setToken(response.access_token)
      localStorage.setItem("api_token", response.access_token)
      document.cookie = `api_token=${response.access_token}; path=/; max-age=${7 * 24 * 60 * 60}`
      apiClient.setToken(response.access_token)
    } catch (err) {
      const message = err instanceof Error ? err.message : "Erro ao fazer login"
      setError(message)
      throw err
    } finally {
      setIsLoading(false)
    }
  }

  const logout = () => {
    setToken(null)
    localStorage.removeItem("api_token")
    document.cookie = "api_token=; path=/; max-age=0"
    apiClient.clearToken()
  }

  return <AuthContext.Provider value={{ token, isLoading, error, login, logout }}>{children}</AuthContext.Provider>
}
