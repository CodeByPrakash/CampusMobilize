"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { cn } from "cn";
import { ROLES, DEFAULT_ROLE, RoleDefinition } from "@/lib/roles";
import { RoleSwitchModal } from "@/components/dashboards/role-switch-modal";
import { Button } from "@/components/ui/button";
import { Field, FieldGroup, FieldLabel } from "@/components/ui/field";
import { Input } from "@/components/ui/input";
import { UserCheckIcon, SparklesIcon } from "lucide-react";

export function LoginForm({
  className,
  ...props
}: React.ComponentProps<"form">) {
  const router = useRouter();
  const [email, setEmail] = React.useState("diya@cr.nitrkl.ac.in");
  const [password, setPassword] = React.useState("••••••••");
  const [isModalOpen, setIsModalOpen] = React.useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    // Match role by email or default
    const matched =
      ROLES.find((r) => r.email.toLowerCase() === email.trim().toLowerCase()) ||
      DEFAULT_ROLE;

    if (typeof window !== "undefined") {
      localStorage.setItem("current_role_id", matched.id);
      localStorage.setItem("current_role_email", matched.email);
      localStorage.setItem("current_role_name", matched.name);
    }

    router.push(matched.route);
  };

  const handleQuickRole = (role: RoleDefinition) => {
    setEmail(role.email);
    if (typeof window !== "undefined") {
      localStorage.setItem("current_role_id", role.id);
      localStorage.setItem("current_role_email", role.email);
      localStorage.setItem("current_role_name", role.name);
    }
    router.push(role.route);
  };

  return (
    <div className="w-full">
      <form
        onSubmit={handleSubmit}
        className={cn("flex flex-col gap-5", className)}
        {...props}
      >
        <FieldGroup>
          <div className="flex flex-col items-center gap-1.5 text-center">
            <h1 className="text-2xl font-bold tracking-tight">
              Login to CampusMobilize
            </h1>
            <p className="text-xs text-balance text-muted-foreground">
              NIT Rourkela grievance, facility &amp; administrative portal
            </p>
          </div>

          <Field>
            <FieldLabel htmlFor="email">Institute Email</FieldLabel>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="name@nitrkl.ac.in"
              required
            />
          </Field>

          <Field>
            <div className="flex items-center">
              <FieldLabel htmlFor="password">Password</FieldLabel>
              <a
                href="#"
                className="ml-auto text-xs text-muted-foreground underline-offset-4 hover:underline"
              >
                Forgot your password?
              </a>
            </div>
            <Input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </Field>

          <Field>
            <Button type="submit" className="w-full font-bold">
              Login to Role Dashboard
            </Button>
          </Field>
        </FieldGroup>
      </form>

      {/* Demonstration Role Switcher Banner */}
      <div className="mt-6 rounded-lg border border-border bg-card p-4 text-center">
        <div className="text-xs font-semibold text-foreground">
          Switch Demonstration Role (§15)
        </div>
        <p className="text-[11px] text-muted-foreground mt-0.5 mb-3">
          1-click instant login as Student, CR, Rep, Caretaker, Warden, or
          Director
        </p>

        <Button
          type="button"
          variant="outline"
          onClick={() => setIsModalOpen(true)}
          className="w-full text-xs h-9 gap-2"
        >
          <UserCheckIcon className="size-4" />
          <span>Open Role Selector (15)</span>
        </Button>

        {/* Quick chip shortcuts */}
        <div className="mt-3 flex flex-wrap justify-center gap-1.5 pt-2 border-t border-border">
          {ROLES.slice(0, 4).map((r) => (
            <Button
              key={r.id}
              type="button"
              variant="secondary"
              size="sm"
              onClick={() => handleQuickRole(r)}
              className="h-6 px-2 text-[10px]"
            >
              {r.name.split(" ")[0]} ({r.roleKey})
            </Button>
          ))}
        </div>
      </div>

      <RoleSwitchModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
      />
    </div>
  );
}
