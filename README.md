# Auto Market Kavak Dashboard

Dashboard frontend para visualizar instalaciones de servicios de unidades, consumiendo datos desde Google Sheets API.

## Stack

- Astro + React (islands)
- Tailwind CSS v4
- Shadcn/ui
- TypeScript (strict)
- ESLint + Prettier

## Requisitos

- Node.js 22.12+
- npm 10+

## Variables de entorno

1. Copia `.env.example` a `.env.local`.
2. Completa los valores:

```env
PUBLIC_GOOGLE_SHEETS_ID=1dLm00EofQzziwX0_TyZrLdS0FJUmmVR44kpGhNTb7ws
PUBLIC_GOOGLE_API_KEY=your_google_api_key
PUBLIC_GOOGLE_SHEET_NAME=Auto Market Kavak
PUBLIC_GOOGLE_SHEET_RANGE=A1:P
PUBLIC_POLLING_INTERVAL=300000
```

Si aparece `Falta PUBLIC_GOOGLE_SHEETS_ID`, normalmente significa que no existe el archivo `.env.local`
o no fue reiniciado el servidor de desarrollo despues de crear/editar variables de entorno.

Checklist rapido de credenciales:

1. Google Cloud -> habilitar **Google Sheets API**.
2. API key activa y sin restricciones que bloqueen `sheets.googleapis.com`.
3. Hoja compartida con acceso de lectura (o publicada) para la estrategia elegida.
4. Reiniciar `npm run dev` despues de cambios en `.env.local`.

## Fase 2 completada

- Servicio de lectura directa de Google Sheets (`src/lib/api/sheets.ts`)
- Parseo y normalizacion de filas a modelo tipado (`src/lib/utils/installation-parser.ts`)
- Servicio central de instalaciones con checksum de cambios (`src/lib/installations-service.ts`)
- Cache local con TTL en `localStorage` (`src/lib/cache/installations-cache.ts`)
- Control de frecuencia de requests (`src/lib/polling/installations-polling.ts`)
- Hook React para polling, estado y deteccion de cambios (`src/hooks/use-installations.ts`)
- Dashboard conectado a datos reales en la pagina principal (`src/components/dashboard/installations-dashboard.tsx`)

## Fase 3 completada

- Tabla virtualizada para manejar miles de registros (`src/components/table/installations-data-table.tsx`)
- Busqueda global con debounce y filtro por estatus (`src/components/table/installations-data-table.tsx`)
- Configuracion de columnas con orden manual y visibilidad (`src/components/table/installations-data-table.tsx`)
- Persistencia de preferencias de tabla en `localStorage` (`src/lib/cache/installations-table-preferences.ts`)
- Definicion central de columnas y texto indexado para busqueda (`src/lib/installations-columns.ts`)

## Scripts

- `npm run dev`: inicia servidor local en `http://localhost:4321`
- `npm run build`: crea build de produccion en `dist/`
- `npm run preview`: previsualiza build localmente
- `npm run lint`: ejecuta ESLint
- `npm run lint:fix`: corrige problemas auto-fixables de ESLint
- `npm run format`: formatea proyecto con Prettier
- `npm run format:check`: valida formato sin modificar archivos

## Estructura inicial

```text
src/
├─ components/
│  ├─ charts/
│  ├─ common/
│  ├─ dashboard/
│  ├─ layout/
│  ├─ map/
│  ├─ table/
│  └─ ui/
├─ hooks/
├─ layouts/
├─ lib/
│  ├─ api/
│  ├─ cache/
│  ├─ polling/
│  ├─ utils/
│  └─ constants.ts
├─ pages/
├─ stores/
├─ styles/
└─ types/
```
