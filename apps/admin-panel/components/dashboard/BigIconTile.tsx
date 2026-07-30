import Link from "next/link";
import type { LucideIcon } from "lucide-react";

export function BigIconTile({
  href,
  icon: Icon,
  label,
  description,
}: {
  href: string;
  icon: LucideIcon;
  label: string;
  description: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-2 rounded-xl border border-border bg-bg-elevated p-6 text-center shadow-soft transition-transform hover:shadow-elevated active:scale-95"
    >
      <div className="flex h-14 w-14 items-center justify-center rounded-full bg-accent-soft text-accent">
        <Icon className="h-7 w-7" aria-hidden="true" />
      </div>
      <span className="text-base font-semibold text-text-primary">{label}</span>
      <span className="text-xs text-text-secondary">{description}</span>
    </Link>
  );
}
