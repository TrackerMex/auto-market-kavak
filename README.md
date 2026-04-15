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
VITE_GOOGLE_SHEETS_ID=1dLm00EofQzziwX0_TyZrLdS0FJUmmVR44kpGhNTb7ws
VITE_GOOGLE_API_KEY=your_google_api_key
VITE_POLLING_INTERVAL=300000
```

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
