export interface JarenVortexSettings {
  enabled: boolean;
  opacity: number;
}

const STORAGE_KEY = "jaren-vortex-settings";
export const JAREN_VORTEX_DEFAULTS: JarenVortexSettings = { enabled: true, opacity: 0.55 };

export function readJarenVortexSettings(): JarenVortexSettings {
  if (typeof localStorage === "undefined") return JAREN_VORTEX_DEFAULTS;
  try {
    const saved = localStorage.getItem(STORAGE_KEY);
    if (!saved) return JAREN_VORTEX_DEFAULTS;
    const parsed = JSON.parse(saved) as Partial<JarenVortexSettings>;
    return {
      enabled: typeof parsed.enabled === "boolean" ? parsed.enabled : JAREN_VORTEX_DEFAULTS.enabled,
      opacity: typeof parsed.opacity === "number" ? parsed.opacity : JAREN_VORTEX_DEFAULTS.opacity,
    };
  } catch {
    return JAREN_VORTEX_DEFAULTS;
  }
}

export function writeJarenVortexSettings(settings: JarenVortexSettings) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
}
