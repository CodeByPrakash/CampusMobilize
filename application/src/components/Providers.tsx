"use client";

import React, { ReactNode } from "react";
import { PersonaProvider } from "../context/PersonaContext";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PersonaProvider>
      {children}
    </PersonaProvider>
  );
}
