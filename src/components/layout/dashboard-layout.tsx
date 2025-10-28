
"use client"

import type { ReactNode } from "react"
import { SidebarProvider } from "@/components/ui/sidebar"
import { AppSidebar } from "./sidebar"
import { Header } from "./header"
import { useAuth } from "@/hooks/useAuth"
import { Loader2 } from "lucide-react"

interface DashboardLayoutProps {
  children: ReactNode
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
      </div>
    )
  }

  if (!user) {
    // This will be handled by the useAuth hook redirecting,
    // but it's good to have a fallback UI.
    return (
      <div className="min-h-screen w-full flex items-center justify-center bg-background">
        <Loader2 className="w-12 h-12 animate-spin text-primary" />
        <p className="ml-4 text-muted-foreground">Redirecting...</p>
      </div>
    )
  }

  return (
    <SidebarProvider>
      <div className="min-h-screen lg:flex">
        <AppSidebar />
        <div className="flex-1">
          <Header />
          <main className="p-4 sm:p-6 lg:p-8">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  )
}

    