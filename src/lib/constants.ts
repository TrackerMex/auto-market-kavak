import type { InstallationStatus } from "@/types/installation";

export const DEFAULT_POLLING_INTERVAL_MS = 5 * 60 * 1000;

const parsedPollingInterval = Number(
  import.meta.env.PUBLIC_POLLING_INTERVAL || import.meta.env.VITE_POLLING_INTERVAL,
);

export const POLLING_INTERVAL_MS =
  Number.isFinite(parsedPollingInterval) && parsedPollingInterval > 0
    ? parsedPollingInterval
    : DEFAULT_POLLING_INTERVAL_MS;

export const SHEET_NAME =
  import.meta.env.PUBLIC_GOOGLE_SHEET_NAME?.trim() ||
  import.meta.env.VITE_GOOGLE_SHEET_NAME?.trim() ||
  "Auto Market Kavak";
export const SHEET_RANGE =
  import.meta.env.PUBLIC_GOOGLE_SHEET_RANGE?.trim() ||
  import.meta.env.VITE_GOOGLE_SHEET_RANGE?.trim() ||
  "A1:P";

export const INSTALLATIONS_CACHE_KEY = "auto-market-kavak:installations";
export const INSTALLATIONS_TABLE_PREFERENCES_KEY = "auto-market-kavak:table-preferences";
export const CACHE_TTL_MS = POLLING_INTERVAL_MS;
export const REQUEST_THROTTLE_MS = 10 * 1000;
export const TABLE_VIRTUAL_ROW_HEIGHT = 56;
export const TABLE_VIRTUAL_VIEWPORT_HEIGHT = 540;
export const SEARCH_DEBOUNCE_MS = 220;

export const STATUS_LABELS: Record<InstallationStatus, string> = {
  PENDIENTE: "Pendiente",
  FINALIZADO: "Finalizado",
};

export const STATUS_BADGE_STYLES: Record<InstallationStatus, string> = {
  PENDIENTE: "border-yellow-200 bg-yellow-50 text-yellow-700",
  FINALIZADO: "border-green-200 bg-green-50 text-green-700",
};
