import { useMemo, useState } from "react";

import kavakLogo from "@/assets/logo_kavak.svg?url";
import secondaryLogo from "@/assets/logo.svg?url";
import { DownloadIcon } from "lucide-react";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { SectionCards } from "@/components/section-cards";
import { VerticalBarCharts } from "@/components/charts/vertical-bar-charts";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useInstallations } from "@/hooks/use-installations";
import { readDashboardFiltersPreferences } from "@/lib/cache/dashboard-filters-preferences";
import {
  applyDashboardFilters,
  buildProjectProgressData,
  buildStatusChartData,
  buildTimelineData,
  buildTimelineDataForDateRange,
  computeDashboardMetrics,
  type DashboardFilters,
} from "@/lib/dashboard-analytics";
import { exportInstallationsToExcel } from "@/lib/utils/export-utils";
import { InstallationsDataTable } from "@/components/table/installations-data-table";
import type { Installation } from "@/types/installation";

const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: "ALL",
  status: "ALL",
  technician: "",
  project: "",
};

const EMPTY_INSTALLATIONS: Installation[] = [];

function parseDateCell(rawValue: string): Date | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  const nativeDate = new Date(value);
  if (Number.isFinite(nativeDate.getTime())) {
    return nativeDate;
  }

  const normalized = value.replace(/\s+/g, " ");
  const match = normalized.match(
    /^(\d{1,2})[./-](\d{1,2})[./-](\d{2,4})(?:[ T](\d{1,2}):(\d{2})(?::(\d{2}))?)?$/,
  );

  if (!match) {
    return null;
  }

  const day = Number(match[1]);
  const month = Number(match[2]);
  const rawYear = Number(match[3]);
  const year = rawYear < 100 ? 2000 + rawYear : rawYear;
  const hour = Number(match[4] ?? 0);
  const minute = Number(match[5] ?? 0);
  const second = Number(match[6] ?? 0);

  const parsedDate = new Date(year, month - 1, day, hour, minute, second);
  return Number.isFinite(parsedDate.getTime()) ? parsedDate : null;
}

function getReferenceDate(installation: Installation): Date | null {
  return (
    parseDateCell(installation.fechaCita) ??
    parseDateCell(installation.fechaHoraCheckin) ??
    parseDateCell(installation.fechaCheckout)
  );
}

function parseInputDate(value: string, endOfDay: boolean): Date | null {
  if (!value) {
    return null;
  }

  const match = value.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!match) {
    return null;
  }

  const year = Number(match[1]);
  const month = Number(match[2]);
  const day = Number(match[3]);

  return endOfDay
    ? new Date(year, month - 1, day, 23, 59, 59, 999)
    : new Date(year, month - 1, day, 0, 0, 0, 0);
}

function getDateBounds(installations: Installation[]) {
  let earliest: Date | null = null;
  let latest: Date | null = null;

  for (const installation of installations) {
    const referenceDate = getReferenceDate(installation);
    if (!referenceDate) {
      continue;
    }

    if (!earliest || referenceDate.getTime() < earliest.getTime()) {
      earliest = referenceDate;
    }

    if (!latest || referenceDate.getTime() > latest.getTime()) {
      latest = referenceDate;
    }
  }

  return { earliest, latest };
}

function formatDateTime(timestamp: number) {
  try {
    return new Intl.DateTimeFormat("es-MX", {
      dateStyle: "short",
      timeStyle: "short",
    }).format(timestamp);
  } catch {
    return "-";
  }
}

function formatExportFilename() {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `kavak_instalaciones_${year}${month}${day}`;
}

