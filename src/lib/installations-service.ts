import { fetchSheetRows } from "@/lib/api/sheets";
import {
  canRequestInstallations,
  markInstallationsRequest,
} from "@/lib/polling/installations-polling";
import {
  createInstallationsChecksum,
  parseInstallationsFromRows,
} from "@/lib/utils/installation-parser";
import type { InstallationsData } from "@/types/installation";

export class InstallationsThrottleError extends Error {
  constructor() {
    super("Solicitud omitida por proteccion de frecuencia.");
    this.name = "InstallationsThrottleError";
  }
}

export async function fetchInstallationsData(signal?: AbortSignal): Promise<InstallationsData> {
  if (!canRequestInstallations()) {
    throw new InstallationsThrottleError();
  }

  markInstallationsRequest();
  const rows = await fetchSheetRows(signal);
  const installations = parseInstallationsFromRows(rows);

  return {
    installations,
    checksum: createInstallationsChecksum(installations),
    fetchedAt: Date.now(),
  };
}
