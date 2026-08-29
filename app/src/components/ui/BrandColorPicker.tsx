"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export const BRAND_PRESETS = [
  { name: "Blue", light: "220 85% 33%", dark: "220 85% 52%" },
  { name: "Purple", light: "262 83% 42%", dark: "262 83% 58%" },
  { name: "Green", light: "152 69% 31%", dark: "152 69% 45%" },
  { name: "Orange", light: "24 90% 40%", dark: "24 90% 55%" },
  { name: "Pink", light: "330 81% 45%", dark: "330 81% 60%" },
  { name: "Teal", light: "173 80% 32%", dark: "173 80% 45%" },
] as const;

function readSelectedPreset(): string {
  if (typeof localStorage === "undefined") return BRAND_PRESETS[0].name;
  try {
    const saved = localStorage.getItem("brandColor");
    if (!saved) return BRAND_PRESETS[0].name;
    const parsed = JSON.parse(saved) as { light: string; dark: string };
    const match = BRAND_PRESETS.find((p) => p.light === parsed.light && p.dark === parsed.dark);
    return match ? match.name : BRAND_PRESETS[0].name;
  } catch {
    return BRAND_PRESETS[0].name;
  }
}

export function applyBrandColor(preset: (typeof BRAND_PRESETS)[number]) {
  const isDark = document.documentElement.classList.contains("dark");
  const hsl = isDark ? preset.dark : preset.light;
  document.documentElement.style.setProperty("--brand", hsl);
  document.documentElement.style.setProperty("--accent", hsl);
  localStorage.setItem("brandColor", JSON.stringify({ light: preset.light, dark: preset.dark }));
}

export function BrandColorPicker() {
  const [selected, setSelected] = useState<string>(readSelectedPreset);

  return (
    <div className="flex flex-wrap gap-3">
      {BRAND_PRESETS.map((preset) => (
        <button
          key={preset.name}
          type="button"
          onClick={() => {
            applyBrandColor(preset);
            setSelected(preset.name);
          }}
          aria-label={`Use ${preset.name} as the accent color`}
          title={preset.name}
          suppressHydrationWarning
          className={cn(
            "flex h-9 w-9 items-center justify-center rounded-full border-2 transition-transform hover:scale-105",
            selected === preset.name ? "border-foreground" : "border-transparent"
          )}
        >
          <span
            className="h-6 w-6 rounded-full"
            style={{ backgroundColor: `hsl(${preset.dark})` }}
          />
        </button>
      ))}
    </div>
  );
}
