import { useEffect, useMemo, useRef, useState } from "react";

import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  SEARCH_DEBOUNCE_MS,
  STATUS_BADGE_STYLES,
  STATUS_LABELS,
  TABLE_VIRTUAL_ROW_HEIGHT,
  TABLE_VIRTUAL_VIEWPORT_HEIGHT,
} from "@/lib/constants";
import {
  INSTALLATION_COLUMN_KEYS,
  INSTALLATION_COLUMNS_BY_KEY,
  type InstallationColumnKey,
  createInstallationSearchIndex,
} from "@/lib/installations-columns";
import {
  readInstallationsTablePreferences,
  writeInstallationsTablePreferences,
} from "@/lib/cache/installations-table-preferences";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import type { Installation, OperationalStatus } from "@/types/installation";

type StatusFilter = "ALL" | OperationalStatus;

const VIRTUAL_OVERSCAN_ROWS = 6;
const SKELETON_ROW_COUNT = 8;
const PAGE_SIZE_OPTIONS = [10, 20, 50, 100, 200, 500] as const;

interface InstallationsDataTableProps {
  rows: Installation[];
  isLoading?: boolean;
}

function isColumnKey(value: string): value is InstallationColumnKey {
  return INSTALLATION_COLUMN_KEYS.includes(value as InstallationColumnKey);
}

function normalizeColumnOrder(order: InstallationColumnKey[]): InstallationColumnKey[] {
  const unique = new Set<InstallationColumnKey>();
  const normalized: InstallationColumnKey[] = [];

  for (const key of order) {
    if (!unique.has(key)) {
      unique.add(key);
      normalized.push(key);
    }
  }

  for (const key of INSTALLATION_COLUMN_KEYS) {
    if (!unique.has(key)) {
      normalized.push(key);
    }
  }

  return normalized;
}

function normalizeHiddenColumns(hidden: InstallationColumnKey[]): InstallationColumnKey[] {
  const unique = new Set<InstallationColumnKey>();
  const normalized: InstallationColumnKey[] = [];

  for (const key of hidden) {
    if (!unique.has(key) && INSTALLATION_COLUMN_KEYS.includes(key)) {
      unique.add(key);
      normalized.push(key);
    }
  }

  return normalized;
}

function getInitialTablePreferences() {
  const storedPreferences = readInstallationsTablePreferences();
  if (!storedPreferences) {
    return {
      columnOrder: [...INSTALLATION_COLUMN_KEYS],
      hiddenColumns: [] as InstallationColumnKey[],
    };
  }

  const storedOrder = Array.isArray(storedPreferences.columnOrder)
    ? storedPreferences.columnOrder
    : [];
  const storedHidden = Array.isArray(storedPreferences.hiddenColumns)
    ? storedPreferences.hiddenColumns
    : [];

  return {
    columnOrder: normalizeColumnOrder(
      storedOrder.filter((key): key is InstallationColumnKey => isColumnKey(key)),
    ),
    hiddenColumns: normalizeHiddenColumns(
      storedHidden.filter((key): key is InstallationColumnKey => isColumnKey(key)),
    ),
  };
}

function renderCellValue(item: Installation, key: InstallationColumnKey) {
  switch (key) {
    case "estatusFinal": {
      return (
        <span
          className={cn(
            "inline-flex rounded-md border px-2 py-1 text-xs font-medium shrink-0 whitespace-nowrap",
            STATUS_BADGE_STYLES[item.estatusOperativo],
          )}
        >
          {STATUS_LABELS[item.estatusOperativo]}
        </span>
      );
    }

    case "porcentajeAvance": {
      return (
        <div className="flex min-w-0 items-center gap-2">
          <div className="h-2 w-20 overflow-hidden rounded-full bg-muted md:w-24">
            <div
              className="h-full rounded-full bg-emerald-500"
              style={{ width: `${item.porcentajeAvance}%` }}
            />
          </div>
          <span className="text-xs font-medium tabular-nums text-muted-foreground">
            {item.porcentajeAvance}%
          </span>
        </div>
      );
    }

    case "vin":
      return <span className="font-mono text-xs tracking-tight">{item.vin || "-"}</span>;

    case "coordenadasCheckin": {
      if (!item.coordenadasCheckin) {
        return "-";
      }

      return `${item.coordenadasCheckin.lat}, ${item.coordenadasCheckin.lng}`;
    }

    case "coordenadasCheckout": {
      if (!item.coordenadasCheckout) {
        return "-";
      }

      return `${item.coordenadasCheckout.lat}, ${item.coordenadasCheckout.lng}`;
    }

    default: {
      const value = item[key];
      if (typeof value === "string") {
        return value || "-";
      }

      return "-";
    }
  }
}

