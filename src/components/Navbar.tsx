"use client";

import Link from "next/link";

export default function Navbar() {
  return (
    <nav className="border-b border-border bg-white">
      <div className="max-w-6xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="flex items-center gap-3 hover:opacity-80 transition-opacity">
          <div className="w-8 h-8 bg-washu-red rounded flex items-center justify-center">
            <span className="text-white font-bold text-sm">W</span>
          </div>
          <span className="font-semibold text-foreground">
            WashU GIM Informatics
          </span>
        </Link>
      </div>
    </nav>
  );
}
