"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ROLES, DEFAULT_ROLE } from "@/lib/roles"

export default function DashboardRedirect() {
  const router = useRouter()

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const savedRoleId = localStorage.getItem("current_role_id")
      const matched = ROLES.find((r) => r.id === savedRoleId)
      if (matched) {
        router.replace(matched.route)
      } else {
        router.replace(DEFAULT_ROLE.route)
      }
    }
  }, [router])

  return (
    <div className="flex min-h-screen items-center justify-center bg-background">
      <div className="flex flex-col items-center gap-3">
        <div className="size-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
        <span className="text-xs font-semibold text-muted-foreground">Redirecting to role dashboard...</span>
      </div>
    </div>
  )
}
