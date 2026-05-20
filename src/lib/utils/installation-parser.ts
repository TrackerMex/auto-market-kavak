import type { Installation, InstallationStatus } from "@/types/installation";
import { getOperationalStatus } from "@/lib/utils/installation-status";

const MIN_COLUMNS = 16;
const DAY_MS = 24 * 60 * 60 * 1000;
const GOOGLE_SHEETS_SERIAL_EPOCH_UTC = Date.UTC(1899, 11, 30);

type CellValue = string | number | boolean | null | undefined;

function asString(value: CellValue): string {
  if (value === null || value === undefined) {
    return "";
  }

  return String(value).trim();
}

function parseStatus(rawStatus: string): InstallationStatus {
  const normalized = rawStatus.trim().toUpperCase();

  if (normalized === "FINALIZADO") {
    return "FINALIZADO";
  }

  return "PENDIENTE";
}

function padTwoDigits(value: number): string {
  return String(value).padStart(2, "0");
}

function formatDateFromSerial(date: Date): string {
  return `${date.getUTCDate()}/${date.getUTCMonth() + 1}/${date.getUTCFullYear()}`;
}

function formatTimeFromSerial(date: Date): string {
  return `${padTwoDigits(date.getUTCHours())}:${padTwoDigits(date.getUTCMinutes())}:${padTwoDigits(date.getUTCSeconds())}`;
}

function formatDateTimeFromSerial(date: Date): string {
  return `${formatDateFromSerial(date)} ${formatTimeFromSerial(date)}`;
}

function toGoogleSheetsSerial(value: CellValue): number | null {
  if (typeof value === "number" && Number.isFinite(value)) {
    return value;
  }

  const textValue = asString(value);
  if (!textValue) {
    return null;
  }

  if (!/^-?\d+(?:[.,]\d+)?$/.test(textValue)) {
    return null;
  }

  const normalized = textValue.replace(",", ".");
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : null;
}

function fromGoogleSheetsSerial(value: number): Date | null {
  if (!Number.isFinite(value) || value < 0) {
    return null;
  }

  const timestamp = GOOGLE_SHEETS_SERIAL_EPOCH_UTC + Math.round(value * DAY_MS);
  const date = new Date(timestamp);
  return Number.isFinite(date.getTime()) ? date : null;
}

function parseTemporalCell(
  rawValue: CellValue,
  format: "date" | "time" | "datetime",
): string {
  const serialValue = toGoogleSheetsSerial(rawValue);
  if (serialValue === null) {
    return asString(rawValue);
  }

  const parsedDate = fromGoogleSheetsSerial(serialValue);
  if (!parsedDate) {
    return asString(rawValue);
  }

  if (format === "datetime" && serialValue >= 0 && serialValue < 1) {
    return formatTimeFromSerial(parsedDate);
  }

  if (format === "date") {
    return formatDateFromSerial(parsedDate);
  }

  if (format === "time") {
    return formatTimeFromSerial(parsedDate);
  }

  return formatDateTimeFromSerial(parsedDate);
}

function clampProgress(value: number): number {
  return Math.max(0, Math.min(100, Math.round((value + Number.EPSILON) * 100) / 100));
}

function normalizeProgressValue(value: number): number {
  if (!Number.isFinite(value)) {
    return 0;
  }

  if (value >= 0 && value <= 1) {
    return clampProgress(value * 100);
  }

  return clampProgress(value);
}

function parseProgress(rawValue: CellValue): number {
  if (rawValue === null || rawValue === undefined) {
    return 0;
  }

  if (typeof rawValue === "number") {
    return normalizeProgressValue(rawValue);
  }

  const textValue = asString(rawValue);
  if (!textValue) {
    return 0;
  }

  const hasPercentSymbol = textValue.includes("%");
  const normalized = textValue.replace("%", "").replace(/\s+/g, "").replace(",", ".");
  const parsed = Number(normalized);

  if (!Number.isFinite(parsed)) {
    return 0;
  }

  if (hasPercentSymbol) {
    return clampProgress(parsed);
  }

  return normalizeProgressValue(parsed);
}

function parseCoordinates(rawValue: string) {
  const normalized = rawValue.trim();
  if (!normalized) {
    return null;
  }

  const match = normalized.match(/(-?\d+(?:\.\d+)?)\s*[,\s]\s*(-?\d+(?:\.\d+)?)/);
  if (!match) {
    return null;
  }

  const lat = Number(match[1]);
  const lng = Number(match[2]);

  if (!Number.isFinite(lat) || !Number.isFinite(lng)) {
    return null;
  }

  return { lat, lng };
}

function createInstallationId(values: CellValue[], rowIndex: number): string {
  const identity = [
    asString(values[0]),
    asString(values[1]),
    asString(values[2]),
    asString(values[5]),
    asString(values[6]),
    String(rowIndex),
  ];

  return identity.join("|");
}

export function parseInstallationsFromRows(rows: CellValue[][]): Installation[] {
  if (rows.length <= 1) {
    return [];
  }

  const dataRows = rows.slice(1);

  return dataRows
    .filter((row) => row.some((value) => asString(value)))
    .map((row, index) => {
      const safeRow = [...row];
      while (safeRow.length < MIN_COLUMNS) {
        safeRow.push("");
      }

      const baseObj = {
        id: createInstallationId(safeRow, index + 2),
        sourceRowIndex: index + 2,
        servicio: asString(safeRow[0]),
        vin: asString(safeRow[1]),
        numeroEquipo: asString(safeRow[2]),
        proyecto: asString(safeRow[3]),
        marcaModeloAnio: asString(safeRow[4]),
        fechaCita: parseTemporalCell(safeRow[5], "date"),
        horaCita: parseTemporalCell(safeRow[6], "time"),
        tecnicoAsignado: asString(safeRow[7]),
        fechaHoraCheckin: parseTemporalCell(safeRow[8], "datetime"),
        coordenadasCheckin: parseCoordinates(asString(safeRow[9])),
        horaVin: parseTemporalCell(safeRow[10], "time"),
        fechaCheckout: parseTemporalCell(safeRow[11], "datetime"),
        coordenadasCheckout: parseCoordinates(asString(safeRow[12])),
        observaciones: asString(safeRow[13]),
        estatusFinal: parseStatus(asString(safeRow[14])),
        porcentajeAvance: parseProgress(safeRow[15]),
      };

      const estatusOperativo = getOperationalStatus(baseObj);

      return {
        ...baseObj,
        estatusOperativo,
      } satisfies Installation;
    });
}

export function createInstallationsChecksum(installations: Installation[]): string {
  let hash = 2166136261;

  for (const installation of installations) {
    const line = [
      installation.id,
      installation.estatusFinal,
      installation.estatusOperativo,
      installation.porcentajeAvance,
      installation.fechaHoraCheckin,
      installation.fechaCheckout,
      installation.observaciones,
    ].join("|");

    for (let i = 0; i < line.length; i += 1) {
      hash ^= line.charCodeAt(i);
      hash = (hash * 16777619) >>> 0;
    }
  }

  return hash.toString(16).padStart(8, "0");
}
