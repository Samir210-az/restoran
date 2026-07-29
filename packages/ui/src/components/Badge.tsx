import * as React from "react";
import { cn } from "@restoran/utils";

type BadgeVariant = "neutral" | "success" | "warning" | "danger" | "info" | "accent";

const VARIANT_CLASSES: Record<BadgeVariant, string> = {
  neutral: "bg-bg-muted text-text-secondary",
  success: "bg-success/15 text-success",
  warning: "bg-warning/15 text-warning",
  danger: "bg-danger/15 text-danger",
  info: "bg-info/15 text-info",
  accent: "bg-accent-soft text-accent",
};

export function Badge({
  className,
  variant = "neutral",
  ...props
}: React.HTMLAttributes<HTMLSpanElement> & { variant?: BadgeVariant }) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium",
        VARIANT_CLASSES[variant],
        className
      )}
      {...props}
    />
  );
}
