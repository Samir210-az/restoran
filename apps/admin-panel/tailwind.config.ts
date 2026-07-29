import type { Config } from "tailwindcss";
import sharedPreset from "@restoran/ui/tailwind-preset.js";

const config: Config = {
  presets: [sharedPreset as Partial<Config>],
  content: [
    "./app/**/*.{ts,tsx}",
    "./components/**/*.{ts,tsx}",
    "../../packages/ui/src/**/*.{ts,tsx}",
  ],
};

export default config;
