import * as React from "react";
import { cn } from "@restoran/utils";

interface StickerProps extends Omit<React.ImgHTMLAttributes<HTMLImageElement>, "src" | "width" | "height"> {
  name: string;
  size?: number;
}

export function Sticker({ name, size = 72, className, style, ...props }: StickerProps) {
  return (
    // eslint-disable-next-line @next/next/no-img-element -- hazır WebP stiker, next/image optimallaşdırmasına ehtiyac yoxdur
    <img
      src={`/stickers/${name}.webp`}
      alt=""
      aria-hidden="true"
      loading="lazy"
      decoding="async"
      className={cn("h-auto w-auto select-none object-contain", className)}
      style={{ maxWidth: size, maxHeight: size, ...style }}
      {...props}
    />
  );
}
