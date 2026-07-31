"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA "install" duymesi (Sidebar-in alt hissesi - admin panelin "footer"u).
 * Chrome/Edge/Android `beforeinstallprompt` hadisesini avtomatik atir
 * (bax: next.config.js-deki next-pwa). iOS Safari-de bu hadise atilmir -
 * orada aciqlayici metn gosterilir.
 */
export function InstallAppLink({ variant = "sidebar" }: { variant?: "sidebar" | "centered" }) {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);

  useEffect(() => {
    function handleBeforeInstallPrompt(e: Event) {
      e.preventDefault();
      setInstallEvent(e as BeforeInstallPromptEvent);
    }
    window.addEventListener("beforeinstallprompt", handleBeforeInstallPrompt);

    setIsIOS(/iphone|ipad|ipod/i.test(window.navigator.userAgent));
    setIsStandalone(
      window.matchMedia("(display-mode: standalone)").matches ||
        (window.navigator as unknown as { standalone?: boolean }).standalone === true
    );

    return () => window.removeEventListener("beforeinstallprompt", handleBeforeInstallPrompt);
  }, []);

  if (isStandalone) return null;

  async function handleInstall() {
    if (!installEvent) return;
    await installEvent.prompt();
    await installEvent.userChoice;
    setInstallEvent(null);
  }

  if (installEvent) {
    return (
      <button
        type="button"
        onClick={handleInstall}
        className={
          variant === "centered"
            ? "mx-auto flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
            : "flex w-full items-center gap-2 rounded-md px-3 py-2 text-sm font-medium text-text-secondary hover:bg-bg-muted hover:text-text-primary"
        }
      >
        <Download className={variant === "centered" ? "h-3.5 w-3.5" : "h-4 w-4 shrink-0"} aria-hidden="true" />
        Tətbiqi yüklə
      </button>
    );
  }

  if (isIOS) {
    return (
      <p
        className={
          variant === "centered"
            ? "flex items-center justify-center gap-1.5 text-xs text-text-muted"
            : "flex items-center gap-2 px-3 py-2 text-xs text-text-muted"
        }
      >
        <Share className="h-3.5 w-3.5 shrink-0" aria-hidden="true" />
        Paylaş → &quot;Ana ekrana əlavə et&quot;
      </p>
    );
  }

  return null;
}
