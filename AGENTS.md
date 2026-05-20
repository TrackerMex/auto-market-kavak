# Repository Guidelines

## Project Structure & Module Organization

This is an Astro + React dashboard for Google Sheets-backed installation data. Source code lives in `src/`. Use `src/pages/` for routes, `src/layouts/` for Astro layouts, and `src/styles/global.css` for global Tailwind CSS. React UI is under `src/components/`, with feature folders such as `dashboard/`, `table/`, `charts/`, and shared shadcn-style primitives in `ui/`. Business logic belongs in `src/lib/`, including API access, cache helpers, polling, and data utilities. Shared hooks are in `src/hooks/`, types in `src/types/`, source assets in `src/assets/`, and static files in `public/`. Build output in `dist/` should not be edited.

## Build, Test, and Development Commands

Use Node.js `>=22.12.0` and npm. Common commands:

- `npm run dev`: start the local Astro server at `http://localhost:4321`.
- `npm run build`: create the production build in `dist/`.
- `npm run preview`: preview the production build locally.
- `npm run lint`: run ESLint across the project.
- `npm run lint:fix`: apply safe ESLint fixes.
- `npm run format`: format files with Prettier.
- `npm run format:check`: verify formatting without modifying files.

## Coding Style & Naming Conventions

Write TypeScript and React components using existing project patterns. Use 2-space indentation, semicolons, double quotes, trailing commas, and a 100-character print width, as configured in `.prettierrc`. Keep component filenames lowercase kebab-case, for example `installations-dashboard.tsx`; export React components in PascalCase. Prefer typed utilities in `src/lib/` over duplicating parsing, filtering, or export logic inside components. Use Tailwind CSS v4 utilities and existing `src/components/ui/` primitives first.

## Testing Guidelines

There is currently no dedicated `npm test` script or first-party test directory. Before submitting changes, run `npm run lint`, `npm run format:check`, and `npm run build`. For logic-heavy additions, add focused tests when a runner is introduced, using `*.test.ts` or `*.test.tsx` near the code under test. For UI changes, manually verify the dashboard with realistic Google Sheets values.

## Commit & Pull Request Guidelines

Recent commits use short imperative summaries in English or Spanish, such as `Update Dockerfile` or `Agregar funcionalidad de exportacion...`. Keep subjects concise and action-oriented; include scope when helpful. Pull requests should describe the change, list validation commands run, link related issues, and include screenshots or screen recordings for visible dashboard changes.

## Security & Configuration Tips

Copy `.env.example` to `.env.local` for local development. Do not commit `.env.local` or API keys. Required public variables include `PUBLIC_GOOGLE_SHEETS_ID`, `PUBLIC_GOOGLE_API_KEY`, `PUBLIC_GOOGLE_SHEET_NAME`, `PUBLIC_GOOGLE_SHEET_RANGE`, `PUBLIC_POLLING_INTERVAL`, and `PUBLIC_SITE_URL`. Restart `npm run dev` after changing environment variables.
