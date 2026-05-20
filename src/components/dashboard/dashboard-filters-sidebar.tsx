import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { DashboardDateRange, DashboardFilters, DashboardStatusFilter } from "@/lib/dashboard-analytics";

const FILTERS_PANEL_STORAGE_KEY = "auto-market-kavak:filters-panel-collapsed";

const DATE_RANGE_OPTIONS: Array<{ value: DashboardDateRange; label: string }> = [
  { value: "ALL", label: "Todo el historico" },
  { value: "7D", label: "Ultimos 7 dias" },
  { value: "30D", label: "Ultimos 30 dias" },
  { value: "90D", label: "Ultimos 90 dias" },
];

const STATUS_OPTIONS: Array<{ value: DashboardStatusFilter; label: string }> = [
  { value: "ALL", label: "Todos" },
  { value: "PROGRAMADO", label: "Programado" },
  { value: "ATRASADO", label: "Atrasado" },
  { value: "EN_PROCESO", label: "En Proceso" },
  { value: "EN_PROCESO_DESFASADO", label: "En Proceso (Desfasado)" },
  { value: "FINALIZADO_A_TIEMPO", label: "Finalizado (A Tiempo)" },
  { value: "FINALIZADO_DESFASADO", label: "Finalizado (Desfasado)" },
];

const FILTER_PRESETS: Array<{ label: string; value: DashboardFilters }> = [
  {
    label: "Todo",
    value: { dateRange: "ALL", status: "ALL", technician: "", project: "" },
  },
  {
    label: "Atrasados 7d",
    value: { dateRange: "7D", status: "ATRASADO", technician: "", project: "" },
  },
  {
    label: "En Proceso 30d",
    value: { dateRange: "30D", status: "EN_PROCESO", technician: "", project: "" },
  },
];

interface DashboardFiltersSidebarProps {
  filters: DashboardFilters;
  onFiltersChange: (nextValue: DashboardFilters) => void;
  technicianOptions: string[];
  projectOptions: string[];
  resultsCount: number;
  totalCount: number;
}

function readCollapsedState(): boolean {
  if (typeof window === "undefined") {
    return false;
  }

  try {
    return window.localStorage.getItem(FILTERS_PANEL_STORAGE_KEY) === "1";
  } catch {
    return false;
  }
}

export function DashboardFiltersSidebar({
  filters,
  onFiltersChange,
  technicianOptions,
  projectOptions,
  resultsCount,
  totalCount,
}: DashboardFiltersSidebarProps) {
  const [isCollapsed, setIsCollapsed] = useState(readCollapsedState);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    try {
      window.localStorage.setItem(FILTERS_PANEL_STORAGE_KEY, isCollapsed ? "1" : "0");
    } catch {
      // Ignore localStorage errors.
    }
  }, [isCollapsed]);

  return (
    <Card className="h-fit" id="filtros">
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div>
            <CardTitle>Filtros</CardTitle>
            <CardDescription>Aplica presets o filtros especificos para analitica y tabla.</CardDescription>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() => {
              setIsCollapsed((current) => !current);
            }}
          >
            {isCollapsed ? "Mostrar" : "Ocultar"}
          </Button>
        </div>
      </CardHeader>

      {!isCollapsed ? (
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <p className="text-xs font-semibold tracking-wide uppercase">Presets</p>
            <div className="flex flex-wrap gap-2">
              {FILTER_PRESETS.map((preset) => (
                <Button
                  key={preset.label}
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    onFiltersChange(preset.value);
                  }}
                >
                  {preset.label}
                </Button>
              ))}
            </div>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide uppercase">Rango de fecha</p>
            <Select
              value={filters.dateRange}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }

                onFiltersChange({
                  ...filters,
                  dateRange: value as DashboardDateRange,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Selecciona un rango" />
              </SelectTrigger>
              <SelectContent>
                {DATE_RANGE_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide uppercase">Estatus</p>
            <Select
              value={filters.status}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }

                onFiltersChange({
                  ...filters,
                  status: value as DashboardStatusFilter,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide uppercase">Tecnico</p>
            <Select
              value={filters.technician || "ALL"}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }

                onFiltersChange({
                  ...filters,
                  technician: value === "ALL" ? "" : value,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {technicianOptions.map((technician) => (
                  <SelectItem key={technician} value={technician}>
                    {technician}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1.5">
            <p className="text-xs font-semibold tracking-wide uppercase">Proyecto</p>
            <Select
              value={filters.project || "ALL"}
              onValueChange={(value) => {
                if (!value) {
                  return;
                }

                onFiltersChange({
                  ...filters,
                  project: value === "ALL" ? "" : value,
                });
              }}
            >
              <SelectTrigger className="w-full">
                <SelectValue placeholder="Todos" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ALL">Todos</SelectItem>
                {projectOptions.map((project) => (
                  <SelectItem key={project} value={project}>
                    {project}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="text-muted-foreground rounded-lg border border-border bg-muted/35 px-3 py-2 text-xs">
            Mostrando {resultsCount.toLocaleString("es-MX")} de {totalCount.toLocaleString("es-MX")} registros.
          </div>
        </CardContent>
      ) : null}
    </Card>
  );
}
