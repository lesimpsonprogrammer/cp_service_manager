"use client";

import { useState } from "react";
import { cn } from "@/lib/utils/cn";

export interface JarenVortexSettings {
  enabled: boolean;
  opacity: number;
  speed: number;
  density: number;
}

export const JAREN_VORTEX_DEFAULTS: JarenVortexSettings = {
  enabled: true,
  opacity: 0.55,
  speed: 1,
  density: 620,
};

const STORAGE_KEY = "jarenVortexSettings";

export function readJarenVortexSettings(): JarenVortexSettings {
  if (typeof localStorage === "undefined") return JAREN_VORTEX_DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return JAREN_VORTEX_DEFAULTS;
    return { ...JAREN_VORTEX_DEFAULTS, ...(JSON.parse(saved) as Partial<JarenVortexSettings>) };
  } catch {
    return JAREN_VORTEX_DEFAULTS;
  }
}

function writeJarenVortexSettings(settings: JarenVortexSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
  window.dispatchEvent(new CustomEvent("jaren-vortex-settings", { detail: settings }));
}

export function JarenBackgroundControls() {
  const [settings, setSettings] = useState<JarenVortexSettings>(readJarenVortexSettings);

  function update(next: Partial<JarenVortexSettings>) {
    const merged = { ...settings, ...next };
    setSettings(merged);
    writeJarenVortexSettings(merged);
  }

  return (
    <div className="space-y-4 text-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground">Chat background</p>
          <p className="text-xs text-muted">Show the ambient star-vortex behind the Jaren chat panel.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => update({ enabled: !settings.enabled })}
          className={cn(
            "relative h-6 w-11 shrink-0 rounded-full transition-colors",
            settings.enabled ? "bg-brand" : "bg-surface-2 border border-border"
          )}
        >
          <span
            className={cn(
              "absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform",
              settings.enabled ? "translate-x-[22px]" : "translate-x-0.5"
            )}
          />
        </button>
      </div>

      <div className={cn("space-y-4", !settings.enabled && "pointer-events-none opacity-40")}>
        <label className="block">
          <span className="flex items-center justify-between text-xs text-muted">
            Opacity
            <span>{settings.opacity.toFixed(2)}</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.01}
            value={settings.opacity}
            onChange={(e) => update({ opacity: Number(e.target.value) })}
            className="mt-1 w-full accent-brand"
          />
        </label>

        <label className="block">
          <span className="flex items-center justify-between text-xs text-muted">
            Speed
            <span>{settings.speed.toFixed(2)}×</span>
          </span>
          <input
            type="range"
            min={0.1}
            max={3}
            step={0.1}
            value={settings.speed}
            onChange={(e) => update({ speed: Number(e.target.value) })}
            className="mt-1 w-full accent-brand"
          />
        </label>

        <label className="block">
          <span className="flex items-center justify-between text-xs text-muted">
            Density
            <span>{settings.density}</span>
          </span>
          <input
            type="range"
            min={100}
            max={1200}
            step={20}
            value={settings.density}
            onChange={(e) => update({ density: Number(e.target.value) })}
            className="mt-1 w-full accent-brand"
          />
        </label>
      </div>
    </div>
  );
}
