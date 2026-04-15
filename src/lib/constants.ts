import type { InstallationStatus } from "@/types/installation";

export const POLLING_INTERVAL_MS = 5 * 60 * 1000;

export const STATUS_LABELS: Record<InstallationStatus, string> = {
  PENDIENTE: "Pendiente",
  FINALIZADO: "Finalizado",
};

export const STATUS_BADGE_STYLES: Record<InstallationStatus, string> = {
  PENDIENTE: "border-yellow-200 bg-yellow-50 text-yellow-700",
  FINALIZADO: "border-green-200 bg-green-50 text-green-700",
};
