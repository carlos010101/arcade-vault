# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — plataforma para jugar online y competir por puntuación (ver README.md). Actualmente es el scaffold por defecto de `create-next-app`; aún no hay funcionalidad de juego implementada.

Sigue Spec Driven Design (`/spec` y `/spec-impl`) basado en https://github.com/Klerith/fernando-skills. Instala los skills con:

```bash
npx skills@latest add Klerith/fernando-skills
```

## Commands

```bash
npm run dev      # start dev server (Turbopack)
npm run build    # production build
npm run start    # serve production build
npm run lint     # eslint (flat config, eslint-config-next)
```

No test runner is configured yet.

## Skills 
Usa siempre /frontend-design para diseñar la interfaz de usuario.

## Architecture

- Next.js 16.3.0 with the **App Router** (`app/`), React 19, TypeScript (strict), Tailwind CSS v4 (via `@tailwindcss/postcss`).
- Path alias `@/*` maps to the repo root (see `tsconfig.json`).
- **Next.js 16 has breaking changes vs. training data.** Before writing routing/data-fetching/config code, read the relevant guide under `node_modules/next/dist/docs/` (sections: `01-app`, `02-pages`, `03-architecture`) — do not assume older Next.js APIs or conventions apply.
