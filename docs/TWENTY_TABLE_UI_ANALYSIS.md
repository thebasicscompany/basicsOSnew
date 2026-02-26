# Twenty Table UI — Deep Dive & Copy Strategy

Analysis of Twenty's record table for copying its look into Basics CRM while keeping Supabase auth and data.

---

## 1. Twenty's Table Architecture

### Stack
| Layer | Technology |
|-------|------------|
| **Styling** | `@emotion/styled`, `@linaria/react` |
| **State** | Jotai (atoms, family selectors) |
| **Theme** | `twenty-ui` package (ThemeProvider, ThemeContext) |
| **DnD** | `@hello-pangea/dnd` |
| **Data** | GraphQL + Apollo, object-metadata driven |

### Component Hierarchy
```
RecordTableContent
└── RecordTableStyleWrapper (flex, column)
    ├── RecordTableHeader (sticky header row)
    │   ├── RecordTableHeaderDragDropColumn (32px)
    │   ├── RecordTableHeaderCheckboxColumn (32px)
    │   ├── RecordTableHeaderFirstCell (sticky)
    │   ├── RecordTableHeaderFirstScrollableCell
    │   ├── RecordTableHeaderCell[] (resizable)
    │   ├── RecordTableHeaderAddColumnButton
    │   └── RecordTableHeaderLastEmptyColumn
    └── RecordTableBody (virtualized or grouped)
        └── RecordTableTr (per row)
            └── RecordTableFieldsCells
                └── RecordTableCellStyleWrapper (per cell)
                    └── RecordTableCell
```

### Key Visual Specs
| Property | Value |
|----------|-------|
| Row height | 32px |
| Header | `background.primary`, `font.color.tertiary`, `border-right: 1px light` |
| Cells | `background.primary`, `border-bottom` + `border-right` light |
| Selected row | `accent.quaternary` (light blue tint) |
| Border color | `theme.border.color.light` (gray4) |
| Sticky columns | First 3 (drag, checkbox, first data column) |
| Resizable | Yes, via `RecordTableHeaderResizeHandler` |

### Twenty Theme (Light)
- `background.primary` = gray1 (white)
- `background.secondary` = gray2 (hover)
- `background.tertiary` = gray4 (active)
- `accent.quaternary` = blue2 (selected row)
- `border.color.light` = gray4
- `font.color.tertiary` = gray9 (header text)
- `font.color.primary` = gray12 (cell text)

---

## 2. Basics CRM's Current Table

- **Component:** `DataTable` in `src/components/admin/data-table.tsx`
- **Base:** shadcn `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableCell`
- **Data:** ra-core `useDataTableDataContext`, Supabase via data provider
- **Features:** Sort, bulk select, column toggle, row click to edit

---

## 3. Copy Strategy: Visual Clone (Recommended)

**Goal:** Make Basics CRM's table *look* like Twenty without rebuilding its architecture.

### Option A: Style Override (Low Effort)

Override the shadcn `Table` components with Twenty-like styles:

1. **Row height:** `h-8` (32px) on TableRow
2. **Header:** Tertiary/muted text, light borders, sticky
3. **Cells:** Light borders (right + bottom), compact padding
4. **Selected:** Light blue/indigo tint (accent.quaternary)
5. **Hover:** Subtle gray (background.secondary)

**Files to modify:**
- `src/components/ui/table.tsx` — add Twenty-style classes
- Or create `src/components/admin/data-table-twenty-style.tsx` — wrapper with custom classes

**Tailwind equivalents:**
```css
/* Twenty header */
.header-cell {
  height: 32px;
  background: white; /* or --background */
  color: hsl(0 0% 60%); /* tertiary */
  border-right: 1px solid hsl(0 0% 94%);
  border-bottom: 1px solid hsl(0 0% 94%);
}

/* Twenty cell */
.table-cell {
  height: 32px;
  padding: 0 8px;
  background: white;
  border-right: 1px solid hsl(0 0% 94%);
  border-bottom: 1px solid hsl(0 0% 94%);
}

/* Selected row */
[data-state=selected] .table-cell {
  background: hsl(220 70% 97%); /* accent quaternary */
}
```

### Option B: New Table Component (Medium Effort)

Create a `TwentyStyleDataTable` that:
- Uses the same ra-core DataTable logic
- Renders with a div-based layout (like Twenty) instead of `<table>`
- Sticky header, sticky first column
- Same visual styling as Option A

### Option C: Full Twenty Clone (High Effort — Not Recommended)

Port Twenty's RecordTable:
- Would require Jotai, emotion, twenty-ui theme
- Virtualization, record groups, inline editing
- Deeply coupled to their GraphQL/object-metadata model
- **Not worth it** — Basics CRM has different data model (contacts, companies, etc.)

---

## 4. What We Keep from Basics CRM

- ✅ Supabase Auth
- ✅ Supabase data provider (ra-supabase-core)
- ✅ ra-core List, DataTable, field components
- ✅ React Router
- ✅ Existing CRUD flows

---

## 5. Implementation Checklist (Option A)

1. [ ] Add CSS variables or Tailwind classes for Twenty-like colors (gray scale, accent)
2. [ ] Update `src/components/ui/table.tsx` with:
   - `h-8` row height
   - `border-r border-b border-border/50` on cells
   - `text-muted-foreground` on header
   - `px-2` cell padding (8px)
3. [ ] Add sticky header (`sticky top-0 z-10 bg-background`)
4. [ ] Add sticky first column for list views (optional)
5. [ ] Match selected row color to Twenty's accent.quaternary
6. [ ] Test on ContactList, CompanyList, etc.

---

## 6. Dependencies

Twenty uses:
- `@emotion/styled` — we use Tailwind, no need
- `@linaria/react` — we use Tailwind
- `twenty-ui` — we use shadcn
- `jotai` — we use ra-core store

**No new dependencies needed** for Option A. Pure Tailwind/CSS.

---

## 7. Summary

| Approach | Effort | Result |
|----------|--------|--------|
| **Option A: Style override** | 1–2 hours | Table looks like Twenty, zero architecture change |
| **Option B: New component** | 1–2 days | More control, sticky columns, div layout |
| **Option C: Full port** | Weeks | Not recommended |

**Recommendation:** Option A. Update the table component styles to match Twenty's look. Keep Supabase, ra-core, and existing flows intact.
