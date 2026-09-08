"use client";

import { useState } from "react";
import {
  readJarenVortexSettings,
  writeJarenVortexSettings,
  type JarenVortexSettings,
} from "@/lib/jaren/vortexSettings";

export function JarenBackgroundSettings() {
  const [settings, setSettings] = useState<JarenVortexSettings>(readJarenVortexSettings);

  function update(next: JarenVortexSettings) {
    setSettings(next);
    writeJarenVortexSettings(next);
  }

  return (
    <div className="space-y-3" suppressHydrationWarning>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-foreground">Animated background</p>
          <p className="text-xs text-muted">Show the star-vortex effect behind Jaren&rsquo;s chat.</p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={settings.enabled}
          onClick={() => update({ ...settings, enabled: !settings.enabled })}
          className={`relative h-6 w-11 shrink-0 rounded-full transition-colors ${
            settings.enabled ? "bg-brand" : "bg-surface-2 border border-border"
          }`}
        >
          <span
            className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform ${
              settings.enabled ? "translate-x-5" : "translate-x-0.5"
            }`}
          />
        </button>
      </div>

      {settings.enabled && (
        <div>
          <div className="flex items-center justify-between">
            <p className="text-xs text-muted">Opacity</p>
            <p className="text-xs text-muted">{Math.round(settings.opacity * 100)}%</p>
          </div>
          <input
            type="range"
            min={0.1}
            max={1}
            step={0.05}
            value={settings.opacity}
            onChange={(e) => update({ ...settings, opacity: Number(e.target.value) })}
            className="w-full"
          />
        </div>
      )}
    </div>
  );
}
