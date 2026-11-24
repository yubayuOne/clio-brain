# PRD: Clio Brain

Version 1.0 · Status: MVP

## 1. Background

Networked note apps like Obsidian are powerful but feel heavy on a phone: lots of menus, a focus on markdown text, and a relationship graph that is hard to touch. Clio Brain takes the core idea (saving and connecting) and wraps it in a metaphor people get instantly: the evidence board from detective films. Every note, link or file is a paper card held by a pin, and the relationships between cards are threads.

## 2. User

One person who collects ideas, references and files from their phone and wants to see how they relate. A real example: a business owner keeping F&B business ideas and tech business ideas separate, saving reference links and cost sheet files, then connecting them.

## 3. Goals

1. Capture a note, link or file in a few taps from any screen.
2. Connect two items visually, with a thread label and color.
3. Separate topics into folders without hassle, even with hundreds of folders.
4. Work fully without internet. Data never leaves the device.

## 4. Non-goals (MVP)

- Sync between devices, accounts, or cloud backup.
- Full-text search across notes (removed from the prototype at the owner's request).
- Nested folders, collaboration, a markdown editor, or file content previews.
- Dedicated tablet or desktop layouts.

## 5. Features and acceptance criteria

### F1. Board (infinite canvas)
- Green chalkboard background with a dot grid that pans and scales along, with no edges.
- One-finger drag to pan, two-finger pinch to zoom (0.4x to 2.5x) keeping the point under the fingers in place.
- Cards can be dragged; position is saved when the finger lifts. A touched card rises to the top.
- Tapping a card opens the preview.
- **Tidy board** (in the action menu) arranges the current folder's cards in a 3-column grid and resets the view.
- An empty board shows a hint card telling the user to tap the + button.

### F2. Cards
- Three types: Note (cream paper), Link (darker paper with a newspaper-style domain masthead), File (light paper with a dark block showing the file extension).
- Every card has a flat red pin at the top center, a fixed tilt per card, a type label, an INBOX badge when unprocessed, a title of at most 2 lines, a body of at most 3 lines, and tags.

### F3. Threads
- Thread mode (in the action menu): tap the first card, then the second card to draw a thread, then the Thread sheet opens. While it is on, the main button turns into a paper ✕ that exits it.
- A thread is a straight 2pt line from pin to pin, with no 3D effect.
- An optional label shows as a paper tape at the thread's midpoint, tilted along the thread up to 20 degrees.
- Four colors: red (default), yellow, white, blue.
- Tap the label or the thread's midpoint to change the label/color or cut the thread (with confirmation).
- Threads only exist within one folder.

### F4. Add item
- **New item** in the action menu opens the "New item" sheet: type choice, link URL or file picker, optional title, note.
- Validation: at least one of title, note, link or file is filled; the error message shows above the button.
- Automatic title when empty: domain name (link), file name (file), or the first 40 characters of the note.
- New items land in the Inbox and are placed at the center of the current board view.
- Files are copied into the app's documents folder so they survive the original being moved.

### F5. Preview
- A popup styled as a finished note, not a form: type, large title, link/file, body, tags, and tappable "Connects to" and "Referenced by" lists.
- Two icon buttons: Edit (pencil) and Close (cross).

### F6. Edit
- Full screen, compact: no labels or explanatory text, placeholders name the fields.
- Top bar: Back icon, item type, Delete icon (with confirmation popup).
- Fields: title (grows with content), link URL + open icon (link type), file name (file type), body, comma-separated tags and folder on one row.
- Thread list, one row per thread: outgoing/incoming arrow, title, label. The last row "+ Connect" opens the item picker.
- Going back from edit marks an Inbox item as done.
- Moving an item to another folder cuts its threads (the sheet says so).

### F7. List
- Inbox, Type, Tag sub-tabs styled like the Board/List tabs.
- Inbox: unprocessed items, newest first, count shown as a badge.
- Type: three category rows with counts; tap to see their items. The active tab changes to "‹ Name" to go back.
- Tag: tag list A-Z with counts, same drill-down behavior.

### F8. Folders
- The folder name button in the header opens the Folder sheet: search, recently opened folders (when there are more than 8 folders), all folders A-Z (natural number order), item count per folder.
- A search with no results offers "Create folder ...".
- Manage folders: create a new folder, rename the current folder, delete the current folder and everything in it (confirmation). The last folder cannot be deleted.
- The board view (pan/zoom) is remembered per folder while the app is open.

### F10. Reminders
- The edit screen has an "Add reminder" row that opens the Reminder sheet: date and time rows (system pickers on Android, inline pickers on iOS), Save, and a Remove icon (with confirmation) when a reminder exists.
- The default time is the next full hour at least 30 minutes away; a time in the past is refused with an error above the button.
- At the chosen time the phone shows a local notification with the item title, even when the app is closed. No network involved.
- Tapping the notification opens the item's folder and its preview.
- Cards and the preview show a red bell with the reminder time.
- If notifications are not allowed, the reminder is still saved and the sheet says the phone will not alert.
- Deleting an item or its folder cancels its reminder; changing the title updates a pending notification.

### F12. Action menu and settings
- One red button bottom right replaces the separate Tidy, Thread and + buttons. Tapping it opens a menu over a scrim: New item, Thread mode and Tidy board (board tab only), Settings. Tapping the scrim, the ✕ or Android back closes it.
- Settings has **Export data**: writes all folders, cards, threads and reminders to `clio-brain-YYYY-MM-DD.json` and opens the share sheet to save or send it. Attached files are referenced, not included.
- **Import data**: pick a backup file; anything that is not a complete, consistent Clio Brain backup is refused with a message. A valid file asks for confirmation ("Replace all data with this backup? N folders, M items.") and then replaces everything in one transaction; if writing fails the old data is kept. Reminders are rescheduled from the backup.

### F11. Home screen widget (Android)
- A 4x2 widget "Clio Brain reminders": the next upcoming reminder as a pinned paper note (label NEXT, or the day when it is not today; time; title), and beside it the brand, how many reminders are left today, the rest of today's reminders (time and title, as many as fit) and a red + button.
- Tapping the note or a row opens that item's folder and preview; + opens the New item sheet; anywhere else opens the app.
- The widget redraws when reminders change while the app is open, and Android refreshes it every 30 minutes so passed reminders drop off.
- Empty states: "No upcoming reminders" on the note, "Nothing else today." in the list.
- Needs a development or release build; Expo Go and iOS run the app without the widget.

### F9. States
- Loading: "Opening board" card.
- Database fails to open: error card with a "Start a new board" button.
- Save fails: a dismissible notice at the bottom of the screen.
- Empty: empty board, empty Inbox, no tags yet, no search results.
- Example data on first launch is marked "Example:" so it is not mistaken for real data.

## 6. Non-functional requirements

- Fully offline; no network requests other than opening a link at the user's request.
- Touch targets at least 44pt; body text at least 14px, input fields 16px.
- Every icon control has an `accessibilityLabel`; the Android back button closes the topmost layer.
- Folder and item lists use virtualization (FlatList).

## 7. Open questions

1. Do we need data export/import (a JSON file) as a backup before sync exists?
2. Do we need a way to return an item to the Inbox? There is currently none once an item is done.
3. Global search: when does it come back, and what does it cover (titles only or bodies too)?
4. ~~Final logo and app icon.~~ Done: Clio engraving, see `assets/`.
