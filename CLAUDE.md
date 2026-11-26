# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

Clio Brain is an offline-first Expo mobile app styled as a detective board: notes, links and files are paper cards on a pannable/zoomable canvas, connected by threads. All data lives on-device in SQLite. It recreates an earlier HTML prototype named Simpul. The on-device database file keeps the old name `simpul.db` on purpose. Product docs: `docs/PRD.md`, `docs/ARCHITECTURE.md`, `docs/CODING_STANDARDS.md`, `DESIGN.md`. Read them before larger changes.

## Expo: do not trust training data

Expo SDK 58 / React Native 0.88 / React 19.3. APIs change every SDK. Before touching an Expo, EAS or RN API, read the versioned docs at `https://docs.expo.dev/versions/v58.0.0/` (index with LLM corrections: `https://docs.expo.dev/llms.txt`). Add packages with `npx expo install <pkg>`, never `npm install <pkg>`.

## Commands

```bash
npx expo start          # dev server (Expo Go runs everything except the Android widget)
npx expo run:android    # development build, needed to see the home screen widget
npx expo start --web    # quick visual check; SQLite on web needs the COOP/COEP headers set in metro.config.js
npm run check           # typecheck + lint; run before committing
npm run typecheck       # tsc --noEmit
npm run lint            # eslint (eslint-config-expo)
npm run format          # prettier + tailwind class sorting
npx expo-doctor         # dependency/config diagnosis
```

There is no test runner configured.

## Architecture

Layering is strict: `features/*` and `components/ui` -> Zustand store (`src/store`) -> `src/db/repo.ts` -> expo-sqlite. Components never import `db/`.

- **`store/data.ts`** holds all data in memory, loaded once at startup. Every action updates state and writes through to SQLite fire-and-forget; on failure it sets `saveFailed`, which surfaces a notice. Relational logic (one thread per item pair in either direction, cascades) belongs here, not in components.
- **`store/ui.ts`** holds view state: tab, list grouping, the single active `Overlay`, thread mode, selected card, per-board viewport, and `ask(...)` for confirm dialogs (every delete must go through it).
- **Navigation has no router.** One active overlay (preview, edit, sheets) is rendered by `features/shell/OverlayHost.tsx`, which also handles Android back per overlay type. The item picker, move sheet, reminder sheet and confirm dialog can stack on top. The single floating button is `features/shell/ActionMenu.tsx` (New item, Thread mode, Tidy board, Settings).
- **Database:** migrations in `db/schema.ts`, versioned via `PRAGMA user_version`. Never edit a shipped migration; append to `MIGRATIONS`. All queries use bound `?` params. Tables: `boards` (folders), `items` (with canvas `x,y,z`, tags as JSON, nullable `remind_at`), `threads` (composite key `from_id,to_id`), `settings` (`currentBoard`), `tombstones` (deletions kept for sync). `boards`, `items` and `threads` carry `updated_at`.
- **Canvas (`features/board`):** one background `GestureDetector` (pan + pinch simultaneous, tap clears selection). Cards sit in a 20000x20000 layer with origin at center, translated/scaled together; it is huge because Android does not deliver touches to children outside parent bounds. Each `PaperCard` drags in canvas units (`translation / zoom`). Threads render in one SVG sized to the threads' bounding box only (avoids giant Android bitmaps); thread labels/hit areas are plain `View`s at midpoints. Canvas pan/pinch run on the UI thread against Reanimated shared values (per-event deltas, zoom around the current focal point) and commit the viewport to `store/ui.ts` only when all fingers lift; card drags still run on the JS thread (`runOnJS: true`).
- **Reminders (`lib/reminders.ts`):** `items.remind_at` (epoch ms, nullable). Store actions schedule/cancel local notifications keyed by item id (`setReminder`, plus cancels in item/board delete and reset); never call expo-notifications from components. `useReminderTaps` in `App.tsx` opens the tapped item; it is skipped on web, where the response APIs throw.
- **Widget (`src/widget`, Android only):** `react-native-android-widget`, configured in the app.json plugin (widget name `Agenda` must match `widget/index.tsx`). Always load it through `lib/widget.ts` (`widgetModule()`), never import `react-native-android-widget` or `@/widget` statically: it throws without its native module (Expo Go, iOS, web). The headless task reads `db/repo` directly; the app redraws via `startWidgetSync()`. Taps are `cliobrain://item/<id>` and `cliobrain://capture` deep links handled in `App.tsx`.
- **Backups (`lib/backup.ts`, Settings sheet):** JSON export via share sheet; import is validated by `parseBackup` (rejects anything incomplete or inconsistent) and applied by `store.importBackup` -> `repo.replaceAll` in one transaction. Bump `version` and keep reading old versions if `Item`/`Board`/`Thread` change shape.
- **Google Drive sync (`lib/google.ts`, `lib/drive.ts`, `lib/sync.ts`, `store.syncDrive`):** every store action that changes a record must set `updatedAt`, and every delete must `bury(...)` a tombstone, or sync resurrects or loses data. The sign-in library loads lazily (`require` inside a try) like the widget; never import it statically. Android-only: the google-signin config plugin is deliberately absent because without Firebase it only adds an iOS URL scheme.
- **Files (`lib/files.ts`):** document picker copies into `Paths.document/files`, stores the copy's URI; opening uses the system share sheet.

## Conventions that are not obvious

- Import via the `@/` alias. Features may import the store, `components/ui` primitives, and `features/shell`, but not other features.
- Screens never build their own buttons/fields/sheets; use `components/ui` primitives (domain-free).
- Styling: NativeWind `className` with tokens from `tailwind.config.ts`; no raw hex or arbitrary numbers. Values className cannot express (SVG stroke, shadows, icon color) come from `src/theme/tokens.ts`. Touch targets min `h-11`, default `h-12`.
- Store reads use narrow selectors; selectors returning new arrays need `useShallow` or `useMemo`. Inside handlers use `useData.getState()`.
- Accessibility: every `Pressable` has `accessibilityRole`; icon-only buttons and unlabeled fields need `accessibilityLabel`; errors use `accessibilityLiveRegion`.
- UI text, docs and code comments are English; comments only for the why. No em dash characters in UI text or docs.
- Commits: Conventional Commits, one logical change each.
