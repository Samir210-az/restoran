import Link from "next/link";
import { Instagram } from "lucide-react";
import { InstallAppLink } from "./InstallAppLink";

/**
 * Butun musteri-uzlu sehifelerde sabit footer.
 * Brend imzasi buraya bir yerden idare olunur.
 */
export function Footer() {
  return (
    <footer className="border-t border-border px-4 py-6 text-center md:px-6">
      <p className="text-sm text-text-secondary">
        By{" "}
        <Link
          href="https://instagram.com/securtiy_group"
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 font-medium text-accent hover:underline"
        >
          securtiy_group <Instagram className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </p>
      <InstallAppLink />
    </footer>
  );
}
