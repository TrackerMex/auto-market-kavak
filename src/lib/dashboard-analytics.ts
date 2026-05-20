import type { Installation, InstallationStatus, OperationalStatus } from "@/types/installation";
import { STATUS_LABELS } from "@/lib/constants";

export type DashboardDateRange = "ALL" | "7D" | "30D" | "90D";
export type DashboardStatusFilter = "ALL" | OperationalStatus;

export interface DashboardFilters {
  dateRange: DashboardDateRange;
  status: DashboardStatusFilter;
  technician: string;
  project: string;
}

export interface DashboardMetrics {
  total: number;
  pending: number;
  finished: number;
  completionRate: number;
  avgProgress: number;
  avgCycleHours: number;
}

export interface StatusChartDatum {
  key: OperationalStatus;
  label: string;
  count: number;
}

export interface ProjectProgressDatum {
  project: string;
  avgProgress: number;
  total: number;
}

export interface TimelineDatum {
  dayKey: string;
  label: string;
  total: number;
  finished: number;
  pending: number;
}

export interface InstallationMapPoint {
  id: string;
  lat: number;
  lng: number;
  pointType: "checkin" | "checkout";
  status: InstallationStatus;
  project: string;
  technician: string;
  vin: string;
}

const DAY_MS = 24 * 60 * 60 * 1000;

const DATE_RANGE_DAYS: Record<Exclude<DashboardDateRange, "ALL">, number> = {
  "7D": 7,
  "30D": 30,
  "90D": 90,
};

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

  if (
    !Number.isFinite(day) ||
    !Number.isFinite(month) ||
    !Number.isFinite(year) ||
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second)
  ) {
    return null;
  }

  const parsedDate = new Date(year, month - 1, day, hour, minute, second);

  if (!Number.isFinite(parsedDate.getTime())) {
    return null;
  }

  return parsedDate;
}

interface ParsedTime {
  hour: number;
  minute: number;
  second: number;
}

function parseTimeCell(rawValue: string): ParsedTime | null {
  const value = rawValue.trim();
  if (!value) {
    return null;
  }

  const normalized = value.replace(/\s+/g, " ");
  const match = normalized.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (!match) {
    return null;
  }

  const hour = Number(match[1]);
  const minute = Number(match[2]);
  const second = Number(match[3] ?? 0);

  if (
    !Number.isFinite(hour) ||
    !Number.isFinite(minute) ||
    !Number.isFinite(second) ||
    hour < 0 ||
    hour > 23 ||
    minute < 0 ||
    minute > 59 ||
    second < 0 ||
    second > 59
  ) {
    return null;
  }

  return { hour, minute, second };
}

function mergeDateAndTime(baseDate: Date, time: ParsedTime): Date {
  return new Date(
    baseDate.getFullYear(),
    baseDate.getMonth(),
    baseDate.getDate(),
    time.hour,
    time.minute,
    time.second,
  );
}

function calculateCycleDurationHours(installation: Installation): number | null {
  const checkinDate = parseDateCell(installation.fechaHoraCheckin);
  const checkoutDate = parseDateCell(installation.fechaCheckout);

  if (checkinDate && checkoutDate) {
    const durationMs = checkoutDate.getTime() - checkinDate.getTime();
    return durationMs > 0 ? durationMs / (60 * 60 * 1000) : null;
  }

  const checkinTime = parseTimeCell(installation.fechaHoraCheckin);
  const checkoutTime = parseTimeCell(installation.fechaCheckout);
  const appointmentDate = parseDateCell(installation.fechaCita);

  if (checkinDate && checkoutTime) {
    const mergedCheckout = mergeDateAndTime(checkinDate, checkoutTime);
    let durationMs = mergedCheckout.getTime() - checkinDate.getTime();
    if (durationMs <= 0) {
      durationMs += DAY_MS;
    }

    return durationMs / (60 * 60 * 1000);
  }

  if (checkoutDate && checkinTime) {
    const mergedCheckin = mergeDateAndTime(checkoutDate, checkinTime);
    let durationMs = checkoutDate.getTime() - mergedCheckin.getTime();
    if (durationMs <= 0) {
      durationMs += DAY_MS;
    }

    return durationMs / (60 * 60 * 1000);
  }

  if (appointmentDate && checkinTime && checkoutTime) {
    const mergedCheckin = mergeDateAndTime(appointmentDate, checkinTime);
    const mergedCheckout = mergeDateAndTime(appointmentDate, checkoutTime);
    let durationMs = mergedCheckout.getTime() - mergedCheckin.getTime();
    if (durationMs <= 0) {
      durationMs += DAY_MS;
    }

    return durationMs / (60 * 60 * 1000);
  }

  return null;
}

