# Coding Standards Guardrails

These rules apply to ALL code generated for this project, regardless of which agent or task is active.

## TypeScript

- **Strict mode required**: `strict: true` in tsconfig.json. Never disable strict checks.
- No `any` type — use `unknown` with type guards when the type is genuinely unknown.
- Explicit return types on all exported functions and methods.
- Prefer `interface` over `type` for object shapes that may be extended.
- Use `const` by default; `let` only when reassignment is necessary; never `var`.
- All async functions must have try/catch — no unhandled promise rejections.
- Use optional chaining (`?.`) and nullish coalescing (`??`) over manual null checks.

## ArcGIS JS SDK v5.0

- **Web components only** — never use deprecated widget constructors (`new SceneView()`, etc.).
- Use `reactiveUtils.watch()` — never use removed `watchUtils`.
- Use geometry operators — never use deprecated `geometryEngine`.
- Always `await layer.load()` before accessing layer properties.
- Always `await view.when()` before interacting with the view.
- Never set `ground: "world-elevation"` for Mars — it's Earth-only.
- Never use VectorTileLayer, SceneLayer, or dynamic map layers on Mars (unsupported).

## Calcite Components

- Always use semantic Calcite components over raw HTML where an equivalent exists.
- Always set `calcite-mode-dark` on `<body>` for dark theme.
- Use Calcite's built-in ARIA attributes — don't override with custom aria-* unless necessary.
- All interactive Calcite elements must have visible labels or `label` attributes.

## Code Organization

- One module per file, one concern per module.
- Feature modules live in `src/features/{feature-name}/`.
- Shared services in `src/services/`, utilities in `src/utils/`.
- No circular imports — dependency flow: utils → services → features → main.

## Comments and Documentation

- All exported functions get JSDoc with `@param`, `@returns`, and `@throws` tags.
- Non-obvious logic gets inline comments explaining WHY, not WHAT.
- TODO markers format: `// TODO(milestone): description` — e.g., `// TODO(M2): implement speed control`.
- No commented-out code in committed files.
