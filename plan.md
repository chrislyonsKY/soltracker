# SolTracker v2 — Development Plan

**Author:** Chris Lyons
**Date:** 2026-03-19
**Status:** Active
**Current version:** 1.0.0
**Goal:** Showcase-quality Mars rover tracking application

---

## Critical Fix: Photo System (Sprint 0 — Do First)

The NASA Mars Rover Photos API (`api.nasa.gov/mars-photos`) is **offline** — the Heroku backend is gone (`"No such app"`). This breaks the photo gallery, camera filter, and sol-synced photo features.

### Replacement Strategy

Two working NASA image endpoints exist:

1. **NASA Raw Images RSS Feed** (mars.nasa.gov/rss/api/)
   - Works for Perseverance: `?feed=raw_images&category=mars2020&feedtype=json&num=25&page=0&sol=100`
   - Returns: `{ images: [{ sol, camera, image_files: { small, medium, large, full_res } }] }`
   - URLs confirmed working (HTTP 200)
   - Supports sol filtering, camera filtering, pagination
   - No API key required

2. **NASA Raw Image Items API** (mars.nasa.gov/api/v1/raw_image_items/)
   - Works for both Perseverance and Curiosity
   - More flexible query params: `?order=sol+desc&per_page=25&mission=msl&sol=1000`
   - Returns `{ items: [...], more, total, page }`

3. **NASA Images Search API** (images-api.nasa.gov/search)
   - Works for curated/processed images (not raw)
   - Good for "featured" images, panoramas, press releases
   - Returns working `images-assets.nasa.gov` URLs

### Tasks
- [ ] Rewrite `src/services/nasa-api.ts` to use the RSS feed endpoint
- [ ] Update `NASAPhoto` type to match new response schema
- [ ] Add Curiosity support via the raw image items API
- [ ] Update photo gallery to render with new image structure
- [ ] Add Spirit/Opportunity photo support (archived images)
- [ ] Test camera filtering with new endpoints
- [ ] Remove references to the dead `api.nasa.gov/mars-photos` endpoint

---

## Sprint 1: Polish & Stability

### 1.1 AI Features → BYOK Only
The built-in Anthropic key should be removed from env vars for cost control. The AI narrator and mission chat should clearly prompt users to enter their own key.

- [ ] Remove `VITE_ANTHROPIC_API_KEY` from deploy workflow
- [ ] Remove `ANTHROPIC_API_KEY` GitHub secret
- [ ] Update AI narrator UI to show "Enter your Anthropic API key in Settings to enable"
- [ ] Add clear pricing note: "Each query costs ~$0.003"
- [ ] Add usage counter in localStorage (show "X queries this session")

### 1.2 Analytics (Privacy-First)
No cookies, no PII, no third-party trackers.