function getReferenceDate(installation: Installation): Date | null {
  return (
    parseDateCell(installation.fechaCita) ??
    parseDateCell(installation.fechaHoraCheckin) ??
    parseDateCell(installation.fechaCheckout)
  );
}

function getTimelineDate(installation: Installation): Date | null {
  return (
    parseDateCell(installation.fechaCheckout) ??
    parseDateCell(installation.fechaHoraCheckin) ??
    parseDateCell(installation.fechaCita)
  );
}

function getDateRangeCutoff(range: DashboardDateRange, now: Date): Date | null {
  if (range === "ALL") {
    return null;
  }

  const days = DATE_RANGE_DAYS[range];
  const cutoff = new Date(now);
  cutoff.setHours(0, 0, 0, 0);
  cutoff.setDate(cutoff.getDate() - (days - 1));
  return cutoff;
}

function formatDayKey(date: Date): string {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

function isValidCoordinate(lat: number, lng: number): boolean {
  return (
    Number.isFinite(lat) && Number.isFinite(lng) && Math.abs(lat) <= 90 && Math.abs(lng) <= 180
  );
}

export function applyDashboardFilters(
  installations: Installation[],
  filters: DashboardFilters,
  now: Date = new Date(),
): Installation[] {
  const cutoff = getDateRangeCutoff(filters.dateRange, now);

  return installations.filter((installation) => {
    if (filters.status !== "ALL" && installation.estatusOperativo !== filters.status) {
      return false;
    }

    if (filters.technician && installation.tecnicoAsignado !== filters.technician) {
      return false;
    }

    if (filters.project && installation.proyecto !== filters.project) {
      return false;
    }

    if (cutoff) {
      const installationDate = getReferenceDate(installation);
      if (!installationDate) {
        return false;
      }

      if (installationDate.getTime() < cutoff.getTime()) {
        return false;
      }
    }

    return true;
  });
}

export function computeDashboardMetrics(installations: Installation[]): DashboardMetrics {
  const total = installations.length;
  const pending = installations.filter((item) => item.estatusFinal === "PENDIENTE").length;
  const finished = installations.filter((item) => item.estatusFinal === "FINALIZADO").length;

  const avgProgress =
    total > 0
      ? Math.round(
          installations.reduce(
            (accumulator, current) => accumulator + current.porcentajeAvance,
            0,
          ) / total,
        )
      : 0;

  const completionRate = total > 0 ? Math.round((finished / total) * 100) : 0;

  const cycleDurationsHours = installations
    .map((installation) => calculateCycleDurationHours(installation))
    .filter((value): value is number => value !== null);

  const avgCycleHours =
    cycleDurationsHours.length > 0
      ? Math.round(
          (cycleDurationsHours.reduce((accumulator, hours) => accumulator + hours, 0) /
            cycleDurationsHours.length) *
            10,
        ) / 10
      : 0;

  return {
    total,
    pending,
    finished,
    completionRate,
    avgProgress,
    avgCycleHours,
  };
}

export function buildStatusChartData(installations: Installation[]): StatusChartDatum[] {
  const counts: Record<OperationalStatus, number> = {
    PROGRAMADO: 0,
    ATRASADO: 0,
    EN_PROCESO: 0,
    EN_PROCESO_DESFASADO: 0,
    FINALIZADO_A_TIEMPO: 0,
    FINALIZADO_DESFASADO: 0,
  };

  for (const item of installations) {
    counts[item.estatusOperativo] = (counts[item.estatusOperativo] || 0) + 1;
  }

  const keys: OperationalStatus[] = [
    "PROGRAMADO",
    "ATRASADO",
    "EN_PROCESO",
    "EN_PROCESO_DESFASADO",
    "FINALIZADO_A_TIEMPO",
    "FINALIZADO_DESFASADO",
  ];

  return keys.map((key) => ({
    key,
    label: STATUS_LABELS[key],
    count: counts[key],
  }));
}

export function buildProjectProgressData(
  installations: Installation[],
  limit = 7,
): ProjectProgressDatum[] {
  const projectMap = new Map<string, { totalProgress: number; totalRows: number }>();

  for (const installation of installations) {
    const project = installation.proyecto || "Sin proyecto";
    const previous = projectMap.get(project);

    if (previous) {
      previous.totalProgress += installation.porcentajeAvance;
      previous.totalRows += 1;
      continue;
    }

    projectMap.set(project, {
      totalProgress: installation.porcentajeAvance,
      totalRows: 1,
    });
  }

  return [...projectMap.entries()]
    .map(([project, values]) => ({
      project,
      avgProgress: Math.round(values.totalProgress / values.totalRows),
      total: values.totalRows,
    }))
    .sort((a, b) => b.total - a.total)
    .slice(0, limit);
}

export function buildTimelineData(
  installations: Installation[],
  days = 14,
  now: Date = new Date(),
): TimelineDatum[] {
  const endDate = new Date(now);
  endDate.setHours(0, 0, 0, 0);
  const startDate = new Date(endDate);
  startDate.setDate(startDate.getDate() - (days - 1));

  return buildTimelineDataForDateRange(installations, startDate, endDate);
}

export function buildTimelineDataForDateRange(
  installations: Installation[],
  startDate: Date,
  endDate: Date,
): TimelineDatum[] {
  const dailyMap = new Map<string, { total: number; finished: number; pending: number }>();
  const normalizedStartDate = new Date(startDate);
  const normalizedEndDate = new Date(endDate);

  normalizedStartDate.setHours(0, 0, 0, 0);
  normalizedEndDate.setHours(0, 0, 0, 0);

  for (const installation of installations) {
    const date = getTimelineDate(installation);
    if (!date) {
      continue;
    }

    const dayKey = formatDayKey(date);
    const existing = dailyMap.get(dayKey) ?? { total: 0, finished: 0, pending: 0 };

    existing.total += 1;
    if (installation.estatusFinal === "FINALIZADO") {
      existing.finished += 1;
    } else {
      existing.pending += 1;
    }

    dailyMap.set(dayKey, existing);
  }

  const output: TimelineDatum[] = [];
  const totalDays = Math.max(
    1,
    Math.floor((normalizedEndDate.getTime() - normalizedStartDate.getTime()) / DAY_MS) + 1,
  );

  for (let offset = 0; offset < totalDays; offset += 1) {
    const currentDay = new Date(normalizedStartDate.getTime() + offset * DAY_MS);
    const dayKey = formatDayKey(currentDay);
    const dayData = dailyMap.get(dayKey) ?? { total: 0, finished: 0, pending: 0 };

    output.push({
      dayKey,
      label: currentDay.toLocaleDateString("es-MX", { day: "2-digit", month: "short" }),
      total: dayData.total,
      finished: dayData.finished,
      pending: dayData.pending,
    });
  }

  return output;
}

export function buildMapPoints(installations: Installation[]): InstallationMapPoint[] {
  const points: InstallationMapPoint[] = [];

  for (const installation of installations) {
    const base = {
      status: installation.estatusFinal,
      project: installation.proyecto || "Sin proyecto",
      technician: installation.tecnicoAsignado || "Sin tecnico",
      vin: installation.vin || "Sin VIN",
    };

    if (
      installation.coordenadasCheckin &&
      isValidCoordinate(installation.coordenadasCheckin.lat, installation.coordenadasCheckin.lng)
    ) {
      points.push({
        id: `${installation.id}:checkin`,
        lat: installation.coordenadasCheckin.lat,
        lng: installation.coordenadasCheckin.lng,
        pointType: "checkin",
        ...base,
      });
    }

    if (
      installation.coordenadasCheckout &&
      isValidCoordinate(installation.coordenadasCheckout.lat, installation.coordenadasCheckout.lng)
    ) {
      points.push({
        id: `${installation.id}:checkout`,
        lat: installation.coordenadasCheckout.lat,
        lng: installation.coordenadasCheckout.lng,
        pointType: "checkout",
        ...base,
      });
    }
  }

  return points;
}

export function extractFilterOptions(installations: Installation[]) {
  const technicians = [
    ...new Set(installations.map((item) => item.tecnicoAsignado).filter(Boolean)),
  ].sort((a, b) => a.localeCompare(b, "es", { sensitivity: "base" }));

  const projects = [...new Set(installations.map((item) => item.proyecto).filter(Boolean))].sort(
    (a, b) => a.localeCompare(b, "es", { sensitivity: "base" }),
  );

  return {
    technicians,
    projects,
  };
}
