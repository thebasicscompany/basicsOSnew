# Basics OS — Audit Plan (with Dead Code Analysis)

## Executive Summary

This app is an **open-source startup operating system** built with React, Drizzle ORM, Hono API, and a monorepo structure. The architecture is solid, but **significant dead code** accumulated during the migration from entity-specific pages (ContactsPage, CompaniesPage, DealsPage) to the object-registry pattern (ObjectListPage, RecordDetailPage). Removing dead code should be a **priority** before other fixes.

## Quick Reference Summary

| Category | Count | Notes |
|----------|-------|-------|
| Dead pages | 8 | 6 replaced by ObjectListPage/RecordDetailPage; 2 never routed |
| Dead component folders | 3 | `spreadsheet/`, `kanban/`, `tablecn/` — remove entirely |
| Unused data-table exports | 3 | AddColumnPicker, ViewSaveBar, ColumnFooter |
| Dead hooks | 7 | useBulkExport, useSupportCreateSuggestion, saved-queries, user-menu-context, simple-form-iterator-context, use-mobile, use-custom-field-defs |
| Keep | — | use-contacts (TasksPage, ContactSheet), ContactSheet, CreateAttributeModal (ObjectListPage) |

**Revised phase order:** (1) Dead code removal → (2) Critical bugs → (3) Add-column fix → (4) Automations → (5) UX polish → (6) Cleanup.

---

## Part 1: Dead Code — What Is ACTUALLY Used

### Routed Pages (KEEP)

| Page | Route | File |
|------|-------|------|
| StartPage | `/` | `src/components/auth/start-page.tsx` |
| SignupPage | `/sign-up` | `src/components/auth/signup-page.tsx` |
| DashboardPage | `/dashboard` | `src/components/pages/DashboardPage.tsx` |
| ProfilePage | `/profile` | `src/components/pages/ProfilePage.tsx` |
| SettingsPage | `/settings` | `src/components/pages/SettingsPage.tsx` |
| ImportPage | `/import` | `src/components/pages/ImportPage.tsx` |
| ChatPage | `/chat` | `src/components/pages/ChatPage.tsx` |
| ConnectionsPage | `/connections` | `src/components/pages/ConnectionsPage.tsx` |
| TasksPage | `/tasks` | `src/components/pages/TasksPage.tsx` |
| ObjectListPage | `/objects/:objectSlug` | `src/components/pages/ObjectListPage.tsx` |
| RecordDetailPage | `/objects/:objectSlug/:recordId` | `src/components/pages/RecordDetailPage.tsx` |
| AutomationsApp | `/automations/*` | `@basics-os/automations` |
| VoiceApp | `/voice` | `@basics-os/voice` |
| MCPViewerApp | `/mcp` | `@basics-os/mcp-viewer` |

### Dead Pages (REMOVE)

| File | Reason |
|------|--------|
| `src/components/pages/ContactsPage.tsx` | Replaced by ObjectListPage |
| `src/components/pages/CompaniesPage.tsx` | Replaced by ObjectListPage |
| `src/components/pages/DealsPage.tsx` | Replaced by ObjectListPage |
| `src/components/pages/ContactDetailPage.tsx` | Replaced by RecordDetailPage |
| `src/components/pages/CompanyDetailPage.tsx` | Replaced by RecordDetailPage |
| `src/components/pages/DealDetailPage.tsx` | Replaced by RecordDetailPage |
| `src/components/pages/AirtableImportPage.tsx` | Never routed; `/airtable-import` not in App.tsx |
| `src/components/object-settings/ObjectSettingsPage.tsx` | No route for `/objects/:slug/settings` |

### Dead Components (REMOVE)

| Component | Reason |
|-----------|--------|
| `src/components/legacy-data-table.tsx` | Never imported |
| `src/components/custom-field-input.tsx` | Never imported |
| `src/components/manage-columns-dialog.tsx` | Never imported |
| `src/components/inline-edit-field.tsx` | Only used by dead detail pages |
| `src/components/notes-feed.tsx` | Only used by dead detail pages |
| `src/components/deals-kanban.tsx` | Only used by dead DealsPage |
| `src/components/cells/KanbanField.tsx` | Never imported |
| **Spreadsheet folder (entire)** | Only used by dead Contacts/Companies/Deals pages |
| **Kanban folder (entire)** | Only used by dead deals-kanban |
| **tablecn folder (entire)** | Only used by legacy-data-table (both dead) |
| `src/components/ai-elements/reasoning.tsx` | Never imported |
| `src/components/ai-elements/sources.tsx` | Never imported |
| `src/components/sheets/CompanySheet.tsx` | Only used by dead pages |
| `src/components/sheets/DealSheet.tsx` | Only used by dead pages |
| `src/components/data-table/AddColumnPicker.tsx` | Exported but never imported |
| `src/components/data-table/ViewSaveBar.tsx` | Exported but never imported (ObjectListPage inlines save/discard) |
| `src/components/data-table/ColumnFooter.tsx` | Exported but never imported |
| `src/components/object-settings/` (except CreateAttributeModal) | ObjectSettingsPage not routed; AttributesTab, AttributeEditDialog, ObjectConfigTab, IconPicker only used there |

