"use client";

import { useEffect, useState } from "react";
import { Download, Share } from "lucide-react";

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: "accepted" | "dismissed" }>;
}

/**
 * PWA "install" duymesi. Chrome/Edge/Android `beforeinstallprompt`
 * hadisesini avtomatik atir (service worker + manifest movcud olanda -
 * bax: next.config.js-deki next-pwa). iOS Safari-de bu hadise HEC VAXT
 * atilmir (Apple-in mehdudiyyeti) - ona gore orada aciqlayici metn
 * gosterilir ("Paylaş > Ana ekrana elave et"), duyme yox.
 */
export function InstallAppLink() {
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

  // Artiq tetbiq kimi acilibsa (Ana ekrandan) - install teklifi lazim deyil
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
        className="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-accent hover:underline"
      >
        <Download className="h-3.5 w-3.5" aria-hidden="true" />
        Tətbiqi yüklə
      </button>
    );
  }

  if (isIOS) {
    return (
      <p className="mt-2 inline-flex items-center gap-1.5 text-xs text-text-muted">
        <Share className="h-3.5 w-3.5" aria-hidden="true" />
        Paylaş → &quot;Ana ekrana əlavə et&quot; ilə tətbiq kimi yükləyin
      </p>
    );
  }

  return null;
}
