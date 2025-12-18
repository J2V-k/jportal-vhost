Contributing Guide

Thanks for your interest in contributing! This document outlines how to set up the project locally, coding standards, and our PR process.

Local Setup
- Requirements: Node.js 18+ and npm 9+
- Install dependencies and start dev server:
```
npm install
npm run dev
```

Useful Dev Data
- Academic Calendar: edit [public/AC.json](public/AC.json).
- Mess Menu (dev-only): create `data/mess_menu.json` at the repo root. The Vite dev server exposes it at `/api/messmenu`. Use a structure compatible with the component (see `MessMenu.jsx`).

Project Conventions
- Language: React + Vite (ES Modules)
- State: Local component state; theme via [ThemeContext](src/context/ThemeContext.jsx).
- Data Layer: Live via `jsjiit` `WebPortal` (CDN import). Offline via [ArtificialWebPortal](src/components/scripts/artificialW.js) + cache helpers in [cache.js](src/components/scripts/cache.js).
- PWA: Configured via `vite-plugin-pwa` in [vite.config.js](vite.config.js). Workbox handles caching strategies for Pyodide CDN, local artifacts, and static assets.

Code Style & Linting
- Run lint: `npm run lint`
- Prefer small, focused components and keep props narrow.
- Avoid inline comments unless necessary; keep functions short and descriptive.
- Use `cn()` from [src/lib/utils.js](src/lib/utils.js) to merge classes.

Commit & Branching
- Branch from `main` using `feat/<topic>`, `fix/<topic>`, or `docs/<topic>`.
- Use Conventional Commits for messages:
  - `feat: add CGPA goal tracking`
  - `fix: handle offline marks fetch`
  - `docs: document PWA caching`

Pull Requests
- Include a clear description, screenshots for UI changes, and testing notes.
- Keep PRs small and focused; if a PR grows too large, split it.
- Link related issues and describe any data or environment requirements.

Testing & Verification
- Manual checks:
  - Login flow (online/offline fallback)
  - Attendance, Grades, Exams, Subjects navigation
  - Mess Menu (dev endpoint) and Academic Calendar rendering
  - PWA install prompt on Android; offline caching works after first load
- Build check: `npm run build` followed by `npm run preview`

Security & Privacy
- Do not commit secrets. This is a client-only app.
- Credentials are stored in `localStorage` for auto-login—only on personal devices. 

Documentation
- The Astro (Starlight) docs live in `docs/`. To work on docs:
```
cd docs
npm install
npm run dev
```

Code of Conduct
- Be respectful. Provide constructive feedback. Assume positive intent. If uncertain, ask for clarification.

License
- By contributing, you agree your contributions are licensed under the repository’s license. See [LICENSE](LICENSE).
