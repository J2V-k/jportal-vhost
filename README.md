# JP Portal (JIIT Student Portal)

Modern, mobile-first web client for JIIT WebKiosk built with Vite + React, Tailwind, and PWA capabilities. It supports fast navigation, offline fallback from cached data, exam-focused views, and utilities like a CGPA target calculator.

Features
- **Attendance**: Multi-view interface with overview, per-subject details, daily logs, attendance trends, calendar view, and customizable goal tracking
- **Grades**: Semester SGPA/CGPA summaries, detailed grade cards, marks download with Pyodide-powered PDF processing
- **Exams**: Complete exam schedule with auto-focus during exam windows (configurable via localStorage)
- **Subjects**: Registered subjects list with faculty info, elective choices with basket management and finalization tracking
- **Profile**: Comprehensive personal info, contact details, educational background, hostel information, and quick action buttons
- **Timetable**: Dynamic timetable generation with subject variant management and external service integration
- **Fee**: Secure fee structure display with AES-CBC encrypted payload submission
- **Feedback**: Faculty feedback forms with dynamic questions, rating system, and submission tracking
- **Academic Calendar**: Filterable event calendar with search, month navigation, and category filtering (powered by public/AC.json)
- **CGPA Calculator**: Target planning tool with SGPA calculator, what-if analysis, and semester data import
- **PWA**: Full PWA support with Workbox caching, install prompt (Android), offline mode with cached data, and service worker

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

- Academic Calendar: served from `public/AC.json`. Update that file to modify events.
- Exam auto-tab: set `localStorage` keys `examStartDate` and `examEndDate` to let the app auto-route to Exams during that window.
- Default tab: set `localStorage.defaultTab` to one of `/attendance`, `/grades`, `/exams`, `/subjects`, `/profile`, or `auto`.
- Theme: `localStorage.defaultTheme` to `light` or `dark`.

Project Structure (selected)
- [vite.config.js](vite.config.js): Vite + React + PWA config, chunking, aliases.
- [tailwind.config.js](tailwind.config.js): Theme tokens, animations, dark mode.
- [src/main.jsx](src/main.jsx): App bootstrap.
- [src/App.jsx](src/App.jsx): Routing, authentication flow, offline fallback, global layout.
- [src/context/ThemeContext.jsx](src/context/ThemeContext.jsx): Theme provider/hooks.
- Components
  - [src/components/Header.jsx](src/components/Header.jsx): Top bar with branding, mess menu, theme toggle, offline indicator, settings dialog, and conditional back button.
  - [src/components/Navbar.jsx](src/components/Navbar.jsx): Bottom/side navigation with animated route links, PWA install integration, and adaptive offline restrictions.
  - [src/components/Login.jsx](src/components/Login.jsx): Authentication with auto-login, offline detection, PWA install prompt, and loading states.
  - [src/components/Attendance.jsx](src/components/Attendance.jsx): Multi-tab attendance view with overview, subject details, daily logs, trends, calendar, and goal tracking.
  - [src/components/Grades.jsx](src/components/Grades.jsx): SGPA/CGPA overview, grade cards, marks cards with download, and historical data.
  - [src/components/Exams.jsx](src/components/Exams.jsx): Exam schedule with event filtering, auto-focus mode, and semester selection.
  - [src/components/Subjects.jsx](src/components/Subjects.jsx): Subject list with faculty info, component breakdown (L/T/P), and elective choices integration.
  - [src/components/Profile.jsx](src/components/Profile.jsx): Tabbed profile with personal/contact/education/hostel info and quick action buttons to other features.
  - [src/components/Timetable.jsx](src/components/Timetable.jsx): Dynamic timetable with variant management, campus/batch config, and iFrame integration.
  - [src/components/Fee.jsx](src/components/Fee.jsx): Fee display with encrypted payload generation for secure submission.
  - [src/components/Feedback.jsx](src/components/Feedback.jsx): Faculty feedback with dynamic questions, ratings, and encrypted submission.
  - [src/components/AcademicCalendar.jsx](src/components/AcademicCalendar.jsx): Event calendar with filtering, search, and month navigation.
  - [src/components/CGPATargetCalculator.jsx](src/components/CGPATargetCalculator.jsx): SGPA/CGPA calculator with target planning and what-if scenarios.
  - [src/components/MessMenu.jsx](src/components/MessMenu.jsx): Mess menu dialog with daily/weekly views.
  - [src/components/SettingsDialog.jsx](src/components/SettingsDialog.jsx): Settings with theme, default tab, swipe navigation, attendance goal, and cache management.
  - Sub-components: AttendanceCard, SubjectInfoCard, GradeCard, MarksCard, SubjectChoices, CircleProgress, InstallPWA.
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
- Ensure `public/AC.json` exists.

Docs
- This repo includes an Astro (Starlight) documentation site under `docs/`.
- **Live Docs**: [https://J2V-k.github.io/jportal-vhost](https://J2V-k.github.io/jportal-vhost) (auto-deployed via GitHub Actions)

License
See [LICENSE](LICENSE).
