"use client"

import * as React from "react"
import { useRouter } from "next/navigation"
import { ROLES, RoleDefinition } from "@/lib/roles"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import { UserCheckIcon, XIcon, ArrowRightIcon } from "lucide-react"

interface RoleSwitchModalProps {
  isOpen: boolean
  onClose: () => void
  currentRoleId?: string
}

export function RoleSwitchModal({
  isOpen,
  onClose,
  currentRoleId = "cr",
}: RoleSwitchModalProps) {
  const router = useRouter()
  const [activeId, setActiveId] = React.useState(currentRoleId)

  React.useEffect(() => {
    if (typeof window !== "undefined") {
      const saved = localStorage.getItem("current_role_id")
      if (saved) {
        setActiveId(saved)
      } else {
        setActiveId(currentRoleId)
      }
    }
  }, [currentRoleId, isOpen])

  if (!isOpen) return null

  const handleSelectRole = (role: RoleDefinition) => {
    if (typeof window !== "undefined") {
      localStorage.setItem("current_role_id", role.id)
      localStorage.setItem("current_role_email", role.email)
      localStorage.setItem("current_role_name", role.name)
    }
    setActiveId(role.id)
    onClose()
    router.push(role.route)
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-xs">
      <div className="relative w-full max-w-4xl max-h-[90vh] overflow-y-auto rounded-xl bg-background p-6 shadow-lg border border-border sm:p-8">
        {/* Header */}
        <div className="flex items-start justify-between pb-6 border-b border-border">
          <div className="flex items-start gap-3">
            <div className="flex size-9 items-center justify-center rounded-lg bg-secondary text-secondary-foreground border border-border">
              <UserCheckIcon className="size-5" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-foreground flex items-center gap-2">
                Switch Demonstration Role (15)
              </h2>
              <p className="text-sm text-muted-foreground mt-0.5">
                Instantaneous switch between Student, Rep, Caretaker, Warden, and Admin dashboards.
              </p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="rounded-lg text-muted-foreground hover:text-foreground"
          >
            <XIcon className="size-4" />
          </Button>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-6">
          {ROLES.map((role) => {
            const isActive = activeId === role.id
            return (
              <div
                key={role.id}
                onClick={() => handleSelectRole(role)}
                className={`flex flex-col justify-between rounded-lg border p-4.5 transition-colors cursor-pointer ${isActive
                    ? "border-primary bg-accent/40 shadow-xs"
                    : "border-border bg-card hover:bg-accent/30"
                  }`}
              >
                <div>
                  <div className="flex items-center gap-3">
                    <Avatar className="size-10 rounded-lg">
                      <AvatarFallback className="rounded-lg bg-secondary text-secondary-foreground font-semibold text-sm">
                        {role.initial}
                      </AvatarFallback>
                    </Avatar>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-semibold text-sm text-foreground truncate">
                          {role.name}
                        </span>
                        {isActive && (
                          <Badge variant="default" className="text-[10px] px-1.5 py-0 h-4">
                            ACTIVE
                          </Badge>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground truncate">
                        {role.title}
                      </p>
                    </div>
                  </div>

                  <p className="mt-3 text-xs leading-relaxed text-muted-foreground">
                    {role.description}
                  </p>
                </div>

                <div className="mt-4 flex items-center justify-between pt-3 border-t border-border text-xs">
                  <span className="font-mono text-[11px] font-medium text-muted-foreground uppercase">
                    {role.roleKey}
                  </span>
                  <Button
                    variant="link"
                    size="sm"
                    className="h-auto p-0 text-xs font-medium text-primary flex items-center gap-1"
                    onClick={(e) => {
                      e.stopPropagation()
                      handleSelectRole(role)
                    }}
                  >
                    Select Role <ArrowRightIcon className="size-3" />
                  </Button>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
