JP Portal (JIIT Student Portal)

Modern, mobile-first web client for JIIT WebKiosk built with Vite + React, Tailwind, and PWA capabilities. It supports fast navigation, offline fallback from cached data, exam-focused views, and utilities like a CGPA target calculator and mess menu.

Features
- Attendance: Overview, per-subject trends, daily logs, and targets.
- Grades: Semester summaries, grade cards, and marks download support.
- Exams: Schedule and events, with auto-focus during exam windows.
- Subjects: Registered subjects, faculties, and details.
- Profile: Basic personal and hostel details.
- Timetable: Subject and schedule context (uses subject/profile data).
- Fee: Payload serialization using AES for secure submission.
- Academic Calendar: Rich, filterable view powered by public/AC.json.
- Mess Menu: Quick access dialog; dev server exposes /api/messmenu.
- PWA: Workbox caching, install prompt, offline mode via cached data.

Tech Stack
- React 18 with React Router (HashRouter)
- Vite 7, Tailwind CSS, Framer Motion, Radix UI primitives
- vite-plugin-pwa with Workbox configuration
- Pyodide (via CDN) with cached wheels under public/artifact
- Local caching via localStorage with a structured key scheme
- Deployment-ready for Vercel

Quick Start
1) Prerequisites
- Node.js 18+ and npm 9+

2) Install & run
```
npm install
npm run dev
```
Visit the local URL Vite prints. The app uses HashRouter, so routes render under `#/...`.

3) Build & preview
```
npm run build
npm run preview
```

Dev Tips
- Mess Menu during dev: the Vite plugin serves `/api/messmenu` from `data/mess_menu.json` in project root. Create that file to enable the dialog locally (schema matches the component’s expectations; see sample.json for reference data patterns).
- Academic Calendar: served from `public/AC.json`. Update that file to modify events.
- Exam auto-tab: set `localStorage` keys `examStartDate` and `examEndDate` to let the app auto-route to Exams during that window.
- Default tab: set `localStorage.defaultTab` to one of `/attendance`, `/grades`, `/exams`, `/subjects`, `/profile`, or `auto`.
- Theme: `localStorage.defaultTheme` to `light` or `dark`.

Project Structure (selected)
- [vite.config.js](vite.config.js): Vite + React + PWA config, dev `/api/messmenu`, chunking, aliases.
- [tailwind.config.js](tailwind.config.js): Theme tokens, animations, dark mode.
- [src/main.jsx](src/main.jsx): App bootstrap.
- [src/App.jsx](src/App.jsx): Routing, authentication flow, offline fallback, global layout.
- [src/context/ThemeContext.jsx](src/context/ThemeContext.jsx): Theme provider/hooks.
- Components
  - [src/components/Header.jsx](src/components/Header.jsx): Top bar, MessMenu button, theme toggle, offline badge, settings.
  - [src/components/Navbar.jsx](src/components/Navbar.jsx): Bottom/side navigation with adaptive items (offline restrictions).
  - [src/components/Login.jsx](src/components/Login.jsx): Sign-in with `jsjiit` login, PWA install prompt, offline fallback.
  - [src/components/MessMenu.jsx](src/components/MessMenu.jsx): Dialog; fetches `/api/messmenu`; daily/weekly views.
  - [src/components/AcademicCalendar.jsx](src/components/AcademicCalendar.jsx): Filterable calendar UI powered by `public/AC.json`.
  - Other feature views: Attendance, Grades, Exams, Subjects, Profile, Timetable, Fee, Feedback, CGPATargetCalculator.
- Utilities & Scripts
  - [src/components/scripts/cache.js](src/components/scripts/cache.js): Typed localStorage cache with expirations.
  - [src/components/scripts/artificialW.js](src/components/scripts/artificialW.js): Offline `WebPortal` shim that reads cached data.
  - [src/lib/pyodide.js](src/lib/pyodide.js): Loads Pyodide and required wheel packages (cached by PWA).
  - [src/lib/jiitCrypto.js](src/lib/jiitCrypto.js): AES-CBC utilities to serialize fee payloads.
  - [src/lib/utils.js](src/lib/utils.js): Tailwind class combiner.
- Public
  - [public/artifact](public/artifact): Python wheel artifacts cached by Workbox.
  - [public/AC.json](public/AC.json): Academic calendar data.
  - [public/pwa-icons](public/pwa-icons): PWA icons referenced by manifest.

Authentication & Offline Mode
- On startup, the app attempts silent login using `localStorage.username` and `localStorage.password` with the `jsjiit` `WebPortal` (CDN import).
- If login fails but sufficient cached data exists (attendance/grades/profile), the app swaps to `ArtificialWebPortal`, which serves data from cache-only.
- The header shows an “Offline” badge in this mode and navigation restricts features that require live data.

Caching & PWA
- Workbox caches are configured in [vite.config.js](vite.config.js) to:
  - Precache Pyodide assets from CDN and local wheel artifacts.
  - Cache-first for Python wheels and Pyodide WASM/data.
  - Stale-while-revalidate for JS/CSS and marks PDFs.
- The cache key scheme is documented in [src/components/scripts/cache.js](src/components/scripts/cache.js).

Fee Payloads
- The Fee page uses `serialize_payload()` from [src/lib/jiitCrypto.js](src/lib/jiitCrypto.js) to AES-CBC encrypt payloads. Treat any secrets carefully and avoid logging sensitive info in production.

Development Notes
- HashRouter is used to support static hosting (e.g., Vercel). Routes live under `#/...`.
- The PWA manifest and Workbox settings are provided by `vite-plugin-pwa` in [vite.config.js](vite.config.js).
- The app imports `WebPortal` and `LoginError` from the `jsjiit` CDN ESM build.

Security & Privacy
- Credentials are stored in `localStorage` for convenience of auto-login. This is suitable for personal devices only. If this is not desired, remove that behavior in [src/App.jsx](src/App.jsx) and [src/components/Login.jsx](src/components/Login.jsx).
- Do not expose any server secrets; this is a client-only app.

Deployment
- The project is deployable to Vercel. See [vercel.json](vercel.json) and use `npm run build` as the build step.
- Ensure `public/AC.json` exists and that any optional dev-time JSON files you used (e.g., `data/mess_menu.json`) are provided by your production backend or removed.

Docs
- This repo includes an Astro (Starlight) documentation site under `docs/`.
- **Live Docs**: [https://J2V-k.github.io/jportal-vhost](https://J2V-k.github.io/jportal-vhost) (auto-deployed via GitHub Actions)

License
See [LICENSE](LICENSE).
