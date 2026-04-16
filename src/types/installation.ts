export type InstallationStatus = "PENDIENTE" | "FINALIZADO";

export interface Coordinates {
  lat: number;
  lng: number;
}

export interface Installation {
  id: string;
  sourceRowIndex: number;
  servicio: string;
  vin: string;
  numeroEquipo: string;
  proyecto: string;
  marcaModeloAnio: string;
  fechaCita: string;
  horaCita: string;
  tecnicoAsignado: string;
  fechaHoraCheckin: string;
  coordenadasCheckin: Coordinates | null;
  horaVin: string;
  fechaCheckout: string;
  coordenadasCheckout: Coordinates | null;
  observaciones: string;
  estatusFinal: InstallationStatus;
  porcentajeAvance: number;
}

export interface InstallationsData {
  installations: Installation[];
  checksum: string;
  fetchedAt: number;
}