**Note:** `ContactSheet` is KEEP — used by TasksPage. `CreateAttributeModal` is KEEP — used by ObjectListPage (and would be by AttributesTab if ObjectSettingsPage were routed).

### Dead Hooks (REMOVE or REFACTOR)

| Hook | Reason |
|------|--------|
| `src/hooks/useBulkExport.tsx` | Never imported |
| `src/hooks/useSupportCreateSuggestion.tsx` | Never imported |
| `src/hooks/saved-queries.tsx` | Never imported |
| `src/hooks/user-menu-context.tsx` | Never imported |
| `src/hooks/simple-form-iterator-context.tsx` | Never imported |
| `src/hooks/use-mobile.ts` | Never imported (frontend-dev SKILL mentions useIsMobile but nothing uses it) |
| `src/hooks/use-custom-field-defs.ts` | Only used by custom-field-input (dead) |

### Hooks to KEEP (with usage notes)

| Hook | Used by |
|------|---------|
| `use-contacts` | TasksPage, ContactSheet, command-palette (types only) |
| `use-companies` | command-palette (types only) — consider extracting types |
| `use-deals` | command-palette (types only) — consider extracting types |

### Supporting Code for Dead Features (REMOVE)

| Path | Reason |
|------|--------|
| `src/config/tablecn/` | Only referenced by tablecn (dead) |
| `src/lib/tablecn/` | Only referenced by tablecn (dead) |
| `src/types/tablecn/` | Only referenced by tablecn (dead) |

### Data-Table: What Stays

- **DataTable.tsx** — Used by ObjectListPage
- **DataTableToolbar.tsx** — Exports `buildColumnItems`, `ColumnsPopover` used by ObjectListPage; the `DataTableToolbar` *component* itself is not rendered (ObjectListPage inlines Actions dropdown)
- **SortPopover, FilterPopover, ViewSelector** — Used by ObjectListPage

### Deletion Order (Dependencies)

1. Remove dead pages first (they pull in dead components)
2. Remove dead components that depend on dead pages
3. Remove spreadsheet, kanban, tablecn folders
4. Remove dead hooks and supporting config
5. Remove unused exports from data-table/index.ts (AddColumnPicker, ViewSaveBar, ColumnFooter)

---

## Part 2: Critical Bugs (from original audit)

### P0 — Fix Immediately
- **Toaster not mounted** — Add `<Toaster />` to App.tsx
- **IconFilter typo** — ObjectListPage line 225: remove literal `"IconFilter"` text
- **IconDeviceFloppy typo** — AutomationBuilderPage line 358: remove literal `"IconDeviceFloppy"` text
- **NocoViewSortRaw** — use-view-queries.ts line 80: change to `ViewSortRaw`

### Add-Column Flow (Broken)
- Virtual columns cannot be turned on (reducer ignores them; no POST for view columns)
- New attributes never get view_column — add `POST /api/views/view/:viewId/columns`
- When toggling virtual column on, create column via POST and invalidate

---

## Part 3: Implementation Phases (Revised)

| Phase | Scope |
|-------|-------|
| **Phase 1 — Dead code removal** | Delete all files listed in Part 1; update data-table index exports; fix any broken imports |
| **Phase 2 — Critical bugs** | Mount Toaster; fix icon typos; fix NocoViewSortRaw |
| **Phase 3 — Add-column fix** | POST view columns endpoint; wire virtual-column toggle |
| **Phase 4 — Automations** | Fix Save button typo; reloadRule on save; task.updated/deleted events |
| **Phase 5 — UX polish** | EmptyState component; loading consistency; error handling |
| **Phase 6 — Cleanup** | Extract ContactSummary/CompanySummary/Deal types if use-companies/use-deals are removed; align design tokens |

---

## Part 4: Risk Checklist

Before deleting:

1. **use-companies, use-deals** — Command-palette imports types `ContactSummary`, `CompanySummary`, `Deal`. If we delete those hooks, extract types to `src/types/crm.ts` or similar.
2. **ObjectSettingsPage** — Decide: route it (e.g. `/settings/objects` or object-specific) or delete. If delete, CreateAttributeModal stays (used by ObjectListPage).
3. **Airtable import** — Backend has `packages/server/src/routes/airtable-import.ts`. If AirtableImportPage is removed, consider whether to keep/route it or remove backend too.
4. **AGENTS.md / makefile** — AGENTS.md references `make`; makefile is deleted in git status. Update docs to match actual scripts in package.json.
