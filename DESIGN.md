# DESIGN.md: Clio Brain

Dial: ENERGY 2 / RHYTHM 1 / MOTION 1

## Identity

A detective evidence board turned into an app, not a photo of a real board. Paper cards pinned to a green chalkboard, connected by straight threads. The feel we want: calm, tidy, slightly analog, and compact on a phone screen.

The product owner set this direction through prototype iterations. Binding decisions:

- Green chalkboard canvas in one flat color with a dot grid, one full-screen layer with no edges. No gradients, smudges or texture.
- Cards, pins and threads stay paper-styled; pins are small flat circles, threads are straight lines. No 3D effects or curved threads.
- UI as compact as possible: no explanatory text, edit and delete buttons are icon-only, every delete uses a confirmation popup.
- Space-hungry controls are removed; there are no zoom buttons (use pinch).

## Color

| Token      | Value     | Role                                                         |
| ---------- | --------- | ------------------------------------------------------------ |
| `ink`      | `#14110F` | app background, edit screen, action menu buttons             |
| `canvas`   | `#1F3D2E` | chalkboard                                                   |
| `paper`    | `#EFE8D8` | note cards, sheets, popups                                   |
| `paper2`   | `#E2DAC6` | link cards                                                   |
| `paper3`   | `#F6F2E8` | file cards                                                   |
| `text`     | `#1A1612` | text on paper                                                |
| `mute`     | `#5E554A` | secondary text and placeholders on paper (5.6:1)             |
| `dim`      | `#A89F90` | secondary text on dark backgrounds                           |
| `rule`     | `#8A7F6E` | field underlines, row dividers                               |
| `red`      | `#B3261E` | single accent: pins, FAB, primary button, type label, errors |
| `redLight` | `#E8584D` | default thread and delete icon on dark backgrounds           |
| `tape`     | `#EADFB8` | thread label tape                                            |

One red accent, used sparingly at decision points. Thread colors: red, yellow `#F2D45C`, white `#EFE8D8`, blue `#7FB2EA`; chosen to contrast on green.

## Typography

| Role                    | Font                      | Why                                                                    |
| ----------------------- | ------------------------- | ---------------------------------------------------------------------- |
| Titles, labels, buttons | Oswald 500/600, uppercase | narrow and firm like stamps and archive labels, saves width on a phone |
| Body, fields, meta      | Courier Prime 400/700     | case-report typewriter, readable at small sizes                        |

Scale: 12, 14, 16, 18, 20, 24, 28. Body and input fields are 16px (prevents iOS auto-zoom). Small 12px uppercase labels with wide tracking only for type labels and group headings.

## Space, corners, shadows

- 4-based spacing: 4, 8, 12, 16, 20, 24. Screen edge 16, paper padding 16.
- Corners: cards 2px, controls 4px, sheets 8px top. No pill shapes except the FAB and pins.
- Shadows only mark elevation: `card` (cards on the board), `raised` (popups, edit paper), `fab`.

## Motif

A flat 10px red pin centered on the top edge of every paper (cards and the preview popup), and a small fixed tilt per card (-2.5 to 2.4 degrees, from an id hash) that pivots on the pin, so threads always meet the pin exactly. Together they make the board feel hand-pinned without extra decoration.

## Components

| Component     | Spec                                                                                                                                                    |
| ------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Button        | height 48, corner 4, Oswald 16 uppercase; variants `primary` (red), `outline`, `danger`                                                                 |
| IconButton    | 48 or 44 square, 24 icon; paper variants (`outline`, `primary`, `danger`) and dark (`dark`, `darkDanger`, `dock`); `label` required                     |
| Field         | min height 48, thin dark fill + `rule` underline, Courier 16; `headline` for Oswald 24 titles                                                           |
| RichField     | note body editor, Field-styled, no toolbar: markdown typing (`- ` / `* ` bullets, `1. ` numbers, `[] ` checklist, `**bold**`, `*italic*`, `~~strike~~`) |
| UndoBar       | paper snackbar bottom left after a delete, message + outline Undo button, 6 s                                                                           |
| Segmented     | height 44, corner 4; `dark` over the canvas (active = paper), `paper` in sheets (active = ink)                                                          |
| Row           | height 48, thin divider, 16 icon on the left, right meta max 35%                                                                                        |
| Sheet         | from the bottom, 70% scrim, header: optional back, title, icon actions, close                                                                           |
| ConfirmDialog | centered, max 320, uppercase message, Cancel left, red Delete right                                                                                     |
| Board card    | width Note 200, Link 178, File 152                                                                                                                      |
| Icon          | one family in `Icon.tsx`: 24 grid, 2 stroke, round caps; sizes 16/20/24                                                                                 |

## Motion

Only press feedback (opacity) and finger-driven motion (drag, pinch). No decorative animation.

## Screen layout

- Header floats over the canvas: CLIO BRAIN + red dot, folder button on the right, Board/List tabs.
- One FAB bottom right on every tab. It opens the action menu: paper label chips beside dark icon buttons, stacked above it over a 70% scrim. In thread mode the FAB turns paper with a ✕.
- List: sub-tabs, then paper row cards on ink.
- Edit: full ink screen, one paper sheet holding every field.
