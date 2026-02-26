# TanStack Table Implementation Plan

## Overview

Migrate the unified `CRMListTable` from shadcn-admin-kit DataTable to TanStack Table. This enables column resizing, reordering, and visibility while keeping ra-core for data, auth, and list state.

## Architecture

```
ra-core (List context: data, filters, sort, selectedIds, onSelect)
    ↓
CRMListTable (TanStack Table: columns, resize, reorder, selection)
    ↓
shadcn Table components (Twenty-style styling)
```

## Phase 1: Core CRMListTable with TanStack ✅

### 1.1 Create TanStack-based table component ✅

**File:** `src/components/atomic-crm/CRMListTable.tsx`

- [x] Use `useReactTable` from `@tanstack/react-table`
- [x] Accept `columns` prop: `ColumnDef<RecordType>[]` (TanStack column format)
- [x] Wire `data` from `useListContext()`
- [x] Implement row selection: sync TanStack `rowSelection` state with ra-core `selectedIds` / `onSelect`
- [x] Implement row click: use `useGetPathForRecordCallback` + `useNavigate` (same as current DataTable)
- [x] Implement shift-click for range selection (copy logic from DataTableBase)
- [x] Keep `BulkActionsToolbar` below table
- [x] Use `table-layout: fixed` or `table.getRowModel()` for layout
- [x] Apply Twenty-style classes to `Table`, `TableHeader`, `TableBody`, `TableRow`, `TableHead`, `TableCell`

### 1.2 Column definition helper ✅

**File:** `src/components/atomic-crm/table/columnHelpers.ts` (optional)

- [x] `createColumn(options)`: wraps TanStack `columnHelper.accessor()` with sensible defaults
- [x] Support: `id`, `header`, `accessorKey`, `cell`, `enableSorting`, `enableResizing`, `size`, `meta`

### 1.3 Enable column resizing ✅

- [x] `getCoreRowModel`, `getSortedRowModel` (if client-side sort needed; we use server-side via ra-core)
- [x] `enableColumnResizing: true`, `columnResizeMode: "onEnd"`
- [x] Apply `column.getSize()` to header/cell width
- [x] Add resize handle in header (optional: `column.getResizeHandler()`)

### 1.4 Enable column reordering (optional, Phase 2)

- `@hello-pangea/dnd` or TanStack's `orderColumn` for drag-and-drop
- Persist column order in localStorage per resource

## Phase 2: Update consumers to columns API ✅

### 2.1 CompanyList ✅

**File:** `src/components/atomic-crm/companies/CompanyList.tsx`

- [x] Define `companyColumns: ColumnDef<Company>[]` with:
  - Company (avatar + name) – custom cell
  - Sector – custom cell with `useConfigurationContext`
  - Size – custom cell with `sizes`
  - Contacts – `accessorKey: "nb_contacts"`, NumberField
  - Deals – `accessorKey: "nb_deals"`, NumberField
  - Created – `accessorKey: "created_at"`, DateField
- [x] Wrap custom cells with `RecordContextProvider` so `useRecordContext` works (row-level provider)
- [x] Replace `<CRMListTable><CRMListTable.Col .../></CRMListTable>` with `<CRMListTable columns={companyColumns} />`
- [x] Remove `filter` prop – moved to `List filters={[<CompanyListFilter />]}`

### 2.2 ContactList ✅

**File:** `src/components/atomic-crm/contacts/ContactList.tsx`

- [x] Define `contactColumns: ColumnDef<Contact>[]` with:
  - Name (avatar + first_name + last_name)
  - Company (ReferenceField)
  - Title, Email, Phone, Status, Last activity, Tasks
- [x] Same pattern: `RecordContextProvider` for cells using `useRecordContext` (row-level)
- [x] Replace Col-based usage with `columns={contactColumns}`

### 2.3 Backward compatibility (optional)

- If we want to keep `CRMListTable.Col` API: add a `useColumnsFromChildren(children)` hook that parses Col props and returns `ColumnDef[]`. More complex; recommend switching to `columns` prop for clarity.

## Phase 3: Filter layout (separate task)

- Toolbar: Search | Sort | Export | New | Filter (popover)
- Filter chips when filters active
- See `docs/FILTER_LAYOUT_PLAN.md` or conversation summary

## Phase 4: Column visibility & persistence

- Add ColumnsButton (show/hide columns) – can reuse from `@/components/admin/columns-button` or build TanStack-based version
- Persist: `columnOrder`, `columnSizing`, `columnVisibility` in localStorage keyed by resource

## File structure

```
src/components/atomic-crm/
├── CRMListTable.tsx          # Main component (TanStack + ra-core)
├── table/
│   ├── columnHelpers.ts      # Optional: createColumn, etc.
│   └── types.ts              # CRMListTableProps, ColumnDef extensions
```

## Testing checklist

- [ ] Companies list renders with all columns
- [ ] Contacts list renders with all columns
- [ ] Row click navigates to show page
- [ ] Checkbox selection works (single, shift-click range)
- [ ] BulkActionsToolbar appears when rows selected
- [ ] Sort button in header triggers server-side sort (ra-core) – via SortButton in toolbar
- [ ] Column resizing works (drag header border)
- [ ] Twenty-style styling preserved (borders, hover, selected)
- [ ] Run `pnpm test` and fix any failures
- [ ] Run `pnpm dev` and manually verify Companies + Contacts pages

## Dependencies

- `@tanstack/react-table` (already added)
- Existing: `ra-core`, shadcn `Table`, `Checkbox`, `Button`, `BulkActionsToolbar`

## Rollback

If issues arise, revert `CRMListTable.tsx` to use `DataTable` and `CRMListTable.Col` / `CRMListTable.NumberCol`. CompanyList and ContactList would need to revert to Col-based column definitions.
