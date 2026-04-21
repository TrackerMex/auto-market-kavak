import { useMemo, useState } from "react";

import kavakLogo from "@/assets/logo_kavak.svg?url";
import secondaryLogo from "@/assets/logo.svg?url";
import { ThemeToggle } from "@/components/dashboard/theme-toggle";
import { SectionCards } from "@/components/section-cards";
import { Button } from "@/components/ui/button";
import { useInstallations } from "@/hooks/use-installations";
import { readDashboardFiltersPreferences } from "@/lib/cache/dashboard-filters-preferences";
import {
  applyDashboardFilters,
  computeDashboardMetrics,
  type DashboardFilters,
} from "@/lib/dashboard-analytics";
import { InstallationsDataTable } from "@/components/table/installations-data-table";
import type { Installation } from "@/types/installation";

const DEFAULT_FILTERS: DashboardFilters = {
  dateRange: "ALL",
  status: "ALL",
  technician: "",
  project: "",
};

const EMPTY_INSTALLATIONS: Installation[] = [];

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

  const metrics = useMemo(
    () => computeDashboardMetrics(filteredInstallations),
    [filteredInstallations],
  );

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
              className="h-12 w-auto max-w-full shrink-0 dark:invert sm:h-14"
            />
          </div>
          <div>
            <img
              src={secondaryLogo}
              alt="Logo Auto Market"
              width={420}
              height={70}
              className="h-10 w-auto max-w-full shrink-0 invert dark:invert-0 sm:h-12"
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

        {error ? (
          <p className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
            {error}
          </p>
        ) : null}
      </section>

      <SectionCards metrics={metrics} />

      <section id="tabla">
        <InstallationsDataTable rows={filteredInstallations} isLoading={isLoading} />
      </section>
    </main>
  );
}
