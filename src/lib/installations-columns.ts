import type { Installation } from "@/types/installation";

export const INSTALLATION_COLUMNS = [
  {
    key: "servicio",
    label: "Servicio",
    widthPx: 190,
    searchable: true,
  },
  {
    key: "vin",
    label: "VIN",
    widthPx: 180,
    searchable: true,
  },
  {
    key: "proyecto",
    label: "Proyecto",
    widthPx: 200,
    searchable: true,
  },
  {
    key: "marcaModeloAnio",
    label: "Marca / modelo / anio",
    widthPx: 240,
    searchable: true,
  },
  {
    key: "tecnicoAsignado",
    label: "Tecnico",
    widthPx: 170,
    searchable: true,
  },
  {
    key: "estatusFinal",
    label: "Estatus",
    widthPx: 140,
    searchable: true,
  },
  {
    key: "porcentajeAvance",
    label: "Avance",
    widthPx: 170,
    searchable: false,
  },
  {
    key: "fechaCita",
    label: "Fecha cita",
    widthPx: 130,
    searchable: true,
  },
  {
    key: "horaCita",
    label: "Hora cita",
    widthPx: 120,
    searchable: true,
  },
  {
    key: "fechaHoraCheckin",
    label: "Check-in",
    widthPx: 200,
    searchable: true,
  },
  {
    key: "coordenadasCheckin",
    label: "Coordenadas check-in",
    widthPx: 220,
    searchable: true,
  },
  {
    key: "horaVin",
    label: "Hora VIN",
    widthPx: 120,
    searchable: true,
  },
  {
    key: "fechaCheckout",
    label: "Checkout",
    widthPx: 170,
    searchable: true,
  },
  {
    key: "coordenadasCheckout",
    label: "Coordenadas checkout",
    widthPx: 220,
    searchable: true,
  },
  {
    key: "numeroEquipo",
    label: "Equipo",
    widthPx: 130,
    searchable: true,
  },
  {
    key: "observaciones",
    label: "Observaciones",
    widthPx: 320,
    searchable: true,
  },
] as const;

export type InstallationColumnDefinition = (typeof INSTALLATION_COLUMNS)[number];
export type InstallationColumnKey = InstallationColumnDefinition["key"];

export const INSTALLATION_COLUMN_KEYS = INSTALLATION_COLUMNS.map((column) => column.key);

export const INSTALLATION_COLUMNS_BY_KEY = Object.fromEntries(
  INSTALLATION_COLUMNS.map((column) => [column.key, column]),
) as Record<InstallationColumnKey, InstallationColumnDefinition>;

export function createInstallationSearchIndex(installation: Installation): string {
  const statusText = installation.estatusFinal === "FINALIZADO" ? "finalizado" : "pendiente";
  const checkinCoords = installation.coordenadasCheckin
    ? `${installation.coordenadasCheckin.lat},${installation.coordenadasCheckin.lng}`
    : "";
  const checkoutCoords = installation.coordenadasCheckout
    ? `${installation.coordenadasCheckout.lat},${installation.coordenadasCheckout.lng}`
    : "";

  return [
    installation.servicio,
    installation.vin,
    installation.numeroEquipo,
    installation.proyecto,
    installation.marcaModeloAnio,
    installation.fechaCita,
    installation.horaCita,
    installation.tecnicoAsignado,
    installation.fechaHoraCheckin,
    checkinCoords,
    installation.horaVin,
    installation.fechaCheckout,
    checkoutCoords,
    installation.observaciones,
    statusText,
    `${installation.porcentajeAvance}`,
    `${installation.sourceRowIndex}`,
  ]
    .join(" ")
    .toLowerCase();
}
