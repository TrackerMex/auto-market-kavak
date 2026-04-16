import { INSTALLATIONS_TABLE_PREFERENCES_KEY } from "@/lib/constants";
import type { InstallationColumnKey } from "@/lib/installations-columns";

export interface InstallationsTablePreferencesRecord {
  columnOrder: InstallationColumnKey[];
  hiddenColumns: InstallationColumnKey[];
}

function isBrowserEnvironment() {
  return typeof window !== "undefined" && typeof window.localStorage !== "undefined";
}

export function readInstallationsTablePreferences(): InstallationsTablePreferencesRecord | null {
  if (!isBrowserEnvironment()) {
    return null;
  }

  const rawPreferences = window.localStorage.getItem(INSTALLATIONS_TABLE_PREFERENCES_KEY);
  if (!rawPreferences) {
    return null;
  }

  try {
    return JSON.parse(rawPreferences) as InstallationsTablePreferencesRecord;
  } catch {
    window.localStorage.removeItem(INSTALLATIONS_TABLE_PREFERENCES_KEY);
    return null;
  }
}

export function writeInstallationsTablePreferences(data: InstallationsTablePreferencesRecord) {
  if (!isBrowserEnvironment()) {
    return;
  }

  window.localStorage.setItem(INSTALLATIONS_TABLE_PREFERENCES_KEY, JSON.stringify(data));
}
