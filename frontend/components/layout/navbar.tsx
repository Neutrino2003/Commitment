"use client";

import { useState } from "react";
import { useRouter, usePathname } from "next/navigation";
import Link from "next/link";
import { cn } from "@/lib/utils";
import {
  Menu,
  X,
  Home,
  CheckSquare,
  Calendar,
  Flame,
  Shield,
  Settings,
  Plus,
} from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

export function AppNavbar() {
  const router = useRouter();
  const pathname = usePathname();
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navItems = [
    { name: "HOME", link: "/", icon: Home },
    { name: "TASKS", link: "/tasks", icon: CheckSquare },
    { name: "CALENDAR", link: "/calendar", icon: Calendar },
    { name: "HABITS", link: "/habits", icon: Flame },
    { name: "COMMITMENTS", link: "/commitments", icon: Shield },
  ];

  return (
    <>
      {/* Desktop Navbar */}
      <nav className="hidden lg:block fixed top-0 left-0 right-0 z-50 bg-paper-white border-b-3 border-ink-black shadow-neo-sm">
        <div className="container mx-auto px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-focus-yellow border-3 border-ink-black flex items-center justify-center font-black text-xl">
                C
              </div>
              <span className="font-black text-xl">COMMITMENT</span>
            </Link>

            {/* Nav Links */}
            <div className="flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = pathname === item.link;
                return (
                  <Link
                    key={item.link}
                    href={item.link}
                    className={cn(
                      "px-4 py-2 font-bold text-sm transition-all border-3 border-ink-black",
                      isActive
                        ? "bg-focus-yellow shadow-neo-sm"
                        : "bg-white hover:bg-gray-100 hover:shadow-neo-sm"
                    )}
                  >
                    {item.name}
                  </Link>
                );
              })}
            </div>

            {/* Action Buttons */}
            <div className="flex items-center gap-3">
              <button
                onClick={() => router.push("/settings")}
                className="p-2 bg-white border-3 border-ink-black hover:bg-gray-100 hover:shadow-neo-sm transition-all"
                aria-label="Settings"
              >
                <Settings size={20} strokeWidth={3} />
              </button>
              <button
                onClick={() => router.push("/commitments/new")}
                className="px-4 py-2 bg-accent-pink text-white font-black border-3 border-ink-black shadow-neo hover:translate-x-[-2px] hover:translate-y-[-2px] hover:shadow-neo-lg transition-all flex items-center gap-2"
              >
                <Plus size={20} strokeWidth={3} />
                NEW
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Mobile Navbar */}
      <nav className="lg:hidden fixed top-0 left-0 right-0 z-50 bg-paper-white border-b-3 border-ink-black shadow-neo-sm">
        <div className="px-4">
          <div className="flex items-center justify-between h-16">
            {/* Logo */}
            <Link href="/" className="flex items-center gap-2">
              <div className="w-10 h-10 bg-focus-yellow border-3 border-ink-black flex items-center justify-center font-black text-xl">
                C
              </div>
              <span className="font-black text-lg">COMMITMENT</span>
            </Link>

            {/* Mobile Menu Toggle */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="p-2 bg-white border-3 border-ink-black hover:bg-gray-100"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X size={24} strokeWidth={3} />
              ) : (
                <Menu size={24} strokeWidth={3} />
              )}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        <AnimatePresence>
          {isMobileMenuOpen && (
            <motion.div
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: "auto" }}
              exit={{ opacity: 0, height: 0 }}
              className="border-t-3 border-ink-black bg-paper-white"
            >
              <div className="px-4 py-4 space-y-2">
                {navItems.map((item) => {
                  const isActive = pathname === item.link;
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.link}
                      href={item.link}
                      onClick={() => setIsMobileMenuOpen(false)}
                      className={cn(
                        "flex items-center gap-3 px-4 py-3 font-bold border-3 border-ink-black transition-all",
                        isActive
                          ? "bg-focus-yellow shadow-neo-sm"
                          : "bg-white hover:bg-gray-100"
                      )}
                    >
                      <Icon size={20} strokeWidth={3} />
                      {item.name}
                    </Link>
                  );
                })}

                <div className="pt-2 space-y-2">
                  <button
                    onClick={() => {
                      router.push("/settings");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center gap-3 px-4 py-3 font-bold bg-white border-3 border-ink-black hover:bg-gray-100"
                  >
                    <Settings size={20} strokeWidth={3} />
                    SETTINGS
                  </button>
                  <button
                    onClick={() => {
                      router.push("/commitments/new");
                      setIsMobileMenuOpen(false);
                    }}
                    className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-accent-pink text-white font-black border-3 border-ink-black shadow-neo"
                  >
                    <Plus size={20} strokeWidth={3} />
                    NEW COMMITMENT
                  </button>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </nav>
    </>
  );
}
