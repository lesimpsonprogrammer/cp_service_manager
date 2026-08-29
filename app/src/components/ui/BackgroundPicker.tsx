"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export const BACKGROUND_PRESETS = [
  {
    name: "Neutral",
    light: { canvas: "0 0% 100%", surface: "0 0% 100%", surface2: "240 5% 97%", border: "240 6% 90%", borderStrong: "240 6% 80%" },
    dark: { canvas: "0 0% 5%", surface: "0 0% 7%", surface2: "0 0% 10%", border: "0 0% 17%", borderStrong: "0 0% 26%" },
  },
  {
    name: "Slate",
    light: { canvas: "220 20% 98%", surface: "220 20% 98%", surface2: "220 16% 94%", border: "220 14% 87%", borderStrong: "220 14% 76%" },
    dark: { canvas: "222 20% 7%", surface: "222 18% 9%", surface2: "222 16% 13%", border: "222 14% 20%", borderStrong: "222 14% 30%" },
  },
  {
    name: "Warm",
    light: { canvas: "30 20% 98%", surface: "30 20% 98%", surface2: "30 16% 94%", border: "30 12% 87%", borderStrong: "30 12% 76%" },
    dark: { canvas: "20 15% 7%", surface: "20 14% 9%", surface2: "20 12% 13%", border: "20 10% 20%", borderStrong: "20 10% 30%" },
  },
] as const;

type BackgroundPreset = (typeof BACKGROUND_PRESETS)[number];

export function applyBackgroundPreset(preset: BackgroundPreset) {
  const isDark = document.documentElement.classList.contains("dark");
  const tokens = isDark ? preset.dark : preset.light;
  document.documentElement.style.setProperty("--canvas", tokens.canvas);
  document.documentElement.style.setProperty("--surface", tokens.surface);
  document.documentElement.style.setProperty("--surface-2", tokens.surface2);
  document.documentElement.style.setProperty("--border", tokens.border);
  document.documentElement.style.setProperty("--border-strong", tokens.borderStrong);
  localStorage.setItem("background", JSON.stringify({ light: preset.light, dark: preset.dark }));
}

function readSelectedPreset(): string {
  if (typeof localStorage === "undefined") return BACKGROUND_PRESETS[0].name;
  try {
    const saved = localStorage.getItem("background");
    if (!saved) return BACKGROUND_PRESETS[0].name;
    const parsed = JSON.parse(saved) as { light: BackgroundPreset["light"]; dark: BackgroundPreset["dark"] };
    const match = BACKGROUND_PRESETS.find(
      (p) => p.light.canvas === parsed.light.canvas && p.dark.canvas === parsed.dark.canvas
    );
    return match ? match.name : BACKGROUND_PRESETS[0].name;
  } catch {
    return BACKGROUND_PRESETS[0].name;
  }
}

export function BackgroundPicker() {
  const [selected, setSelected] = useState<string>(readSelectedPreset);

  return (
    <div className="flex flex-wrap gap-3">
      {BACKGROUND_PRESETS.map((preset) => (
        <button
          key={preset.name}
          type="button"
          onClick={() => {
            applyBackgroundPreset(preset);
            setSelected(preset.name);
          }}
          aria-label={`Use ${preset.name} background`}
          title={preset.name}
          suppressHydrationWarning
          className={cn(
            "flex h-9 items-center gap-2 rounded-md border-2 px-3 text-xs font-medium transition-colors",
            selected === preset.name ? "border-foreground text-foreground" : "border-border text-muted"
          )}
        >
          <span
            className="h-4 w-4 rounded-full border border-border-strong"
            style={{ backgroundColor: `hsl(${preset.dark.surface})` }}
          />
          {preset.name}
        </button>
      ))}
    </div>
  );
}
