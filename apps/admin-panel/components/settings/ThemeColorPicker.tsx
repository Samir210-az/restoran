"use client";

import { useState } from "react";

const PRESETS = ["#B48428", "#2563EB", "#DC2626", "#16A34A", "#7C3AED", "#DB2777", "#EA580C", "#0891B2"];

/**
 * Server action-a "theme_color" adli GIZLI input vasitesile deyer
 * ötürür - form-un ozu server component-de (page.tsx) qalir, YALNIZ
 * bu kicik hisse client-dir (React state teleb etdiyi ucun).
 */
export function ThemeColorPicker({ defaultValue }: { defaultValue: string }) {
  const [color, setColor] = useState(defaultValue);

  return (
    <div>
      <p className="mb-2 text-sm font-medium text-text-primary">Tema rəngi</p>
      <p className="mb-3 text-xs text-text-secondary">Müştəri sizin menyu səhifənizə girəndə görəcəyi əsas rəng</p>
      <div className="flex flex-wrap items-center gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset}
            type="button"
            onClick={() => setColor(preset)}
            aria-label={`Rəngi seç: ${preset}`}
            aria-pressed={color.toLowerCase() === preset.toLowerCase()}
            className="h-8 w-8 rounded-full border-2 transition-transform hover:scale-110"
            style={{
              backgroundColor: preset,
              borderColor: color.toLowerCase() === preset.toLowerCase() ? "rgb(var(--text-primary))" : "transparent",
            }}
          />
        ))}
        <input
          type="color"
          value={color}
          onChange={(e) => setColor(e.target.value)}
          aria-label="Fərdi rəng seç"
          className="h-8 w-11 cursor-pointer rounded-md border border-border-strong bg-transparent p-0.5"
        />
        <span className="font-mono text-xs text-text-muted">{color.toUpperCase()}</span>
      </div>
      <input type="hidden" name="theme_color" value={color} />
    </div>
  );
}
