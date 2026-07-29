import Link from "next/link";
import { Shield } from "lucide-react";
import { ThemeToggle } from "@restoran/ui";
import { requirePlatformAdmin } from "@/lib/get-current-platform-admin";

export default async function PlatformLayout({ children }: { children: React.ReactNode }) {
  await requirePlatformAdmin();

  return (
    <div className="min-h-screen bg-bg">
      <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-bg/80 px-4 backdrop-blur-md md:px-6">
        <Link href="/platform" className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-accent" aria-hidden="true" />
          <span className="text-lg font-semibold text-text-primary">
            Platform Admin<span className="text-accent">.</span>
          </span>
        </Link>
        <div className="flex items-center gap-3">
          <Link href="/dashboard" className="text-sm text-text-secondary hover:text-text-primary">
            Öz panelimə qayıt
          </Link>
          <ThemeToggle />
        </div>
      </header>
      <main className="p-4 md:p-6">{children}</main>
    </div>
  );
}
