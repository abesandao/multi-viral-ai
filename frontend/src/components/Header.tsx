"use client";

import Link from "next/link";
import { Zap } from "lucide-react";

export default function Header() {
  return (
    <header className="fixed top-0 w-full z-50 glass-strong">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2.5 hover:opacity-90 transition-opacity">
            <div className="relative w-9 h-9 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple flex items-center justify-center shadow-lg shadow-neon-blue/25">
              <Zap className="w-5 h-5 text-white" />
              <div className="absolute inset-0 rounded-lg bg-gradient-to-br from-neon-blue to-neon-purple opacity-50 blur-sm -z-10" />
            </div>
            <span className="text-xl font-bold tracking-tight">
              Multi-Viral<span className="text-neon-blue"> AI</span>
            </span>
          </Link>

          {/* Nav */}
          <nav className="hidden md:flex items-center gap-8 text-sm text-gray-400">
            <a
              href="#features"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="hover:text-neon-blue transition-colors duration-300 cursor-pointer"
            >
              機能
            </a>
            <a
              href="#how"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("how")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="hover:text-neon-blue transition-colors duration-300 cursor-pointer"
            >
              使い方
            </a>
            <a
              href="#pricing"
              onClick={(e) => {
                e.preventDefault();
                document.getElementById("pricing")?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="hover:text-neon-blue transition-colors duration-300 cursor-pointer"
            >
              料金
            </a>
          </nav>

          {/* CTA */}
          <a
            href="#"
            onClick={(e) => {
              e.preventDefault();
              document.getElementById("features")?.scrollIntoView({ behavior: "smooth", block: "start" });
            }}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gradient-to-r from-neon-blue to-neon-purple hover:shadow-lg hover:shadow-neon-blue/20 transition-all duration-300"
          >
            無料で始める
          </a>
        </div>
      </div>
    </header>
  );
}
