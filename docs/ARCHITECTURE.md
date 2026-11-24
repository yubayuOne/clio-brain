# Architecture

## Layers

```
UI (features/*, components/ui)  ->  store (Zustand)  ->  db/repo  ->  expo-sqlite
```

- Components only read the store through selectors and call store actions. Components never call `db/` directly.
- `store/data.ts` holds all data in memory and writes to SQLite on every change (write-through). Data loads once when the app opens; for a personal board this is fast enough and keeps the UI in sync without repeated queries.
- Database writes are fire-and-forget. If one fails, `saveFailed` is set and a notice appears.
- `store/ui.ts` holds view state: tab, list grouping, active overlay, thread mode, selected card, per-folder viewport.

## Data model

| Table | Key columns | Notes |
|---|---|---|
| `boards` | id, name, used_at, created_at | folders |
| `items` | id, board_id, type, title, body, url, file_name, file_uri, tags (JSON), processed, created_at, remind_at, x, y, z | `ON DELETE CASCADE` from boards; `remind_at` (epoch ms, nullable) added in migration 2 |
| `threads` | from_id, to_id, label, color | composite key, cascades from items |
| `settings` | key, value | `currentBoard` |

Migrations run in order from `db/schema.ts`, versioned in `PRAGMA user_version`. Never change a shipped migration; add a new one.

Threads are directed (from -> to), but only one thread is allowed per item pair, in either direction.

## Overlays

Navigation uses a single active overlay (`Overlay` in `store/ui.ts`), not Expo Router. Reason: the app is one workspace with layers on top (preview, edit, sheets), exactly like the prototype, and needs no URLs or screen history. `OverlayHost` renders the active overlay and handles the Android back button per overlay type. The item picker (`picker`), move-to-folder sheet (`moving`) and confirm dialog can stack on top of an overlay.

## Canvas

- `Canvas.tsx` wraps one background `GestureDetector`: pan (centroid of all fingers) and pinch run simultaneously, a background tap clears the selection.
- Cards live in one large layer (20000 x 20000, origin at the center) that is translated and scaled together with `transformOrigin` at the world origin. The layer is large because Android does not deliver touches to children outside their parent's bounds.
- Each `PaperCard` has its own gesture (drag competes with tap). Dragging works in canvas units (`translation / zoom`) so the card stays under the finger at any zoom.
- Threads are drawn in one SVG sized to the threads' bounding box only, not the whole world, to avoid allocating giant bitmaps on Android. Thread labels and touch areas are plain `View`s at the midpoints.
- The dot grid is an SVG `Pattern` whose offset and size follow the viewport, so it looks endless.
- Canvas pan and pinch run on the UI thread and update Reanimated shared values, so the board and dot grid follow the fingers without re-rendering React. Each event applies its delta (`changeX`, `scaleChange`) to the current values and zooms around the current focal point, so adding or lifting a finger never jumps. The viewport is written to `store/ui.ts` once all fingers lift.
- Card drags still run on the JS thread (`runOnJS: true`) and update React state. Move them to shared values if boards reach hundreds of cards.

## Reminders

`lib/reminders.ts` wraps expo-notifications. Store actions own the side effects, like persistence: `setReminder` saves `remindAt` and schedules a local notification whose identifier is the item id, so rescheduling replaces it and cancelling needs no lookup. `deleteItem`, `deleteBoard` and `resetAll` cancel notifications; `updateItem` reschedules when the title of an item with a pending reminder changes. Android notifications use a `reminders` channel created before the permission prompt. `useReminderTaps` (used in `App.tsx`) opens the tapped item, including on cold start; it is skipped on web, where the response APIs throw.

## Widget (Android)

Built with `react-native-android-widget` (its config plugin generates the provider, XML and copies the Oswald/Courier fonts). `expo-widgets` also covers Android but documents no tap actions there, and the widget needs taps.

- `widget/agenda.ts` is the pure selection: next upcoming reminder, the rest of today, today's count.
- `widget/AgendaWidget.tsx` renders it with the library's widget primitives (no React Native views, no hooks). Taps use `OPEN_URI` deep links: `cliobrain://item/<id>` and `cliobrain://capture`, handled with `Linking` in `App.tsx`.
- `widget/index.tsx`: `registerWidget()` (called from `index.ts`, because Android runs the task headless without mounting App) reads SQLite through `db/repo` directly since the store may be empty; `startWidgetSync()` subscribes to the store and redraws only when the agenda changes (card drags change items every frame).
- The library throws on import without its native module, so everything loads through `lib/widget.ts`, which returns null on Expo Go, iOS and web.

## Action menu and backups

`features/shell/ActionMenu.tsx` is the only floating button: its menu holds New item, Thread mode, Tidy board (board tab) and Settings. Menu open state is local; it closes on Android back itself because it is not an overlay.

Backups are JSON (`format: "clio-brain-backup"`, `version: 1`, boards, items, threads). `lib/backup.ts` builds and validates them: an import must be complete and consistent (types, unique ids, items on existing boards, threads within one board, one per pair), otherwise nothing is touched. `store.importBackup` writes through `repo.replaceAll` in one transaction, then cancels and reschedules reminders and reloads. Attached files are only referenced by URI, so a backup restored on another device keeps the cards but not the files.

## Files

`lib/files.ts` uses the document picker, copies the file into `Paths.document/files`, and stores the copy's URI. Opening a file uses the system share sheet (expo-sharing).

## Decisions open to revisit

| Decision | Reason | When to replace |
|---|---|---|
| Load all data into memory | simple, instant UI | when items per device reach the thousands |
| Card drags on the JS thread | readable code | when dragging cards feels choppy on low-end phones |
| Threads tappable only at the midpoint | label doubles as touch area | when users struggle to find unlabeled threads |
| No Expo Router | one workspace with overlays; the two widget deep links are parsed in `App.tsx` | when more deep links or standalone screens are added |
