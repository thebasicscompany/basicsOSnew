# Page Audit — Basics CRM

Audit of every page for repetitive content, layout inconsistencies, and UX issues.

---

## Bugs (Fix These First)

### 1. Missing `usePageTitle()` on 5 pages
These pages don't register a title, so the header strip shows nothing:

| Page | File |
|------|------|
| Contacts (spreadsheet) | `ContactsPage.tsx` |
| Companies (spreadsheet) | `CompaniesPage.tsx` |
| Deals (spreadsheet/kanban) | `DealsPage.tsx` |
| AI Chat | `ChatPage.tsx` |
| Airtable Import | `AirtableImportPage.tsx` |

Each needs one line added near the top of its component:
```tsx
usePageTitle("Contacts"); // etc.
```

### 2. `AirtableImportPage` has an inline `<h1>` in the page body
Every other page relies on the layout header for the title. AirtableImportPage renders
`<h1>Airtable Import</h1>` inside its own content — inconsistent with the rest of the app.
The `<h1>` should be removed and replaced with `usePageTitle("Airtable Import")`.

### 3. `AirtableImportPage` uses `p-4` instead of `py-4`
All other pages use `py-4` (layout provides horizontal padding via `px-4`). This page
uses `p-4`, doubling the horizontal padding to `px-8`.

---

## Repetitive / Duplicate Content

### 4. Save/Discard buttons appear twice on `ObjectListPage`
When a view is dirty, the user sees two sets of Save/Discard controls:
- One inside `DataTableToolbar` (right side of the filter toolbar)
- One in `ViewSaveBar` rendered separately below the toolbar

These are functionally identical. One should be removed — `ViewSaveBar` is redundant
because `DataTableToolbar` already shows save state. Remove `ViewSaveBar` entirely or
keep only `ViewSaveBar` and drop the one inside the toolbar.

### 5. `RecordDetailPage` shows the record name in both places
- Header strip (layout): small `text-sm font-medium` title via `usePageTitle`
- Page body: large `text-2xl font-semibold` heading with icon

The two instances say the same thing. The layout header is the right place for the name
as a wayfinding aid. The page body should keep its large heading because it also shows
the icon, back button, and action buttons — that's a full record header, not just a
title repeat. Consider setting `usePageTitle("")` to suppress the layout strip title on
detail pages (the rich in-page header is sufficient).

### 6. Two separate contact list views exist
- `ContactsPage.tsx` — SpreadsheetGrid, own toolbar baked in
- `ObjectListPage.tsx` when `objectSlug = "contacts"` — DataTable + ViewSelector

Both can be reached and show the same records with different UI. This is confusing to
users and doubles the maintenance surface. Decide on one and remove the routing to the
other, or unify behind a single implementation.

Same applies to **Companies** and **Deals** (SpreadsheetGrid vs. ObjectListPage DataTable).

---

## Layout Optimizations by Page

### Dashboard
**Current:** Two stacked components (SectionCards + ChartAreaInteractive), no toolbar, no controls.
**Suggestion:** Add a `py-4` wrapper if not present. Consider a date-range picker in the top-right
for the chart (already has "Last 30 days" in the chart card itself — that's fine, no change needed
there). No major issues.

---

### ObjectListPage (Contacts / Companies / Deals / any object)
**Current toolbar order (top to bottom):**
1. Row: icon + count · · · · · · · · · · New button
2. Row: View tabs
3. Row: Sort · Filter · Columns · · · Save · Discard
4. Row: ViewSaveBar (Save · Discard again)

**Problems:**
- Three toolbar tiers before you reach the table feels heavy
- Duplicate Save/Discard (see §4 above)
- The "New" button is far from the table content it affects

**Suggested layout:**
```
[ ViewTabs ··················· New button ]
[ Sort · Filter · Columns ···· icon count ]
[ ────────────────────────────────────── ]
[ Table ]
```
Move the **New** button to the right end of the view tabs row (same row as tabs, not
above them). Move the count + icon to the right of the toolbar row instead of
a separate row above. This collapses 3 rows into 2 and saves ~48px of vertical height
before the table starts.

Drop `ViewSaveBar` entirely — Save/Discard only appear in the filter toolbar row when dirty.

---

### RecordDetailPage
**Current layout:**
```
Breadcrumb
[ ← Back  Icon  Name  Type ] · · [ ← →  ★  ⋯ ]
─────────────────────────────────────────────────
[ Tabs: Overview · Activity · Notes · Tasks ]  │ Details sidebar
  Field list                                   │ Same fields (editable)
                                               │ Show X empty fields
                                               │ ─────
                                               │ System fields
```

**Problems:**
- The right "Details" sidebar and the "Overview" tab show the **same fields** — the
  sidebar is redundant with Overview. Users don't know which one to edit.
- Activity, Notes, Tasks tabs are stubbed with placeholder divs — shows empty space.

