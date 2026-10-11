"use client";

import { LoginForm } from "@/components/login-form";
import { GalleryVerticalEndIcon } from "lucide-react";

export default function HomePage() {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="flex flex-col gap-4 p-6 md:p-10">
        <div className="flex justify-center gap-2 md:justify-start">
          <a href="#" className="flex items-center gap-2 font-bold tracking-tight">
            <div className="flex size-7 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold text-xs shadow-xs">
              NIT
            </div>
            <span>CampusMobilize</span>
          </a>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">
            <LoginForm />
          </div>
        </div>
      </div>
      <div className="relative hidden bg-muted lg:block">
        <img
          src="/bg/image.png"
          alt="Campus"
          className="absolute inset-0 h-full w-full object-cover"
        />
      </div>
    </div>
  );
}
