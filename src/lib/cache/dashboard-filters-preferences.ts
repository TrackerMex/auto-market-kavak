import { DASHBOARD_FILTERS_PREFERENCES_KEY } from "@/lib/constants";
import type {
  DashboardDateRange,
  DashboardFilters,
  DashboardStatusFilter,
} from "@/lib/dashboard-analytics";

const PREFERENCES_VERSION = 1;

interface DashboardFiltersStorage {
  version: number;
  value: DashboardFilters;
}

const DATE_RANGE_VALUES: DashboardDateRange[] = ["ALL", "7D", "30D", "90D"];
const STATUS_VALUES: DashboardStatusFilter[] = ["ALL", "PENDIENTE", "FINALIZADO"];

function isDateRange(value: unknown): value is DashboardDateRange {
  return DATE_RANGE_VALUES.includes(value as DashboardDateRange);
}

function isStatus(value: unknown): value is DashboardStatusFilter {
  return STATUS_VALUES.includes(value as DashboardStatusFilter);
}

function isString(value: unknown): value is string {
  return typeof value === "string";
}

function safeStorage(): Storage | null {
  if (typeof window === "undefined") {
    return null;
  }

  try {
    return window.localStorage;
  } catch {
    return null;
  }
}

export function readDashboardFiltersPreferences(): DashboardFilters | null {
  const storage = safeStorage();
  if (!storage) {
    return null;
  }

  const raw = storage.getItem(DASHBOARD_FILTERS_PREFERENCES_KEY);
  if (!raw) {
    return null;
  }

  try {
    const parsed = JSON.parse(raw) as Partial<DashboardFiltersStorage>;
    if (parsed.version !== PREFERENCES_VERSION || !parsed.value) {
      return null;
    }

    const { dateRange, status, technician, project } = parsed.value;

    if (!isDateRange(dateRange) || !isStatus(status)) {
      return null;
    }

    if (!isString(technician) || !isString(project)) {
      return null;
    }

    return {
      dateRange,
      status,
      technician,
      project,
    };
  } catch {
    return null;
  }
}

export function writeDashboardFiltersPreferences(value: DashboardFilters): void {
  const storage = safeStorage();
  if (!storage) {
    return;
  }

  const payload: DashboardFiltersStorage = {
    version: PREFERENCES_VERSION,
    value,
  };

  try {
    storage.setItem(DASHBOARD_FILTERS_PREFERENCES_KEY, JSON.stringify(payload));
  } catch {
    // Ignore quota errors.
  }
}
