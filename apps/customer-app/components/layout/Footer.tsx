import Link from "next/link";
import { Instagram } from "lucide-react";
import { InstallAppLink } from "./InstallAppLink";

/**
 * Butun musteri-uzlu sehifelerde sabit footer.
 * Brend imzasi buraya bir yerden idare olunur.
 */
export function Footer() {
  const adminUrl = process.env.NEXT_PUBLIC_ADMIN_APP_URL;

  return (
    <footer className="border-t border-border px-4 py-6 text-center md:px-6">
      <p className="text-sm text-text-secondary">
        By{" "}
        <Link
          href="https://instagram.com/s_akhundoff"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          s_akhundoff <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </p>
      {adminUrl && (
        <p className="mt-2">
          <Link href={adminUrl} className="text-xs text-text-muted hover:text-text-secondary hover:underline">
            Restoran sahibisiniz? Panelə keçin
          </Link>
        </p>
      )}
      <InstallAppLink />
    </footer>
  );
}
