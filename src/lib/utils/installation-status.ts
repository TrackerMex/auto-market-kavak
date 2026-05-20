import type { Installation, OperationalStatus } from "@/types/installation";

export function parseDateCell(rawValue: string): Date | null {
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

function getStartOfDay(date: Date): number {
  return new Date(date.getFullYear(), date.getMonth(), date.getDate()).getTime();
}

export function getOperationalStatus(
  installation: Omit<Installation, "estatusOperativo">,
  now: Date = new Date(),
): OperationalStatus {
  const appointmentDate = parseDateCell(installation.fechaCita);
  const checkinDate = parseDateCell(installation.fechaHoraCheckin);
  const checkoutDate = parseDateCell(installation.fechaCheckout);

  const startOfToday = getStartOfDay(now);
  const startOfAppt = appointmentDate ? getStartOfDay(appointmentDate) : null;
  const startOfCheckin = checkinDate ? getStartOfDay(checkinDate) : null;

  // Si el estatus final de la hoja ya es FINALIZADO, o si tiene fecha de checkout
  if (installation.estatusFinal === "FINALIZADO" || checkoutDate) {
    if (startOfAppt && startOfCheckin && startOfCheckin > startOfAppt) {
      return "FINALIZADO_DESFASADO";
    }
    return "FINALIZADO_A_TIEMPO";
  }

  // Si tiene Check-in pero no Checkout (En Proceso)
  if (checkinDate) {
    if (startOfAppt && startOfCheckin && startOfCheckin > startOfAppt) {
      return "EN_PROCESO_DESFASADO";
    }
    return "EN_PROCESO";
  }

  // Si no tiene Check-in (Pendientes/Programados)
  if (startOfAppt) {
    if (startOfAppt < startOfToday) {
      return "ATRASADO";
    }
    return "PROGRAMADO";
  }

  return "PROGRAMADO"; // Default de respaldo
}
