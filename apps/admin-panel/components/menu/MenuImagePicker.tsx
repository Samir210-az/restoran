"use client";

import { useRef, useState } from "react";
import { STICKER_NAMES } from "@/lib/sticker-library";

export function MenuImagePicker({ currentUrl }: { currentUrl?: string | null }) {
  const [sticker, setSticker] = useState("");
  const [open, setOpen] = useState(false);
  const [fileName, setFileName] = useState("");
  const fileInput = useRef<HTMLInputElement>(null);

  return (
    <div className="flex w-full flex-col gap-2">
      <input type="hidden" name="sticker" value={fileName ? "" : sticker} />

      <label className="flex flex-col gap-1 text-xs text-text-secondary">
        Telefondan şəkil yüklə
        <input
          ref={fileInput}
          type="file"
          name="image"
          accept="image/png,image/jpeg,image/webp"
          aria-label="Yeməyin şəkli"
          onChange={(e) => {
            const name = e.target.files?.[0]?.name ?? "";
            setFileName(name);
            if (name) setSticker("");
          }}
          className="w-full min-w-0 text-xs file:mr-3 file:rounded-md file:border-0 file:bg-accent-soft file:px-3 file:py-1.5 file:text-xs file:font-medium file:text-accent"
        />
      </label>

      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex items-center gap-2 self-start rounded-md border border-border-strong px-3 py-1.5 text-xs font-medium text-text-secondary hover:bg-bg-muted"
      >
        {sticker ? (
          // eslint-disable-next-line @next/next/no-img-element -- kiçik önizləmə
          <img src={`/stickers/${sticker}.webp`} alt="" className="h-6 w-6 object-contain" />
        ) : null}
        {sticker ? "Seçilmiş stiker" : "Hazır stikerlərdən seç"}
      </button>

      {open && (
        <div className="grid max-h-56 grid-cols-4 gap-2 overflow-y-auto rounded-lg border border-border p-2">
          {STICKER_NAMES.map((name) => (
            <button
              key={name}
              type="button"
              onClick={() => {
                setSticker(name === sticker ? "" : name);
                if (name !== sticker) {
                  setFileName("");
                  if (fileInput.current) fileInput.current.value = "";
                }
              }}
              aria-label={`Stiker: ${name}`}
              aria-pressed={sticker === name}
              className={`flex aspect-square items-center justify-center rounded-md border p-1 ${
                sticker === name ? "border-accent bg-accent-soft" : "border-border hover:bg-bg-muted"
              }`}
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- kiçik önizləmə */}
              <img src={`/stickers/${name}.webp`} alt="" loading="lazy" className="h-full w-full object-contain" />
            </button>
          ))}
        </div>
      )}

      {currentUrl ? <p className="text-xs text-text-muted">Yeni şəkil və ya stiker seçməsən, mövcud şəkil qalır</p> : null}
    </div>
  );
}
