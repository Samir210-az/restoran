import type { Metadata } from "next";
import { ThemeProvider } from "@restoran/ui";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "Restoran — İdarəetmə Paneli",
    template: "%s | Restoran",
  },
  description: "AI dəstəkli restoran idarəetmə platforması",
};

/**
 * Inline script <head>-de theme class-ini React hydrate olmazdan EVVEL
 * teyin edir. Bu olmasa, sehife ilk aciqlanan (light) rengde yuklenib,
 * sonra qaranliga "sicrayir" (FOUC - flash of unstyled content).
 */
const THEME_INIT_SCRIPT = `
(function() {
  try {
    var stored = localStorage.getItem('restoran-theme');
    var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
    var theme = stored || (prefersDark ? 'dark' : 'light');
    if (theme === 'dark') document.documentElement.classList.add('dark');
  } catch (e) {}
})();
`;

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="az" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="min-h-screen bg-bg text-text-primary antialiased">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
