import type { Installation } from "@/types/installation";
import * as XLSX from "xlsx";

export interface ExportableInstallation {
  ID: string;
  VIN: string;
  "Marca/Modelo/Año": string;
  Proyecto: string;
  "Técnico Asignado": string;
  "Fecha Cita": string;
  "Estatus Final": string;
  "Porcentaje Avance": number;
  "Fecha/Hora Checkin": string;
  "Fecha Checkout": string;
  "Hora VIN": string;
  "Coordenadas Checkin": string;
  "Coordenadas Checkout": string;
  Observaciones: string;
}

function transformForExport(installation: Installation): ExportableInstallation {
  return {
    ID: installation.id,
    VIN: installation.vin || "",
    "Marca/Modelo/Año": installation.marcaModeloAnio || "",
    Proyecto: installation.proyecto || "",
    "Técnico Asignado": installation.tecnicoAsignado || "",
    "Fecha Cita": installation.fechaCita || "",
    "Estatus Final": installation.estatusFinal || "",
    "Porcentaje Avance": installation.porcentajeAvance,
    "Fecha/Hora Checkin": installation.fechaHoraCheckin || "",
    "Fecha Checkout": installation.fechaCheckout || "",
    "Hora VIN": installation.horaVin || "",
    "Coordenadas Checkin": installation.coordenadasCheckin
      ? `${installation.coordenadasCheckin.lat}, ${installation.coordenadasCheckin.lng}`
      : "",
    "Coordenadas Checkout": installation.coordenadasCheckout
      ? `${installation.coordenadasCheckout.lat}, ${installation.coordenadasCheckout.lng}`
      : "",
    Observaciones: installation.observaciones || "",
  };
}

export function exportInstallationsToExcel(installations: Installation[], filename = "instalaciones"): void {
  const data = installations.map(transformForExport);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Instalaciones");

  const columnWidths = [
    { wch: 10 },
    { wch: 20 },
    { wch: 25 },
    { wch: 20 },
    { wch: 20 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 15 },
    { wch: 20 },
    { wch: 20 },
    { wch: 10 },
    { wch: 25 },
    { wch: 25 },
    { wch: 50 },
  ];
  worksheet["!cols"] = columnWidths;

  XLSX.writeFile(workbook, `${filename}.xlsx`);
}

export function exportInstallationsToCSV(installations: Installation[], filename = "instalaciones"): void {
  const data = installations.map(transformForExport);
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();

  XLSX.utils.book_append_sheet(workbook, worksheet, "Instalaciones");
  XLSX.writeFile(workbook, `${filename}.csv`);
}