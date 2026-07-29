"use client";

import { useRouter } from "next/navigation";
import { LogOut } from "lucide-react";
import { createSupabaseBrowserClient } from "@restoran/supabase-client";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createSupabaseBrowserClient();
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <button
      onClick={handleLogout}
      className="flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-text-secondary transition-colors hover:bg-bg-muted hover:text-danger"
    >
      <LogOut className="h-4 w-4 shrink-0" aria-hidden="true" />
      Çıxış
    </button>
  );
}
