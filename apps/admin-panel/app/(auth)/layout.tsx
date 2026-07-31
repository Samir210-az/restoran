import { ThemeToggle } from "@restoran/ui";
import { InstallAppLink } from "@/components/layout/InstallAppLink";

/**
 * Auth sehifeleri (login/register) ucun ayrica, sadeleşdirilmiş layout -
 * sidebar/topbar olmadan, tek bir merkezlesdirilmis kart.
 */
export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden bg-bg px-4">
      {/* Fon dekorasiyasi - premium hiss ucun yumsaq gradient */}
      <div
        className="pointer-events-none absolute inset-0 opacity-40"
        style={{
          background:
            "radial-gradient(circle at 20% 20%, rgb(var(--accent) / 0.15), transparent 40%), radial-gradient(circle at 80% 80%, rgb(var(--accent) / 0.1), transparent 40%)",
        }}
        aria-hidden="true"
      />

      <div className="absolute right-4 top-4">
        <ThemeToggle />
      </div>

      <div className="relative z-10 w-full max-w-md">
        <div className="mb-8 text-center">
          <span className="text-2xl font-semibold tracking-tight text-text-primary">
            Restoran<span className="text-accent">.</span>
          </span>
        </div>
        <div className="glass-panel animate-slide-up rounded-xl p-8 shadow-elevated">
          {children}
        </div>
        <div className="mt-4 text-center">
          <InstallAppLink variant="centered" />
        </div>
      </div>
    </div>
  );
}
