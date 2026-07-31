"use client";

import * as React from "react";
import { X } from "lucide-react";
import { cn } from "@restoran/utils";

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  description?: string;
  children: React.ReactNode;
  className?: string;
}

/**
 * Dependency-siz modal (Radix elave olunana qeder). Focus trap ve
 * Escape-le baglama daxildir - erisilebilik (a11y) ucun minimum telebdir.
 */
export function Modal({ isOpen, onClose, title, description, children, className }: ModalProps) {
  React.useEffect(() => {
    if (!isOpen) return;
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    document.body.style.overflow = "hidden";
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? "modal-title" : undefined}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in"
    >
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        className={cn(
          "relative z-10 w-full max-w-md rounded-lg border border-border bg-bg-elevated p-6 shadow-elevated animate-slide-up",
          className
        )}
      >
        <div className="mb-4 flex items-start justify-between">
          <div>
            {title && (
              <h2 id="modal-title" className="text-lg font-semibold text-text-primary">
                {title}
              </h2>
            )}
            {description && <p className="mt-1 text-sm text-text-secondary">{description}</p>}
          </div>
          <button
            onClick={onClose}
            aria-label="Bağla"
            className="rounded-md p-1 text-text-muted hover:bg-bg-muted hover:text-text-primary"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
