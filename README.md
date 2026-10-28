# Pishro · پیشرو

Personal task manager for the desktop with a Linear-style workflow: projects with keys and issue IDs
(`KAR-12`), grouped list and kanban board, inline status/priority menus, a full page per task
(auto-saving title and description, properties panel, subtasks, comments and history in one
timeline), Today / Upcoming / All views, a ⌘K command palette and keyboard-first creation.
Offline-first; data lives in one SQLite file in the user-data folder.

Brand: `src/renderer/src/assets/brand/pishro-icon.svg` (app icon) and `pishro-mark.svg` (in-app mark).
`pnpm brand:export` regenerates `build/icon.{png,ico,icns}` from the SVG.

Stack and layout follow the `accounting` (Daftar) app: Electron + electron-vite, React 19,
TanStack Router/Query, react-aria-components, Tailwind 4, MikroORM + Kysely over better-sqlite3,
zod contract between renderer and main, Biome, Vitest. Task UI ported from sakoocloud-console.

```
src/main        window, IPC dispatcher, composition root
src/preload     the single typed bridge (window.bridge.call)
src/shared      contract (zod), DTOs, formatting
src/modules     tasks domain / application / infrastructure, shared kernel, SQL migrations
src/renderer    app shell + router, features/tasks, ui kit
```

## Develop

```bash
pnpm install
pnpm dev
pnpm check   # typecheck + lint + tests
```

## Build

```bash
pnpm dist:mac        # Apple Silicon: dist/Pishro-<version>-arm64.dmg + .zip
pnpm dist:mac:x64    # Intel Mac
pnpm dist:mac:dir    # unpacked .app only, fastest for a local test
pnpm dist:win        # Windows NSIS installer
pnpm dist:linux      # AppImage
pnpm dist:all        # everything above
```

Mac builds are ad-hoc signed (no Apple developer certificate, not notarized). A DMG built on this
machine opens normally; one downloaded from elsewhere needs right-click → Open the first time.

If `pnpm dev` says "Electron uninstall", fetch the binary once: `node node_modules/electron/install.js`.
`TASKS_DATA_DIR=/some/dir pnpm dev` runs against a throwaway database.

## Keys

`⌘K` or `/` palette (Tab on a task changes its status) · `C` new task · `⌘↵` submit task or comment ·
`Esc` back from a task · `⌘\` sidebar · `?` all shortcuts · drag cards between board columns.