- [ ] Integrate [Plausible Analytics](https://plausible.io/) (self-hosted or cloud) — GDPR compliant, no cookies
- [ ] Or build minimal custom analytics: count page views, rover selections, feature usage via a Cloudflare Worker endpoint
- [ ] Track: page loads, rover selection counts, feature panel opens, animation plays, photo views
- [ ] Display a small "Analytics" notice in About dialog

### 1.3 Runtime Bug Fixes
- [ ] Test 3D rover models in production — verify GLB loading on GitHub Pages
- [ ] Test geology overlay tile loading (Mars Trek WMTS → ArcGIS WebTileLayer)
- [ ] Test DSN status feed (may have CORS issues from GitHub Pages)
- [ ] Fix any console errors visible on the live site
- [ ] Add error boundaries: catch and display friendly messages for failed features instead of silent breaks

### 1.4 Performance
- [ ] Code-split with dynamic `import()` for heavy features: photos, chat, panoramas, AI narrator
- [ ] Lazy-load the 3D GLB models only when zoom scale < 100,000
- [ ] Add `loading="lazy"` to all panorama thumbnails (already done)
- [ ] Consider `vite-plugin-compression` for gzip/brotli pre-compression
- [ ] Profile with Lighthouse — target score ≥ 80

---

## Sprint 2: Internationalization (i18n)

### Architecture
- Use a lightweight i18n approach: JSON translation files + a `t()` helper function
- No heavy framework (no i18next) — keep it simple for a static app
- Directory: `src/i18n/`

### Languages (priority order)
1. **English** (default, already done)
2. **Spanish** — largest non-English space enthusiast community
3. **Japanese** — strong JAXA/space culture, good for showcasing
4. **French** — ESA partner, Mars Express
5. **Arabic** — UAE Mars Mission (Hope), growing audience
6. **Hindi** — ISRO Mangalyaan, large audience

### Translation scope
- UI labels (buttons, headers, section titles)
- Dashboard stat labels
- Rover names/descriptions (keep English names but add descriptions)
- Tooltip text
- About dialog content
- Chat system prompts (so Claude responds in the user's language)
- NOT: dynamically fetched data (NASA API responses stay English)

### Tasks
- [ ] Create `src/i18n/en.json` with all UI strings
- [ ] Create `src/i18n/` files for each language
- [ ] Build `t(key)` helper that reads from loaded locale
- [ ] Add language selector to header or settings
- [ ] Store language preference in localStorage
- [ ] Update all hardcoded strings in HTML and TypeScript to use `t()`
- [ ] Update Claude system prompts to include language instruction

---

## Sprint 3: Data Layer & Backend Prep

### 3.1 Image Caching Proxy
When you add a backend, the first service should be an image caching proxy:
- Proxy NASA image requests through your server
- Cache responses in a KV store (Cloudflare KV, Redis)
- Eliminates CORS issues
- Protects API keys server-side
- Reduces NASA API load

### 3.2 Traverse Data Caching
- Cache MMGIS GeoJSON responses server-side (update daily via cron)
- Serve cached data to clients — faster loads, offline resilience
- Track rover position updates for notification features

### 3.3 Backend Architecture Options
| Option | Pros | Cons |
|--------|------|------|
| **Cloudflare Workers + KV** | Free tier generous, global edge, no cold starts | Limited compute time (50ms CPU) |
| **Vercel Edge Functions** | Easy deploy, good DX | Vendor lock-in |
| **Railway / Render** | Full Node.js, any library | Monthly cost, cold starts |
| **Self-hosted VPS** | Full control | Maintenance burden |

**Recommendation:** Start with Cloudflare Workers for API proxying and caching. Migrate to a full backend later if needed.

---

## Sprint 4: Advanced Features (v2)

### 4.1 Rover Comparison Mode
- Side-by-side split view: two rovers on the same globe
- Synced timelines: "both at Sol 100" or "both at their current sol"
- Overlay traverse paths with transparency
- Distance/speed comparison charts

### 4.2 Time-Lapse Mode
- Animate rover position across the full mission at high speed
- Show cumulative distance counter ticking up
- Background music option (ambient Mars wind from InSight recordings — NASA public domain)

### 4.3 Educational Mode
- Guided tour: step-by-step walkthrough of each rover's key discoveries
- Quiz mode: "Which crater is this?" with multiple choice
- Teacher dashboard: embed-friendly iframe with configurable options
- Curriculum alignment: NGSS standards for Earth & Space Science

### 4.4 Community Features (v3 / requires backend)
- User-submitted annotations on waypoints
- Bookmarked views / saved states
- Share screenshots with rover position overlay
- Public API for third-party integrations

---

## Sprint 5: Platform & Distribution

### 5.1 PWA / Offline
- Service worker with Workbox
- Cache Mars tiles on first view (up to 200MB configurable limit)
- Offline access to all static data (Spirit, Opportunity, panoramas)
- Install prompt on mobile

### 5.2 Social & SEO
- Open Graph meta tags with dynamic preview images
- Twitter Card support
- Generate social preview image server-side (rover at current position on globe)
- Structured data (JSON-LD) for search engines
- Submit to Product Hunt, Hacker News, r/space

### 5.3 Embed Mode
- `?embed=true` URL param strips header/controls for iframe embedding
- Configurable: which rover, which panel, autoplay
- WordPress/Ghost/Medium embed shortcode documentation

---

## Technical Debt

| Item | Priority | Effort |
|------|----------|--------|
| Replace dead NASA Photos API | P0 | Medium |
| Add error boundaries to all features | P1 | Low |
| Unit tests for sol-date math, format utils | P1 | Low |
| E2E test: globe loads, rover switches work | P2 | Medium |
| ESLint + Prettier setup | P1 | Low |
| CI workflow (typecheck + lint on PRs) | P1 | Low |
| Remove unused `photo-service.ts` re-export | P0 | Trivial |
| Audit all WCAG issues with axe-core | P2 | Medium |
| TypeScript strict: audit `any` casts | P2 | Low |
| Document all CustomEvent payloads | P2 | Low |

---

## Milestone Timeline

| Sprint | Focus | Duration | Outcome |
|--------|-------|----------|---------|
| **S0** | Fix photos, BYOK AI, bugs | 1 week | Working photo gallery, stable features |
| **S1** | Polish, analytics, performance | 1 week | Lighthouse ≥ 80, error handling |
| **S2** | i18n (6 languages) | 2 weeks | Global audience ready |
| **S3** | Backend + image proxy | 1 week | Cloudflare Workers, cached data |
| **S4** | v2 features | 2-3 weeks | Comparison mode, time-lapse, education |
| **S5** | PWA + social + embed | 1 week | Installable, shareable, embeddable |

---

## Decision Log

| Decision | Date | Rationale |
|----------|------|-----------|
| NASA Photos API → RSS feed | 2026-03-19 | Original API (Heroku) is offline; RSS feed returns working image URLs |
| AI features BYOK-only | 2026-03-19 | Cost control for public deployment; ~$0.003/query adds up |
| Plausible for analytics | 2026-03-19 | Privacy-first, no cookies, GDPR compliant, lightweight |
| Cloudflare Workers for backend | 2026-03-19 | Free tier, global edge, no cold starts, KV for caching |
| i18n without framework | 2026-03-19 | JSON + t() helper is sufficient; no need for i18next overhead |

---

## Files to Modify (Sprint 0)

```
src/services/nasa-api.ts          — Rewrite for RSS feed endpoint
src/features/photos/photo-gallery.ts — Update rendering for new photo schema
src/features/photos/camera-filter.ts — Update camera list from new API
src/features/photos/raw-images.ts    — Already uses RSS feed (verify)
src/features/ai-narrator.ts         — BYOK only, remove built-in key
src/features/mission-chat.ts        — BYOK only, remove built-in key
src/types.ts                         — Update NASAPhoto interface
src/config.ts                        — Update NASA_PHOTOS_BASE URL
.github/workflows/deploy.yml        — Remove ANTHROPIC_API_KEY secret
```
