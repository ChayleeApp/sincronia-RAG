"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import DocumentsTab from "@/components/dashboard/documents-tab"
import SearchTab from "@/components/dashboard/search-tab"
import ChatTab from "@/components/dashboard/chat-tab"
import SettingsTab from "@/components/dashboard/settings-tab"
import {
  FileText,
  Search,
  MessageSquare,
  Settings,
  LogOut,
  Loader2,
  ChevronLeft,
  ChevronRight
} from "lucide-react"
import { useAuth } from "@/lib/auth-context"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { cn } from "@/lib/utils"
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip"

const menuItems = [
  { id: "documents", label: "Documentos", icon: FileText },
  { id: "search", label: "Busca", icon: Search },
  { id: "chat", label: "Chat", icon: MessageSquare },
  { id: "settings", label: "Configurações", icon: Settings },
]

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("documents")
  const [isLoading, setIsLoading] = useState(true)
  const [username, setUsername] = useState<string>("")
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false)
  const router = useRouter()
  const { token, logout } = useAuth()

  useEffect(() => {
    // Check authentication
    const timer = setTimeout(() => {
      if (!token) {
        router.push("/login")
      } else {
        setIsLoading(false)
        // Get username from localStorage
        const storedUsername = localStorage.getItem("username") || "Usuário"
        setUsername(storedUsername)
      }
    }, 500)

    return () => clearTimeout(timer)
  }, [token, router])

  const handleLogout = () => {
    logout()
    localStorage.removeItem("username")
    router.push("/login")
  }

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
          <p className="text-muted-foreground">Carregando...</p>
        </div>
      </div>
    )
  }

  return (
    <TooltipProvider delayDuration={0}>
      <div className="h-screen flex bg-[#030712] overflow-hidden font-sans selection:bg-primary/30 selection:text-white">
        {/* Sidebar */}
        <aside
          className={cn(
            "h-full flex flex-col bg-[#080B14] border-r border-white/[0.04] transition-all duration-300 ease-in-out relative z-30",
            sidebarCollapsed ? "w-20" : "w-64"
          )}
        >
          {/* Background gradient effect */}
          <div className="absolute top-0 left-0 w-full h-32 bg-primary/5 blur-3xl pointer-events-none" />

          {/* Logo/Brand */}
          <div className={cn(
            "p-8 pb-10 border-b border-white/[0.04] transition-all duration-300 relative z-10",
            sidebarCollapsed ? "px-4 justify-center" : "px-6"
          )}>
            {sidebarCollapsed ? (
              <div className="flex justify-center">
                <div className="relative group">
                  <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                  <div className="relative w-9 h-9 bg-[#071312] border border-primary/20 rounded-lg flex items-center justify-center">
                    <span className="text-primary font-bold text-sm">G</span>
                  </div>
                </div>
              </div>
            ) : (
              <div>
                <div className="flex items-center gap-3">
                  <div className="relative group">
                    <div className="absolute -inset-1 bg-gradient-to-r from-primary to-teal-400 rounded-lg blur opacity-25 group-hover:opacity-50 transition duration-1000 group-hover:duration-200" />
                    <div className="relative w-9 h-9 bg-[#071312] border border-primary/20 rounded-lg flex items-center justify-center">
                      <span className="text-primary font-bold text-sm">G</span>
                    </div>
                  </div>
                  <div>
                    <h1 className="text-xl font-bold text-white tracking-tight">CronRag</h1>
                    <p className="text-xs text-slate-500">Dashboard</p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Toggle Button */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="absolute -right-3 top-28 w-6 h-6 bg-[#080B14] border border-white/10 rounded-full flex items-center justify-center text-slate-400 hover:text-white transition-all z-40 shadow-xl shadow-black"
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Menu Items */}
          <nav className="flex-1 px-4 space-y-1 relative z-10 overflow-y-auto">
            {!sidebarCollapsed && <p className="px-4 mb-3 text-[10px] font-bold uppercase tracking-[0.2em] text-slate-500/80">Menu Principal</p>}
            {menuItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.id

              if (sidebarCollapsed) {
                return (
                  <Tooltip key={item.id} delayDuration={0}>
                    <TooltipTrigger asChild>
                      <button
                        onClick={() => setActiveTab(item.id)}
                        className={cn(
                          "group w-12 h-12 mx-auto flex items-center justify-center rounded-xl transition-all duration-300 relative overflow-hidden",
                          isActive
                            ? "text-primary bg-white/[0.03] border border-white/[0.08]"
                            : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                        )}
                      >
                        {isActive && (
                          <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10 -z-10" />
                        )}
                        <div className={cn("relative w-5 h-5 flex items-center justify-center transition-colors", isActive ? "text-primary" : "")}>
                          <Icon className="w-full h-full" strokeWidth={isActive ? 2.5 : 2} />
                          {isActive && <div className="absolute inset-0 blur-md bg-primary/40 -z-10" />}
                        </div>
                        {isActive && (
                          <div className="absolute left-0 w-1 h-6 bg-primary rounded-r-full" />
                        )}
                      </button>
                    </TooltipTrigger>
                    <TooltipContent side="right" className="bg-[#080B14] border-white/[0.08] text-white">
                      {item.label}
                    </TooltipContent>
                  </Tooltip>
                )
              }

              return (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id)}
                  className={cn(
                    "group w-full flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-300 relative overflow-hidden",
                    isActive
                      ? "text-primary bg-white/[0.03] border border-white/[0.08]"
                      : "text-slate-400 hover:text-white hover:bg-white/[0.02]"
                  )}
                >
                  {isActive && (
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/10 to-purple-600/10 -z-10" />
                  )}
                  <div className={cn("relative w-5 h-5 flex-shrink-0 flex items-center justify-center transition-colors", isActive ? "text-primary" : "group-hover:text-white")}>
                    <Icon className="w-full h-full" strokeWidth={isActive ? 2.5 : 2} />
                    {isActive && <div className="absolute inset-0 blur-md bg-primary/40 -z-10" />}
                  </div>
                  <span className={cn("relative font-semibold text-sm transition-all duration-300 whitespace-nowrap", isActive ? "translate-x-1" : "group-hover:translate-x-0.5")}>
                    {item.label}
                  </span>
                  {isActive && (
                    <div className="ml-auto relative">
                      <div className="w-1.5 h-1.5 rounded-full bg-primary shadow-[0_0_12px_rgba(59,130,246,0.8)]" />
                    </div>
                  )}
                </button>
              )
            })}
          </nav>

          {/* User Section */}
          <div className={cn(
            "border-t border-white/[0.04] p-6 relative z-10 bg-[#080B14] transition-all duration-300",
            sidebarCollapsed ? "px-4 py-4" : "p-6"
          )}>
            {sidebarCollapsed ? (
              <div className="space-y-2">
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <div className="flex justify-center">
                      <Avatar className="h-8 w-8 cursor-pointer border border-white/[0.08]">
                        <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                          {username.charAt(0).toUpperCase()}
                        </AvatarFallback>
                      </Avatar>
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#080B14] border-white/[0.08] text-white">
                    {username}
                  </TooltipContent>
                </Tooltip>
                <Tooltip delayDuration={0}>
                  <TooltipTrigger asChild>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={handleLogout}
                      className="w-full h-8 text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all"
                    >
                      <LogOut className="w-4 h-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent side="right" className="bg-[#080B14] border-white/[0.08] text-white">
                    Sair
                  </TooltipContent>
                </Tooltip>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center gap-3 p-3 rounded-xl bg-white/[0.02] border border-white/[0.04]">
                  <Avatar className="h-8 w-8 border border-white/[0.08]">
                    <AvatarFallback className="bg-primary/20 text-primary text-xs font-bold">
                      {username.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-white truncate">{username}</p>
                    <p className="text-xs text-slate-500">Conectado</p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleLogout}
                  className="w-full justify-start text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-all border border-white/[0.04]"
                >
                  <LogOut className="w-4 h-4 mr-2" />
                  <span className="font-medium text-sm">Sair da Sessão</span>
                </Button>
              </div>
            )}
          </div>
        </aside>

        {/* Main Content */}
        <main className="flex-1 overflow-hidden">
          {activeTab === "documents" && (
            <DocumentsTab />
          )}
          {activeTab === "search" && (
            <div className="h-full overflow-auto p-6">
              <SearchTab />
            </div>
          )}
          {activeTab === "chat" && (
            <div className="h-full overflow-auto p-6">
              <ChatTab />
            </div>
          )}
          {activeTab === "settings" && (
            <div className="h-full overflow-auto p-6">
              <SettingsTab />
            </div>
          )}
        </main>
      </div>
    </TooltipProvider>
  )
}
