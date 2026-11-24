# Clio Brain

A mobile notes app styled as a detective board: save notes, links and files as paper cards, then connect them with threads. All data stays offline on the device (SQLite). Built from the Simpul HTML prototype, matching its look and flows.

## Stack

| Area | Choice |
|---|---|
| Framework | Expo SDK 58, React Native 0.88, TypeScript (strict) |
| Styling | NativeWind 4 (Tailwind CSS 3.4), tokens in `src/theme/tokens.ts` |
| Database | expo-sqlite (offline, migrations via `PRAGMA user_version`) |
| State | Zustand 5 (`src/store`) |
| Gestures | react-native-gesture-handler 3 (hook API), react-native-svg for the grid and threads |
| Files | expo-document-picker, expo-file-system, expo-sharing |
| Reminders | expo-notifications (local only), @react-native-community/datetimepicker |
| Widget | react-native-android-widget (Android home screen, 4x2) |
| Fonts | Oswald and Courier Prime via `@expo-google-fonts` |

## Running

```bash
npm install
npx expo start          # scan the QR code with Expo Go, or press a / i
```

Everything except the Android home screen widget runs in Expo Go SDK 58. The widget needs your own build:

```bash
npx expo run:android    # or run:ios, needs Android Studio / Xcode
npx eas-cli@latest build --profile development
```

The web version (`npx expo start --web`) is useful for visual checks. SQLite on web needs cross-origin isolation headers, already set in `metro.config.js` for the dev server.

## Scripts

| Command | Purpose |
|---|---|
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (eslint-config-expo) |
| `npm run format` | Prettier + Tailwind class sorting |
| `npm run check` | typecheck then lint, run before committing |

## Structure

```
index.ts                  entry: global.css + registerRootComponent
src/
  App.tsx                 fonts, providers, load/error states, deep links
  types.ts                Board, Item, Thread, Viewport
  theme/tokens.ts         colors, fonts, card sizes, canvas, shadows
  db/                     client, schema (migrations), repo (queries), seed (examples)
  store/                  data.ts (data + actions, writes to SQLite), ui.ts (tab, overlay, modes)
  lib/                    text.ts (pure helpers), files.ts (pick & open files),
                          reminders.ts (schedule/cancel local notifications),
                          widget.ts (loads the widget module when its native side exists),
                          backup.ts (export format and import validation)
  widget/                 agenda.ts (what the widget shows), AgendaWidget, index (task + sync)
  components/ui/          primitives: Button, IconButton, Field, Label, Sheet, Row,
                          Segmented, ConfirmDialog, Icon
  features/
    board/                Canvas, PaperCard, Threads, DotGrid, geometry, BoardView
    list/                 ListView (Inbox / Type / Tag + drill-down)
    item/                 PreviewModal, EditScreen, CaptureSheet, ThreadSheet, LinkPicker,
                          ReminderSheet
    folders/              FolderSheet, FolderForm, MoveSheet
    settings/             SettingsSheet (export / import data)
    shell/                Header, OverlayHost, StatusCard, ActionMenu
docs/
  PRD.md                  product requirements
  ARCHITECTURE.md         data, state, canvas, technical decisions
  CODING_STANDARDS.md     code rules
DESIGN.md                 visual direction and component specs
```

## Docs

- [PRD](docs/PRD.md)
- [DESIGN.md](DESIGN.md)
- [Architecture](docs/ARCHITECTURE.md)
- [Coding standards](docs/CODING_STANDARDS.md)

## Assets

The app icon, Android adaptive/monochrome icons, splash and favicon in `assets/` are generated from the Clio Brain logo (an engraving of Clio on green `#003520`). The adaptive foreground shrinks the art to 72% on that green so launcher masks crop only background.
