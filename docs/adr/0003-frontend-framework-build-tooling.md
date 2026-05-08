# 0003 - Frontend Framework and Build Tooling

- Status: Accepted
- Date: 2026-05-08

## Context

The app needs strict TypeScript, a fast local loop, static output for GitHub Pages, and good support for lazy-loaded WASM-heavy dependencies.

## Decision

Use React, TypeScript strict mode, Vite, Tailwind CSS, Vitest, ESLint, Prettier, and Playwright.

## Consequences

The app remains familiar to contributors, builds quickly, and can split OpenCV.js and DuckDB-WASM behind user actions.

## Alternatives Considered

Svelte and vanilla TypeScript were considered. React was chosen because the ecosystem around maps, query caching, PWA tooling, and testing is mature.

