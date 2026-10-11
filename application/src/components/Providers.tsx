"use client";

import React, { ReactNode } from "react";
import { PersonaProvider } from "../context/PersonaContext";
import Navbar from "./Navbar";

export default function Providers({ children }: { children: ReactNode }) {
  return (
    <PersonaProvider>
      <Navbar />
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {children}
      </main>
    </PersonaProvider>
  );
}
