import type { OperationalStatus } from "@/types/installation";

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
export const DASHBOARD_FILTERS_PREFERENCES_KEY = "auto-market-kavak:dashboard-filters";
export const THEME_STORAGE_KEY = "auto-market-kavak:theme";
export const CACHE_TTL_MS = POLLING_INTERVAL_MS;
export const REQUEST_THROTTLE_MS = 10 * 1000;
export const TABLE_VIRTUAL_ROW_HEIGHT = 56;
export const TABLE_VIRTUAL_VIEWPORT_HEIGHT = 540;
export const SEARCH_DEBOUNCE_MS = 220;

export const STATUS_LABELS: Record<OperationalStatus, string> = {
  PROGRAMADO: "Programado",
  ATRASADO: "Atrasado",
  EN_PROCESO: "En Proceso",
  EN_PROCESO_DESFASADO: "En Proceso (Desfasado)",
  FINALIZADO_A_TIEMPO: "Finalizado",
  FINALIZADO_DESFASADO: "Finalizado (Desfasado)",
};

export const STATUS_BADGE_STYLES: Record<OperationalStatus, string> = {
  PROGRAMADO: "border-blue-200 bg-blue-50 text-blue-700 dark:border-blue-900/30 dark:bg-blue-950/20 dark:text-blue-400",
  ATRASADO: "border-rose-200 bg-rose-50 text-rose-700 dark:border-rose-900/30 dark:bg-rose-950/20 dark:text-rose-400",
  EN_PROCESO: "border-indigo-200 bg-indigo-50 text-indigo-700 dark:border-indigo-900/30 dark:bg-indigo-950/20 dark:text-indigo-400",
  EN_PROCESO_DESFASADO: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-900/30 dark:bg-amber-950/20 dark:text-amber-400",
  FINALIZADO_A_TIEMPO: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-900/30 dark:bg-emerald-950/20 dark:text-emerald-400",
  FINALIZADO_DESFASADO: "border-yellow-200 bg-yellow-50 text-yellow-700 dark:border-yellow-900/30 dark:bg-yellow-950/20 dark:text-yellow-400",
};