function getStatusFilterClass(isActive: boolean) {
  return isActive
    ? "border-emerald-300 bg-emerald-50 text-emerald-700"
    : "border-border bg-background text-muted-foreground hover:bg-muted";
}

export function InstallationsDataTable({ rows, isLoading = false }: InstallationsDataTableProps) {
  const [initialPreferences] = useState(getInitialTablePreferences);

  const [searchInput, setSearchInput] = useState("");
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("ALL");
  const [columnOrder, setColumnOrder] = useState<InstallationColumnKey[]>(
    initialPreferences.columnOrder,
  );
  const [hiddenColumns, setHiddenColumns] = useState<InstallationColumnKey[]>(
    initialPreferences.hiddenColumns,
  );
  const [pageSize, setPageSize] = useState<number>(10);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [scrollTop, setScrollTop] = useState(0);

  const viewportRef = useRef<HTMLDivElement | null>(null);
  const searchTerm = useDebouncedValue(searchInput.trim().toLowerCase(), SEARCH_DEBOUNCE_MS);

  useEffect(() => {
    writeInstallationsTablePreferences({
      columnOrder,
      hiddenColumns,
    });
  }, [columnOrder, hiddenColumns]);

  const rowsWithSearchIndex = useMemo(() => {
    return rows.map((row) => ({
      row,
      searchIndex: createInstallationSearchIndex(row),
    }));
  }, [rows]);

  const filteredRows = useMemo(() => {
    return rowsWithSearchIndex
      .filter((entry) => {
        if (statusFilter === "ALL") {
          return true;
        }

        return entry.row.estatusOperativo === statusFilter;
      })
      .filter((entry) => {
        if (!searchTerm) {
          return true;
        }

        return entry.searchIndex.includes(searchTerm);
      })
      .map((entry) => entry.row);
  }, [rowsWithSearchIndex, searchTerm, statusFilter]);

  const statusCounts = useMemo(() => {
    const counts = {
      all: rows.length,
      programado: 0,
      atrasado: 0,
      en_proceso: 0,
      en_proceso_desfasado: 0,
      finalizado_a_tiempo: 0,
      finalizado_desfasado: 0,
    };

    for (const item of rows) {
      if (item.estatusOperativo === "PROGRAMADO") counts.programado += 1;
      else if (item.estatusOperativo === "ATRASADO") counts.atrasado += 1;
      else if (item.estatusOperativo === "EN_PROCESO") counts.en_proceso += 1;
      else if (item.estatusOperativo === "EN_PROCESO_DESFASADO") counts.en_proceso_desfasado += 1;
      else if (item.estatusOperativo === "FINALIZADO_A_TIEMPO") counts.finalizado_a_tiempo += 1;
      else if (item.estatusOperativo === "FINALIZADO_DESFASADO") counts.finalizado_desfasado += 1;
    }

    return counts;
  }, [rows]);

  const visibleColumns = useMemo(() => {
    return columnOrder.filter((key) => !hiddenColumns.includes(key));
  }, [columnOrder, hiddenColumns]);
  const activeColumns = visibleColumns.length > 0 ? visibleColumns : [INSTALLATION_COLUMN_KEYS[0]];

  const totalRows = filteredRows.length;
  const totalPages = Math.max(1, Math.ceil(totalRows / pageSize));
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pageStartIndex = (safeCurrentPage - 1) * pageSize;
  const pageEndIndex = Math.min(totalRows, pageStartIndex + pageSize);
  const paginatedRows = filteredRows.slice(pageStartIndex, pageEndIndex);

  const visibleRowCount =
    Math.ceil(TABLE_VIRTUAL_VIEWPORT_HEIGHT / TABLE_VIRTUAL_ROW_HEIGHT) + VIRTUAL_OVERSCAN_ROWS * 2;
  const totalPageRows = paginatedRows.length;
  const maxStartIndex = Math.max(0, totalPageRows - visibleRowCount);
  const startIndex = Math.min(
    maxStartIndex,
    Math.max(0, Math.floor(scrollTop / TABLE_VIRTUAL_ROW_HEIGHT) - VIRTUAL_OVERSCAN_ROWS),
  );
  const endIndex = Math.min(totalPageRows, startIndex + visibleRowCount);
  const virtualRows = paginatedRows.slice(startIndex, endIndex);
  const topPaddingHeight = startIndex * TABLE_VIRTUAL_ROW_HEIGHT;
  const bottomPaddingHeight = (totalPageRows - endIndex) * TABLE_VIRTUAL_ROW_HEIGHT;

  function toggleColumn(columnKey: InstallationColumnKey) {
    setHiddenColumns((currentHiddenColumns) => {
      if (currentHiddenColumns.includes(columnKey)) {
        return currentHiddenColumns.filter((key) => key !== columnKey);
      }

      const visibleCount = INSTALLATION_COLUMN_KEYS.length - currentHiddenColumns.length;
      if (visibleCount <= 1) {
        return currentHiddenColumns;
      }

      return [...currentHiddenColumns, columnKey];
    });
  }

  function moveColumn(columnKey: InstallationColumnKey, direction: "left" | "right") {
    setColumnOrder((currentOrder) => {
      const index = currentOrder.indexOf(columnKey);
      if (index === -1) {
        return currentOrder;
      }

      const nextIndex = direction === "left" ? index - 1 : index + 1;
      if (nextIndex < 0 || nextIndex >= currentOrder.length) {
        return currentOrder;
      }

      const updated = [...currentOrder];
      const temp = updated[index];
      updated[index] = updated[nextIndex];
      updated[nextIndex] = temp;
      return updated;
    });
  }

  function resetColumns() {
    setColumnOrder([...INSTALLATION_COLUMN_KEYS]);
    setHiddenColumns([]);
  }

  function resetViewportToTop() {
    const viewport = viewportRef.current;
    if (viewport) {
      viewport.scrollTop = 0;
    }
    setScrollTop(0);
  }

  function resetViewportAndPage() {
    resetViewportToTop();
    setCurrentPage(1);
  }

  function goToPage(nextPage: number) {
    const clampedPage = Math.max(1, Math.min(totalPages, nextPage));
    setCurrentPage(clampedPage);
    resetViewportToTop();
  }

  const showSkeletonRows = isLoading && rows.length === 0;

  return (
    <section className="space-y-4 rounded-2xl border border-border bg-card p-3 sm:p-4">
      <div className="flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div className="flex flex-nowrap items-center gap-2 overflow-x-auto pb-1 sm:flex-wrap sm:overflow-visible sm:pb-0">
          <button
            type="button"
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm font-medium sm:min-h-8 sm:py-1.5 sm:text-xs",
              getStatusFilterClass(statusFilter === "ALL"),
            )}
            onClick={() => {
              resetViewportAndPage();
              setStatusFilter("ALL");
            }}
          >
            Todos ({statusCounts.all})
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm font-medium sm:min-h-8 sm:py-1.5 sm:text-xs",
              getStatusFilterClass(statusFilter === "PROGRAMADO"),
            )}
            onClick={() => {
              resetViewportAndPage();
              setStatusFilter("PROGRAMADO");
            }}
          >
            Programado ({statusCounts.programado})
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm font-medium sm:min-h-8 sm:py-1.5 sm:text-xs",
              getStatusFilterClass(statusFilter === "ATRASADO"),
            )}
            onClick={() => {
              resetViewportAndPage();
              setStatusFilter("ATRASADO");
            }}
          >
            Atrasado ({statusCounts.atrasado})
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm font-medium sm:min-h-8 sm:py-1.5 sm:text-xs",
              getStatusFilterClass(statusFilter === "EN_PROCESO"),
            )}
            onClick={() => {
              resetViewportAndPage();
              setStatusFilter("EN_PROCESO");
            }}
          >
            En Proceso ({statusCounts.en_proceso})
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm font-medium sm:min-h-8 sm:py-1.5 sm:text-xs",
              getStatusFilterClass(statusFilter === "EN_PROCESO_DESFASADO"),
            )}
            onClick={() => {
              resetViewportAndPage();
              setStatusFilter("EN_PROCESO_DESFASADO");
            }}
          >
            En Proceso (Desfasado) ({statusCounts.en_proceso_desfasado})
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm font-medium sm:min-h-8 sm:py-1.5 sm:text-xs",
              getStatusFilterClass(statusFilter === "FINALIZADO_A_TIEMPO"),
            )}
            onClick={() => {
              resetViewportAndPage();
              setStatusFilter("FINALIZADO_A_TIEMPO");
            }}
          >
            Finalizado ({statusCounts.finalizado_a_tiempo})
          </button>
          <button
            type="button"
            className={cn(
              "min-h-11 shrink-0 rounded-md border px-3 py-2 text-sm font-medium sm:min-h-8 sm:py-1.5 sm:text-xs",
              getStatusFilterClass(statusFilter === "FINALIZADO_DESFASADO"),
            )}
            onClick={() => {
              resetViewportAndPage();
              setStatusFilter("FINALIZADO_DESFASADO");
            }}
          >
            Finalizado (Desfasado) ({statusCounts.finalizado_desfasado})
          </button>
        </div>

        <div className="flex flex-col gap-2 md:flex-row md:items-center">
          <input
            value={searchInput}
            onChange={(event) => {
              resetViewportAndPage();
              setSearchInput(event.target.value);
            }}
            placeholder="Buscar por VIN, proyecto, tecnico, observaciones..."
            className="h-11 w-full min-w-0 rounded-md border border-border bg-background px-3 text-sm text-foreground outline-none ring-0 transition focus:border-emerald-300 md:min-w-[260px] md:w-[380px] md:text-sm"
            type="search"
          />

          <details className="group relative w-full md:w-auto">
            <summary className="flex h-11 w-full cursor-pointer list-none items-center justify-center rounded-md border border-border bg-background px-3 text-sm font-medium text-foreground transition hover:bg-muted md:h-9 md:w-auto md:text-xs">
              Columnas
            </summary>

            <div className="fixed top-4 right-4 bottom-4 left-4 z-20 overflow-y-auto overscroll-contain rounded-xl border border-border bg-card p-3 shadow-lg md:absolute md:top-11 md:right-0 md:bottom-auto md:left-auto md:z-10 md:max-h-[70vh] md:w-[320px]">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Orden y visibilidad
                </p>
                <button
                  type="button"
                  className="text-xs font-medium text-emerald-700 hover:text-emerald-600"
                  onClick={resetColumns}
                >
                  Restaurar
                </button>
              </div>

              <div className="space-y-2">
                {columnOrder.map((columnKey) => {
                  const column = INSTALLATION_COLUMNS_BY_KEY[columnKey];
                  const isHidden = hiddenColumns.includes(columnKey);
                  const isFirst = columnOrder[0] === columnKey;
                  const isLast = columnOrder[columnOrder.length - 1] === columnKey;

                  return (
                    <div key={columnKey} className="grid grid-cols-[auto_1fr_auto] items-center gap-2">
                      <input
                        type="checkbox"
                        checked={!isHidden}
                        onChange={() => {
                          toggleColumn(columnKey);
                        }}
                        className="size-4 rounded border-border"
                      />
                      <span className="text-xs text-foreground">{column.label}</span>
                      <div className="flex items-center gap-1">
                        <button
                          type="button"
                          className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                          disabled={isFirst}
                          onClick={() => {
                            moveColumn(columnKey, "left");
                          }}
                        >
                          {'<'}
                        </button>
                        <button
                          type="button"
                          className="rounded border border-border px-1.5 py-0.5 text-xs text-muted-foreground hover:bg-muted disabled:opacity-40"
                          disabled={isLast}
                          onClick={() => {
                            moveColumn(columnKey, "right");
                          }}
                        >
                          {'>'}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </details>
        </div>
      </div>

      <div className="flex flex-col gap-1 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
        <span>
          {totalRows === 0
            ? "Mostrando 0 registros"
            : `Mostrando ${pageStartIndex + 1}-${pageEndIndex} de ${totalRows} filtrados (${rows.length} totales)`}
        </span>
        <span className="flex items-center gap-2">
          {isLoading ? <span className="text-emerald-700">Actualizando...</span> : null}
          <span>{`Pagina ${safeCurrentPage} de ${totalPages}`}</span>
        </span>
      </div>

      <div
        ref={viewportRef}
        className="overflow-auto rounded-xl border border-border touch-pan-x"
        onScroll={(event) => {
          setScrollTop(event.currentTarget.scrollTop);
        }}
        style={{ maxHeight: `${TABLE_VIRTUAL_VIEWPORT_HEIGHT}px` }}
      >
        <table className="w-full min-w-max border-separate border-spacing-0 text-sm">
          <thead className="sticky top-0 z-[1] bg-card">
            <tr className="text-left text-xs uppercase tracking-wide text-muted-foreground">
              {activeColumns.map((columnKey) => {
                const column = INSTALLATION_COLUMNS_BY_KEY[columnKey];
                return (
                  <th
                    key={columnKey}
                    className="border-b border-border px-3 py-2.5 font-semibold"
                    style={{ minWidth: `${column.widthPx}px` }}
                  >
                    {column.label}
                  </th>
                );
              })}
            </tr>
          </thead>
          <tbody>
            {showSkeletonRows ? (
              Array.from({ length: SKELETON_ROW_COUNT }).map((_, rowIndex) => (
                <tr key={`skeleton:${rowIndex}`} className="h-14 bg-card even:bg-muted/20">
                  {activeColumns.map((columnKey) => (
                    <td key={`skeleton:${rowIndex}:${columnKey}`} className="border-b border-border px-3 py-2 align-middle">
                      <Skeleton className="h-4 w-full max-w-[220px]" />
                    </td>
                  ))}
                </tr>
              ))
            ) : totalPageRows === 0 ? (
              <tr>
                <td className="px-3 py-12 text-center text-sm text-muted-foreground" colSpan={activeColumns.length}>
                  No hay resultados para el filtro actual.
                </td>
              </tr>
            ) : (
              <>
                {topPaddingHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td style={{ height: `${topPaddingHeight}px` }} colSpan={activeColumns.length} />
                  </tr>
                ) : null}

                {virtualRows.map((item) => (
                  <tr key={item.id} className="h-14 bg-card even:bg-muted/25">
                    {activeColumns.map((columnKey) => {
                      return (
                        <td key={`${item.id}:${columnKey}`} className="border-b border-border px-3 py-2 align-middle">
                          <div className="line-clamp-2">{renderCellValue(item, columnKey)}</div>
                        </td>
                      );
                    })}
                  </tr>
                ))}

                {bottomPaddingHeight > 0 ? (
                  <tr aria-hidden="true">
                    <td style={{ height: `${bottomPaddingHeight}px` }} colSpan={activeColumns.length} />
                  </tr>
                ) : null}
              </>
            )}
          </tbody>
        </table>
      </div>

      <div className="flex flex-col gap-3 border-t border-border pt-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <label htmlFor="rows-per-page">Filas por pagina</label>
          <select
            id="rows-per-page"
            value={String(pageSize)}
            onChange={(event) => {
              const nextSize = Number(event.target.value);
              if (!Number.isFinite(nextSize) || nextSize <= 0) {
                return;
              }

              setPageSize(nextSize);
              setCurrentPage(1);
              resetViewportToTop();
            }}
            className="h-11 rounded-md border border-border bg-background px-2 text-sm text-foreground sm:h-8 sm:text-xs"
          >
            {PAGE_SIZE_OPTIONS.map((option) => (
              <option key={option} value={option}>
                {option}
              </option>
            ))}
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap sm:items-center">
          <button
            type="button"
            className="min-h-11 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 sm:min-h-8 sm:py-1.5 sm:text-xs"
            onClick={() => {
              goToPage(1);
            }}
            disabled={safeCurrentPage === 1}
          >
            Primera
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 sm:min-h-8 sm:py-1.5 sm:text-xs"
            onClick={() => {
              goToPage(safeCurrentPage - 1);
            }}
            disabled={safeCurrentPage === 1}
          >
            Anterior
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 sm:min-h-8 sm:py-1.5 sm:text-xs"
            onClick={() => {
              goToPage(safeCurrentPage + 1);
            }}
            disabled={safeCurrentPage >= totalPages}
          >
            Siguiente
          </button>
          <button
            type="button"
            className="min-h-11 rounded-md border border-border px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-muted disabled:opacity-50 sm:min-h-8 sm:py-1.5 sm:text-xs"
            onClick={() => {
              goToPage(totalPages);
            }}
            disabled={safeCurrentPage >= totalPages}
          >
            Ultima
          </button>
        </div>
      </div>
    </section>
  );
}