export function InstallationsDashboard() {
  const { data, error, hasChanges, isLoading, sync } = useInstallations();
  const installations = useMemo(
    () => data?.installations ?? EMPTY_INSTALLATIONS,
    [data?.installations],
  );

  const [filters] = useState<DashboardFilters>(() => {
    if (typeof window === "undefined") {
      return DEFAULT_FILTERS;
    }

    return readDashboardFiltersPreferences() ?? DEFAULT_FILTERS;
  });

  const filteredInstallations = useMemo(
    () => applyDashboardFilters(installations, filters),
    [installations, filters],
  );

  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");

  const dateFilteredInstallations = useMemo(() => {
    const start = parseInputDate(startDate, false);
    const end = parseInputDate(endDate, true);

    if (!start && !end) {
      return filteredInstallations;
    }

    return filteredInstallations.filter((installation) => {
      const referenceDate = getReferenceDate(installation);
      if (!referenceDate) {
        return false;
      }

      if (start && referenceDate.getTime() < start.getTime()) {
        return false;
      }

      if (end && referenceDate.getTime() > end.getTime()) {
        return false;
      }

      return true;
    });
  }, [endDate, filteredInstallations, startDate]);

  const metrics = useMemo(
    () => computeDashboardMetrics(dateFilteredInstallations),
    [dateFilteredInstallations],
  );

  const statusChartData = useMemo(
    () => buildStatusChartData(dateFilteredInstallations),
    [dateFilteredInstallations],
  );

  const projectProgressData = useMemo(
    () => buildProjectProgressData(dateFilteredInstallations),
    [dateFilteredInstallations],
  );

  const timelineData = useMemo(() => {
    const start = parseInputDate(startDate, false);
    const end = parseInputDate(endDate, true);

    if (!start && !end) {
      return buildTimelineData(dateFilteredInstallations);
    }

    const { earliest, latest } = getDateBounds(dateFilteredInstallations);
    const rangeStart = start ?? earliest;
    const rangeEnd = end ?? latest;

    if (!rangeStart || !rangeEnd || rangeStart.getTime() > rangeEnd.getTime()) {
      return [];
    }

    return buildTimelineDataForDateRange(dateFilteredInstallations, rangeStart, rangeEnd);
  }, [dateFilteredInstallations, endDate, startDate]);

  const handleExportExcel = () => {
    const filename = formatExportFilename();
    exportInstallationsToExcel(dateFilteredInstallations, filename);
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-4 p-4 md:p-6">
      <header className="bg-background/95 border-border sticky top-0 z-20 flex flex-col gap-3 rounded-xl border p-4 backdrop-blur sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="truncate text-base font-semibold md:text-lg">
            Instalaciones GPS - Kavak Auto Market
          </h1>
        </div>
        <div className="grid w-full grid-cols-2 gap-2 sm:flex sm:w-auto sm:items-center">
          <ThemeToggle />
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="h-11 w-full sm:h-7 sm:w-auto"
            onClick={() => {
              void sync();
            }}
          >
            Actualizar
          </Button>
        </div>
      </header>

      <section
        id="intro"
        className="border-border bg-card space-y-6 rounded-xl border p-4 text-center"
      >
        <div className="flex flex-col items-center gap-4">
          <div className="px-3 py-3">
            <img
              src={kavakLogo}
              alt="Kavak"
              width={304}
              height={80}
              className="h-12 w-auto max-w-full shrink-0 sm:h-14 dark:invert"
            />
          </div>
          <div>
            <img
              src={secondaryLogo}
              alt="Logo Auto Market"
              width={420}
              height={70}
              className="h-10 w-auto max-w-full shrink-0 invert sm:h-12 dark:invert-0"
            />
          </div>
        </div>
      </section>

      <section id="resumen" className="border-border bg-card space-y-3 rounded-xl border p-4">
        <div className="text-muted-foreground flex flex-wrap items-center gap-2 text-sm">
          <span>{isLoading ? "Sincronizando datos..." : "Datos sincronizados"}</span>
          {data?.fetchedAt ? <span>Ultima lectura: {formatDateTime(data.fetchedAt)}</span> : null}
          {hasChanges ? (
            <span className="rounded-md border border-emerald-200 bg-emerald-50 px-2 py-0.5 font-medium text-emerald-700">
              Cambios detectados
            </span>
          ) : null}
        </div>

        <div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto] sm:items-end">
          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Fecha inicial</span>
            <Input
              type="date"
              value={startDate}
              max={endDate || undefined}
              onChange={(event) => {
                setStartDate(event.target.value);
              }}
            />
          </label>

          <label className="space-y-1 text-sm">
            <span className="text-muted-foreground">Fecha final</span>
            <Input
              type="date"
              value={endDate}
              min={startDate || undefined}
              onChange={(event) => {
                setEndDate(event.target.value);
              }}
            />
          </label>

          <Button
            type="button"
            variant="outline"
            onClick={() => {
              setStartDate("");
              setEndDate("");
            }}
            disabled={!startDate && !endDate}
          >
            Limpiar fechas
          </Button>
        </div>

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      <SectionCards metrics={metrics} />

      <section id="graficas">
        <VerticalBarCharts
          statusData={statusChartData}
          projectData={projectProgressData}
          timelineData={timelineData}
        />
      </section>

      <section id="tabla">
        <div className="flex justify-end pb-2">
          <Button
            type="button"
            variant="default"
            size="sm"
            className="h-11 gap-2"
            onClick={handleExportExcel}
            disabled={dateFilteredInstallations.length === 0}
          >
            <DownloadIcon className="h-4 w-4" />
            Exportar Excel
          </Button>
        </div>
        <InstallationsDataTable rows={dateFilteredInstallations} isLoading={isLoading} />
      </section>
    </main>
  );
}
