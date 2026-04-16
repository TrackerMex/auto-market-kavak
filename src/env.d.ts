/// <reference types="astro/client" />

interface ImportMetaEnv {
  readonly PUBLIC_GOOGLE_SHEETS_ID?: string;
  readonly PUBLIC_GOOGLE_API_KEY?: string;
  readonly PUBLIC_GOOGLE_SHEET_NAME?: string;
  readonly PUBLIC_GOOGLE_SHEET_RANGE?: string;
  readonly PUBLIC_POLLING_INTERVAL?: string;
  readonly VITE_GOOGLE_SHEETS_ID?: string;
  readonly VITE_GOOGLE_API_KEY?: string;
  readonly VITE_GOOGLE_SHEET_NAME?: string;
  readonly VITE_GOOGLE_SHEET_RANGE?: string;
  readonly VITE_POLLING_INTERVAL?: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
