"use client";

import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AdminSignOut() {
  return (
    <button
      className="inline-flex items-center gap-1.5 text-xs font-semibold text-ink/55 hover:text-ink"
      onClick={() => signOut({ callbackUrl: "/admin/login" })}
      type="button"
    >
      <LogOut aria-hidden="true" size={14} /> Sign out
    </button>
  );
}