**Suggestions:**
- Remove the right sidebar entirely. Show all fields in the Overview tab (with the
  "Show empty fields" toggle). This frees horizontal space and eliminates the confusion.
- Or flip it: make the right sidebar the *only* field editor (Attio-style) and remove the
  Overview tab field list. Keep the tab bar for Activity / Notes / Tasks only.
- Either way, stub tabs (Activity, Notes, Tasks) should show a proper empty state message
  instead of an empty div.

---

### TasksPage
**Current:**
```
[ {n} upcoming ·············· Add task ]
[ 🔍 Search (max-w-xs) ]
[ Overdue · Today · Tomorrow · This Week · Later groups ]
```

**Suggestions:**
- The search bar is `max-w-xs` (~320px) which looks orphaned on wide screens. Extend it
  to `max-w-sm` or match the width of the task list container.
- The delete button (trash icon) only appears on row hover. On touch devices this is
  invisible. Move it to a `...` menu or keep it visible but smaller and grayer.
- Consider moving search + Add task onto the same row to save vertical height:
  ```
  [ 🔍 Search ··············· {n} upcoming · Add task ]
  ```

---

### ConnectionsPage
**Current:**
```
"Connect services to use in your automations."
[ API key warning (conditional) ]
[ Slack card ]  [ Gmail card ]
```

**Suggestions:**
- The warning box about the missing API key is shown on this page but the action it
  describes (go to Settings → add API key) is on a completely different page. Consider
  a direct inline link with more prominence, or redirect the user proactively.
- Provider cards are 2-column grid with `max-w-lg`. On wide screens this leaves a lot
  of empty space to the right. No change is needed unless more providers are added.
- Small win: Add the provider logo/icon to each card (Slack and Google have recognizable
  brand icons from simple-icons or lucide).

---

### ImportPage
**Current:** Drag-drop zone + "Expected format" info box. File handlers are stubbed.
**Suggestions:**
- The description line "Import contacts from a CSV file" duplicates what the drag-drop
  zone already says. Remove the top description or make it different (e.g. link to docs).
- Once functional: show upload progress, row count, and validation errors below the
  drop zone rather than navigating away.

---

### ProfilePage
**Current:**
```
"Your account details."
[ Avatar · Name · Role badge ]
[ Sign out (red text button) ]
```

**Suggestions:**
- "Your account details" as a description is unnecessary — the content is self-evident.
  Remove it.
- Sign out feels disconnected sitting under the profile card. Either move it to the
  `NavUser` dropdown (already has it there) and remove it from this page, or frame
  it in a "Danger zone" section at the bottom.
- Email address is not shown anywhere on this page. It should be visible.
- If profile editing isn't supported yet, add a greyed-out "Edit profile" button to
  signal the affordance exists even if unimplemented.

---

### SettingsPage
**Current:**
```
"Application configuration."
[ API Configuration card ]
  [ API key input · Save ]
  [ Clear key (conditional) ]
  [ Link to get API key ]
```

**Suggestions:**
- "Application configuration" is generic. The single setting is the API key — the
  description could be more specific, or removed since the card heading says "API
  Configuration".
- The external link "Get your Basics API key" lives inside the card body, visually
  buried. Move it to a `?` tooltip next to the card heading, or an info banner.

---

## Padding Reference (Correct State)

Every page should follow this pattern:

| Source | Class | Purpose |
|--------|-------|---------|
| `AppLayout` (`px-4`) | Left/right padding from layout | Applied once, not per page |
| Page root div | `py-4` | Top/bottom breathing room |

**Do not** add `px-*` to page root divs — the layout already provides it.

Pages that currently comply: Dashboard, Tasks, Connections, Import, Profile, Settings, ObjectListPage (uses `pt-4` — fine).
Pages that do not: AirtableImportPage (`p-4`), ContactsPage/CompaniesPage/DealsPage (no padding at all, inherited from SpreadsheetGrid).

---

## Priority Order

| # | Issue | Effort |
|---|-------|--------|
| 1 | Add `usePageTitle()` to 5 pages | Trivial — 1 line each |
| 2 | Remove `<h1>` + fix padding in AirtableImportPage | Trivial |
| 3 | Remove `ViewSaveBar` (duplicate Save/Discard) | Small |
| 4 | Suppress layout header title on RecordDetailPage | Small |
| 5 | Collapse ObjectListPage toolbar to 2 rows + move New button | Medium |
| 6 | RecordDetailPage sidebar vs Overview deduplication | Medium |
| 7 | Unify contact/company/deal list views (SpreadsheetGrid vs DataTable) | Large |
| 8 | TasksPage search bar width + delete button visibility | Small |
| 9 | ProfilePage: show email, reframe sign out | Small |
| 10 | RecordDetailPage stub tabs: add empty state | Small |
