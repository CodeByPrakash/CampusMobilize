"use client";

import * as React from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { ROLES, RoleDefinition } from "@/lib/roles";
import { RoleSwitchModal } from "@/components/dashboards/role-switch-modal";
import { LanguageSwitcher } from "@/components/language-switcher";
import { cn } from "cn";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";
import { Separator } from "@/components/ui/separator";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  Building2Icon,
  LogOutIcon,
  UserCheckIcon,
  BellIcon,
  ChevronRightIcon,
} from "lucide-react";

interface RoleDashboardShellProps {
  role: RoleDefinition;
  navItems: {
    title: string;
    url: string;
    icon: React.ReactNode;
    badge?: string;
    isActive?: boolean;
  }[];
  children: React.ReactNode;
}

export function RoleDashboardShell({
  role,
  navItems,
  children,
}: RoleDashboardShellProps) {
  const router = useRouter();
  const pathname = usePathname();
  const [isSwitchModalOpen, setIsSwitchModalOpen] = React.useState(false);

  const handleLogout = () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("current_role_id");
    }
    router.push("/");
  };

  return (
    <SidebarProvider
      style={
        {
          "--sidebar-width": "17.5rem",
          "--header-height": "calc(var(--spacing) * 14)",
        } as React.CSSProperties
      }
    >
      <Sidebar collapsible="offcanvas" variant="inset">
        <SidebarHeader className="border-b border-sidebar-border px-4 py-3">
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                size="lg"
                className="hover:bg-sidebar-accent gap-3"
              >
                <div className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-semibold">
                  <Building2Icon className="size-4" />
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-sm font-semibold tracking-tight text-sidebar-foreground">
                    CampusMobilize
                  </span>
                  <span className="text-xs text-muted-foreground">
                    NIT Rourkela
                  </span>
                </div>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarHeader>

        <SidebarContent className="p-2">
          <div className="px-3 py-2 text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">
            {role.roleKey} Management
          </div>
          <SidebarMenu className="gap-1">
            {navItems.map((item, idx) => {
              const isItemActive = item.isActive !== undefined ? item.isActive : (pathname === item.url);
              return (
                <SidebarMenuItem key={idx}>
                  <SidebarMenuButton
                    isActive={isItemActive}
                    className={cn(
                      "w-full justify-between rounded-lg px-3 py-2 text-sm font-medium transition-colors h-9",
                      isItemActive
                        ? "bg-sidebar-accent text-sidebar-accent-foreground font-semibold shadow-2xs data-active:bg-sidebar-accent data-active:text-sidebar-accent-foreground"
                        : "text-sidebar-foreground hover:bg-sidebar-accent/60 hover:text-sidebar-accent-foreground"
                    )}
                    render={<Link href={item.url} />}
                  >
                    <div className="flex items-center gap-2.5 min-w-0 flex-1">
                      <span
                        className={cn(
                          "shrink-0",
                          isItemActive
                            ? "text-sidebar-accent-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {item.icon}
                      </span>
                      <span className="truncate whitespace-nowrap text-sm">
                        {item.title}
                      </span>
                    </div>
                    {item.badge && (
                      <Badge
                        className={cn(
                          "text-[10px] px-1.5 py-0 h-4 shrink-0 font-medium transition-colors border-transparent ml-2",
                          isItemActive
                            ? "bg-primary text-primary-foreground"
                            : "bg-muted text-muted-foreground"
                        )}
                      >
                        {item.badge}
                      </Badge>
                    )}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              );
            })}
          </SidebarMenu>

          <div className="mt-auto pt-4 border-t border-sidebar-border">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSwitchModalOpen(true)}
              className="w-full justify-between text-xs h-9"
            >
              <div className="flex items-center gap-2">
                <UserCheckIcon className="size-3.5 text-muted-foreground" />
                <span>Switch Role</span>
              </div>
              <ChevronRightIcon className="size-3.5 text-muted-foreground" />
            </Button>
          </div>
        </SidebarContent>

        <SidebarFooter className="border-t border-sidebar-border p-3">
          <div className="flex items-center justify-between rounded-lg bg-sidebar-accent/50 p-2">
            <div className="flex items-center gap-2.5 min-w-0">
              <Avatar className="size-8 rounded-lg">
                <AvatarFallback className="rounded-lg bg-secondary text-secondary-foreground text-xs font-semibold">
                  {role.initial}
                </AvatarFallback>
              </Avatar>
              <div className="min-w-0 flex-1">
                <div className="text-xs font-medium text-sidebar-foreground truncate">
                  {role.name}
                </div>
                <div className="text-[11px] text-muted-foreground truncate">
                  {role.roleKey}
                </div>
              </div>
            </div>
            <Button
              variant="ghost"
              size="icon"
              onClick={handleLogout}
              title="Logout"
              className="size-7 text-muted-foreground hover:text-foreground"
            >
              <LogOutIcon className="size-3.5" />
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        {/* Header */}
        <header className="sticky top-0 z-10 flex h-(--header-height) shrink-0 items-center justify-between border-b bg-background px-4 lg:px-6">
          <div className="flex items-center gap-2">
            <SidebarTrigger className="-ml-1" />
            <Separator orientation="vertical" className="mx-2 h-4" />
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-sm font-semibold tracking-tight text-foreground sm:text-base">
                  {role.name}
                </h1>
                <Badge variant="outline" className="text-[11px] font-mono">
                  {role.roleKey}
                </Badge>
              </div>
              <p className="text-xs text-muted-foreground hidden sm:block">
                {role.title}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <LanguageSwitcher />
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsSwitchModalOpen(true)}
              className="text-xs h-8 gap-1.5"
            >
              <UserCheckIcon className="size-3.5" />
              <span>Switch Role</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              className="size-8 text-muted-foreground hover:text-foreground"
              title="Notifications"
            >
              <BellIcon className="size-4" />
            </Button>
          </div>
        </header>

        {/* Dashboard Content */}
        <main className="flex-1 p-4 lg:p-6 overflow-x-hidden bg-background">
          {children}
        </main>
      </SidebarInset>

      <RoleSwitchModal
        isOpen={isSwitchModalOpen}
        onClose={() => setIsSwitchModalOpen(false)}
        currentRoleId={role.id}
      />
    </SidebarProvider>
  );
}
