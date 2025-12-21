"use client";

import React from "react";
import { AppNavbar } from "./navbar";

export default function Layout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen bg-dot-grid">
      {/* Top Navbar */}
      <AppNavbar />

      {/* Main Content - Added padding-top to account for fixed navbar */}
      <main className="pt-20 px-4 py-8">
        <div className="max-w-7xl mx-auto">{children}</div>
      </main>
    </div>
  );
}
