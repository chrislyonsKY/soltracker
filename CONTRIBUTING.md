# Contributing to SolTracker

Thank you for your interest in contributing to SolTracker! This project tracks NASA Mars rovers on a 3D globe using ArcGIS Maps SDK for JavaScript.

## Getting Started

1. Fork the repository
2. Clone your fork: `git clone https://github.com/YOUR_USERNAME/soltracker.git`
3. Install dependencies: `npm install`
4. Start the dev server: `npm run dev`
5. Open `http://localhost:5173` in your browser

## Development

- **Language:** TypeScript (strict mode)
- **Build tool:** Vite 6
- **Map SDK:** ArcGIS Maps SDK for JavaScript v5.0
- **UI:** Calcite Design System v5
- **Spatial reference:** Mars_2000_Sphere (WKID 104971)

### Commands

```bash
npm run dev        # Start dev server
npm run build      # Production build
npm run typecheck   # Type-check without emitting
npm run preview    # Preview production build
```

### Code Style

- All exported functions get JSDoc comments
- No `any` type — use `unknown` with type guards
- Explicit return types on exported functions
- `const` by default, `let` only when reassignment is needed
- Try/catch on all async operations

### Project Structure

- `src/features/` — Feature modules (mars-globe, traverse, dashboard, photos, elevation, etc.)
- `src/services/` — API clients (NASA, MMGIS)
- `src/utils/` — Shared utilities
- `src/data/` — Static data files
- `ai-dev/` — AI development documentation (architecture, specs, decisions)

## Pull Requests

1. Create a feature branch from `main`
2. Make your changes with clear commit messages
3. Ensure `npm run typecheck` passes
4. Ensure `npm run build` succeeds
5. Open a PR with a clear description of what changed and why

## Reporting Issues

Please use GitHub Issues. Include:
- What you expected to happen
- What actually happened
- Browser and OS information
- Console errors (if any)

## Code of Conduct

This project follows the [Contributor Covenant Code of Conduct](CODE_OF_CONDUCT.md).

## License

By contributing, you agree that your contributions will be licensed under the Apache License 2.0.
