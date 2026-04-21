import { SHEET_NAME, SHEET_RANGE } from "@/lib/constants";

const GOOGLE_SHEETS_BASE_URL = "https://sheets.googleapis.com/v4/spreadsheets";

interface GoogleSheetsResponse {
  range?: string;
  majorDimension?: string;
  values?: Array<Array<string | number | boolean | null>>;
  error?: {
    code?: number;
    message?: string;
  };
}

export class SheetsApiError extends Error {
  constructor(
    message: string,
    readonly status?: number,
  ) {
    super(message);
    this.name = "SheetsApiError";
  }
}

function getSheetsConfig() {
  const spreadsheetId =
    import.meta.env.PUBLIC_GOOGLE_SHEETS_ID?.trim() ||
    import.meta.env.VITE_GOOGLE_SHEETS_ID?.trim();
  const apiKey =
    import.meta.env.PUBLIC_GOOGLE_API_KEY?.trim() || import.meta.env.VITE_GOOGLE_API_KEY?.trim();

  if (!spreadsheetId) {
    throw new SheetsApiError(
      "Falta PUBLIC_GOOGLE_SHEETS_ID en las variables de entorno.",
    );
  }

  if (!apiKey) {
    throw new SheetsApiError("Falta PUBLIC_GOOGLE_API_KEY en las variables de entorno.");
  }

  return { spreadsheetId, apiKey };
}

function buildSheetRange() {
  const cleanName = SHEET_NAME.replace(/'/g, "''");
  return `'${cleanName}'!${SHEET_RANGE}`;
}

function createSheetsUrl() {
  const { spreadsheetId, apiKey } = getSheetsConfig();
  const range = buildSheetRange();
  const params = new URLSearchParams({
    key: apiKey,
    majorDimension: "ROWS",
    valueRenderOption: "UNFORMATTED_VALUE",
  });

  return `${GOOGLE_SHEETS_BASE_URL}/${spreadsheetId}/values/${encodeURIComponent(range)}?${params.toString()}`;
}

export async function fetchSheetRows(
  signal?: AbortSignal,
): Promise<Array<Array<string | number | boolean | null>>> {
  const requestUrl = createSheetsUrl();
  const response = await fetch(requestUrl, {
    method: "GET",
    headers: {
      Accept: "application/json",
    },
    signal,
  });

  let payload: GoogleSheetsResponse | null = null;
  try {
    payload = (await response.json()) as GoogleSheetsResponse;
  } catch {
    payload = null;
  }

  if (!response.ok) {
    const apiMessage = payload?.error?.message;
    const errorMessage = apiMessage || `Error al consultar Google Sheets (${response.status}).`;
    throw new SheetsApiError(errorMessage, response.status);
  }

  return Array.isArray(payload?.values) ? payload.values : [];
}
