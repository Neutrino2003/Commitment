"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

import {
  Navbar,
  NavBody,
  NavItems,
  MobileNav,
  NavbarLogo,
  NavbarButton,
  MobileNavHeader,
  MobileNavToggle,
  MobileNavMenu,
} from "@/components/ui/resizable-navbar";
import { BackgroundBeams } from "@/components/ui/background-beams";

export default function Home() {
  const router = useRouter();
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem("access_token");
    if (token) {
      setIsLoggedIn(true);
    }
  }, []);

  const handleGetStarted = () => {
    if (isLoggedIn) {
      router.push("/dashboard");
    } else {
      router.push("/register");
    }
  };

  const navItems = [
    {
      name: "Dashboard",
      link: "/dashboard",
    },
  ];

  return (
    <div className="min-h-screen bg-[#fef6e4]">
      <Navbar>
        <NavBody>
          <NavbarLogo />
          <NavItems items={navItems} />
          <div className="flex items-center gap-4">
            <NavbarButton variant="secondary" href="/login">
              Login
            </NavbarButton>
            <NavbarButton variant="primary" href="/register">
              Sign Up
            </NavbarButton>
          </div>
        </NavBody>
        <MobileNav>
          <MobileNavHeader>
            <NavbarLogo />
            <MobileNavToggle
              isOpen={isMobileMenuOpen}
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            />
          </MobileNavHeader>

          <MobileNavMenu
            isOpen={isMobileMenuOpen}
            onClose={() => setIsMobileMenuOpen(false)}
          >
            {navItems.map((item, idx) => (
              <a
                key={`mobile-link-${idx}`}
                href={item.link}
                onClick={() => setIsMobileMenuOpen(false)}
                className="relative text-neutral-600"
              >
                <span className="block">{item.name}</span>
              </a>
            ))}
          </MobileNavMenu>
        </MobileNav>
      </Navbar>

      {/* Hero Section */}
      <div className="container mx-auto px-6 py-20">
        <div className="text-center max-w-4xl mx-auto mb-16 relative">
          <div className="inline-block mb-6 px-6 py-3 bg-[#ff6b6b] text-white font-black text-sm uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] rotate-2 hover:rotate-0 transition-transform">
            🔥 Brutal Commitment System
          </div>
          <h1 className="text-6xl md:text-7xl font-black text-black mb-8 leading-tight">
            PUT YOUR
            <span className="inline-block bg-[#4ecdc4] px-4 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)] -rotate-1 mx-2">
              MONEY
            </span>
            <br />
            WHERE YOUR MOUTH IS
          </h1>
          <p className="text-2xl font-bold text-black mb-10 leading-relaxed">
            No excuses. No soft deadlines. Just pure accountability with{" "}
            <span className="bg-[#ffe66d] px-2 border-2 border-black">
              REAL FINANCIAL STAKES
            </span>
          </p>
          <button
            onClick={handleGetStarted}
            className="px-10 py-5 bg-[#ff6b6b] text-white text-xl font-black uppercase border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[4px_4px_0px_0px_rgba(0,0,0,1)] hover:translate-x-1 hover:translate-y-1 transition-all active:shadow-none active:translate-x-2 active:translate-y-2"
          >
            START NOW →
          </button>
        </div>

        {/* Features */}
        <div className="mt-32 grid md:grid-cols-3 gap-8">
          <div className="bg-[#4ecdc4] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
            <div className="text-6xl mb-6">💰</div>
            <h3 className="text-2xl font-black mb-4 uppercase">REAL STAKES</h3>
            <p className="text-black font-bold text-lg">
              Put actual money on the line. Lose your commitment? Lose your
              cash. Simple.
            </p>
          </div>

          <div className="bg-[#ffe66d] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
            <div className="text-6xl mb-6">📊</div>
            <h3 className="text-2xl font-black mb-4 uppercase">
              TRACK EVERYTHING
            </h3>
            <p className="text-black font-bold text-lg">
              Evidence required. No "I did it, trust me bro." Proof or it didn't
              happen.
            </p>
          </div>

          <div className="bg-[#a8e6cf] p-8 border-4 border-black shadow-[8px_8px_0px_0px_rgba(0,0,0,1)] hover:shadow-[12px_12px_0px_0px_rgba(0,0,0,1)] hover:-translate-y-1 transition-all">
            <div className="text-6xl mb-6">🔄</div>
            <h3 className="text-2xl font-black mb-4 uppercase">BUILD HABITS</h3>
            <p className="text-black font-bold text-lg">
              Daily, weekly, monthly. Keep going or keep losing. Your choice.
            </p>
          </div>
        </div>

        {/* How It Works */}
        <div className="mt-32">
          <h2 className="text-5xl font-black text-center mb-16 uppercase">
            <span className="inline-block bg-white px-6 py-3 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              How It Works
            </span>
          </h2>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-20 h-20 bg-[#ff6b6b] text-white border-4 border-black flex items-center justify-center text-4xl font-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                1
              </div>
              <h4 className="font-black text-xl mb-3 uppercase">
                Set Goal + Stake
              </h4>
              <p className="text-black font-bold">
                Define what you'll do and how much you'll lose if you fail
              </p>
            </div>

            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-20 h-20 bg-[#4ecdc4] text-white border-4 border-black flex items-center justify-center text-4xl font-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                2
              </div>
              <h4 className="font-black text-xl mb-3 uppercase">
                Pick Deadline
              </h4>
              <p className="text-black font-bold">
                Choose your timeframe. The clock starts ticking NOW
              </p>
            </div>

            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-20 h-20 bg-[#ffe66d] text-black border-4 border-black flex items-center justify-center text-4xl font-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                3
              </div>
              <h4 className="font-black text-xl mb-3 uppercase">
                Submit Proof
              </h4>
              <p className="text-black font-bold">
                Photos, videos, verification. Show us you did it before time's
                up
              </p>
            </div>

            <div className="bg-white p-8 border-4 border-black shadow-[6px_6px_0px_0px_rgba(0,0,0,1)]">
              <div className="w-20 h-20 bg-[#a8e6cf] text-black border-4 border-black flex items-center justify-center text-4xl font-black mb-6 shadow-[4px_4px_0px_0px_rgba(0,0,0,1)]">
                4
              </div>
              <h4 className="font-black text-xl mb-3 uppercase">Win or Lose</h4>
              <p className="text-black font-bold">
                Complete = Keep money. Fail = Goodbye cash. No middle ground
              </p>
            </div>
          </div>
        </div>

        {/* CTA Section */}
        <div className="mt-32 bg-black text-white p-12 border-4 border-black shadow-[12px_12px_0px_0px_rgba(255,107,107,1)]">
          <div className="text-center max-w-3xl mx-auto">
            <h2 className="text-4xl md:text-5xl font-black mb-6 uppercase">
              READY TO STOP MAKING EXCUSES?
            </h2>
            <p className="text-xl font-bold mb-8 text-gray-300">
              Join people who actually follow through on their commitments
            </p>
            <button
              onClick={handleGetStarted}
              className="px-10 py-5 bg-[#4ecdc4] text-black text-xl font-black uppercase border-4 border-white shadow-[6px_6px_0px_0px_rgba(255,255,255,1)] hover:shadow-[3px_3px_0px_0px_rgba(255,255,255,1)] hover:translate-x-1 hover:translate-y-1 transition-all"
            >
              LET'S GO →
            </button>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="bg-black text-white mt-20 py-8 border-t-4 border-black">
        <div className="container mx-auto px-6 text-center">
          <p className="font-black uppercase text-lg">
            © 2025 COMMITMENT APP • NO EXCUSES • REAL RESULTS
          </p>
        </div>
      </footer>
    </div>
  );
}
