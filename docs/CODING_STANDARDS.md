# Coding standards

## General

- TypeScript strict, `noUncheckedIndexedAccess`, no `any`. Domain types live in `src/types.ts`.
- Internal imports use the `@/` alias (e.g. `@/store/data`).
- One main component per file, file name = component name (PascalCase). Pure helpers go in `src/lib` (camelCase).
- UI text and code comments are in English. Comments only explain the why, never restate what the code shows.
- Do not use em dash characters in UI text or docs.
- Run `npm run check` before committing. Format with `npm run format`.

## Feature structure

- `components/ui` holds only domain-free primitives. Screens never build their own buttons, fields or sheets; always use the primitives.
- `features/<area>` holds the screens and components specific to that area. Features may use the store and primitives, and may not import from other features except `shell`.
- Data logic (relationship validation, cascades) lives in `store/data.ts`, not in components.

## Styling

- Use NativeWind `className` with tokens from `tailwind.config.ts`. No raw hex values or arbitrary numbers in components.
- Values className cannot express (SVG stroke, shadows, icon color) come from `src/theme/tokens.ts`.
- Font size scale: `text-xs` 12, `text-sm` 14, `text-base` 16, `text-lg` 18, `text-xl` 20, `text-2xl` 24, `[28px]` only for the preview title.
- Corners: `rounded-card` 2, `rounded-ctl` 4, `rounded-t-sheet` 8.
- Touch targets at least 44pt (`h-11`) and 48pt by default (`h-12`).

## State

- Read the store with narrow selectors: `useData((s) => s.items)`. Selectors that build a new array must be wrapped in `useShallow`, or computed with `useMemo` from slices of state.
- Inside event handlers, use `useData.getState()` to avoid triggering re-renders.
- Store actions handle database writes; components do not call `db/`.

## Accessibility

- Every `Pressable` has an `accessibilityRole`; buttons without text require an `accessibilityLabel`.
- Fields without a visible label require an `accessibilityLabel`; fields with a label use `accessibilityLabelledBy`.
- Error messages use `accessibilityLiveRegion`.
- Every delete action goes through `useUi().ask(...)` (confirm dialog).

## Database

- Every query in `db/repo.ts` uses bound parameters (`?`), never string interpolation of input.
- A schema change = a new migration at the end of the `MIGRATIONS` array.

## Commits

Conventional Commits format: `feat:`, `fix:`, `refactor:`, `docs:`, `chore:`. One logical change per commit.
