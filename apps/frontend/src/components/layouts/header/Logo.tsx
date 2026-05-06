"use client";

import React from "react";
import Link from "next/link";
import { Sparkles } from "lucide-react";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 rounded-lg px-2 py-1 hover:bg-gray-100 dark:hover:bg-neutral-800">
      <span className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-violet-500 text-white">
        <Sparkles size={16} />
      </span>
      <span className="hidden text-sm font-black tracking-tight sm:inline uppercase">
        SMART <span className="text-blue-600">COLLAB</span>
      </span>
    </Link>
  );
}
