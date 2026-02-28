# CRUD Sheets + Dynamic Column Management — Implementation Plan

## Overview

Two features:
1. **CRUD Side Sheets** — Add "New" button + slide-in form for creating/editing contacts, companies, deals. Row click opens edit sheet.
2. **Dynamic Columns** — Custom fields stored in DB, surfaced as table columns + form inputs. "Manage Columns" UI to add/delete them.

---

## Current State (Read This First)

- `ContactsPage.tsx`, `CompaniesPage.tsx`, `DealsPage.tsx` — read-only DataTable, no create/edit
- `onRowClick` navigates to `/contacts/:id/show` but that route doesn't exist — redirects to dashboard
- Columns are static `ColumnDef<T>[]` arrays in each page file
- `DataTableViewOptions` already handles show/hide of existing columns
- Old react-admin CRUD components in `src/components/atomic-crm/` are dead code — do NOT use them
- Server: Better Auth + Drizzle ORM, REST API at `/api/*`
- Auth: session cookie, `authMiddleware(auth)` on all API routes

---

## Phase 1 — Database Migration (custom_fields + custom_field_defs)

### 1.1 Create migration file

```
npx drizzle-kit generate
# Or manually create: packages/server/src/db/migrations/XXXX_custom_fields.sql
```

SQL to run:

```sql
-- Add custom_fields jsonb to each entity table
ALTER TABLE contacts  ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}';
ALTER TABLE companies ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}';
ALTER TABLE deals     ADD COLUMN IF NOT EXISTS custom_fields jsonb NOT NULL DEFAULT '{}';

-- Definitions table: one row per custom field per resource type
CREATE TABLE IF NOT EXISTS custom_field_defs (
  id          bigserial PRIMARY KEY,
  resource    varchar(64) NOT NULL,   -- 'contacts' | 'companies' | 'deals'
  name        varchar(128) NOT NULL,  -- internal key, e.g. "lead_source"
  label       varchar(255) NOT NULL,  -- display name, e.g. "Lead Source"
  field_type  varchar(32)  NOT NULL,  -- 'text' | 'number' | 'date' | 'select' | 'boolean'
  options     jsonb,                  -- for field_type='select': ["Option A", "Option B"]
  position    smallint NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (resource, name)
);
```

### 1.2 Update Drizzle schema files

**`packages/server/src/db/schema/contacts.ts`** — add at end of table:
```typescript
customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}).notNull(),
```

**`packages/server/src/db/schema/companies.ts`** — same:
```typescript
customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}).notNull(),
```

**`packages/server/src/db/schema/deals.ts`** — same:
```typescript
customFields: jsonb("custom_fields").$type<Record<string, unknown>>().default({}).notNull(),
```

**Create `packages/server/src/db/schema/custom_field_defs.ts`**:
```typescript
import { pgTable, bigserial, varchar, smallint, jsonb, timestamp } from "drizzle-orm/pg-core";

export const customFieldDefs = pgTable("custom_field_defs", {
  id: bigserial("id", { mode: "number" }).primaryKey(),
  resource: varchar("resource", { length: 64 }).notNull(),
  name: varchar("name", { length: 128 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  fieldType: varchar("field_type", { length: 32 }).notNull(),
  options: jsonb("options").$type<string[]>(),
  position: smallint("position").notNull().default(0),
  createdAt: timestamp("created_at", { withTimezone: true }).defaultNow().notNull(),
});
```

**`packages/server/src/db/schema/index.ts`** — add export:
```typescript
export * from "./custom_field_defs.js";
```

---

## Phase 2 — Server Routes

### 2.1 custom_field_defs route

Create **`packages/server/src/routes/custom-fields.ts`**:

```typescript
import { Hono } from "hono";
import { authMiddleware } from "../middleware/auth.js";
import { eq, asc } from "drizzle-orm";
import * as schema from "../db/schema/index.js";
import type { Db } from "../db/client.js";
import type { createAuth } from "../auth.js";

type BetterAuthInstance = ReturnType<typeof createAuth>;

export function createCustomFieldRoutes(db: Db, auth: BetterAuthInstance) {
  const app = new Hono();
  app.use("*", authMiddleware(auth));

  // GET /api/custom_field_defs?resource=contacts
  app.get("/", async (c) => {
    const resource = c.req.query("resource");
    const rows = await db
      .select()
      .from(schema.customFieldDefs)
      .where(resource ? eq(schema.customFieldDefs.resource, resource) : undefined)
      .orderBy(asc(schema.customFieldDefs.position), asc(schema.customFieldDefs.id));
    return c.json(rows);
  });

  // POST /api/custom_field_defs
  app.post("/", async (c) => {
    const body = await c.req.json<{
      resource: string;
      name: string;
      label: string;
      fieldType: string;
      options?: string[];
    }>();
    // Validate required fields
    if (!body.resource || !body.name || !body.label || !body.fieldType) {
      return c.json({ error: "resource, name, label, fieldType are required" }, 400);
    }
    // Sanitize name to snake_case alphanumeric
    const safeName = body.name.toLowerCase().replace(/[^a-z0-9_]/g, "_");
    const [row] = await db
      .insert(schema.customFieldDefs)
      .values({
        resource: body.resource,
        name: safeName,
        label: body.label,
        fieldType: body.fieldType,
        options: body.options ?? null,
      })
      .returning();
    return c.json(row, 201);
  });

  // DELETE /api/custom_field_defs/:id
  app.delete("/:id", async (c) => {
    const id = Number(c.req.param("id"));
    await db.delete(schema.customFieldDefs).where(eq(schema.customFieldDefs.id, id));
    return c.json({ ok: true });
  });

  return app;
}
```

### 2.2 Wire into app.ts

In **`packages/server/src/app.ts`**, import and mount:
```typescript
import { createCustomFieldRoutes } from "./routes/custom-fields.js";
// ...
app.route("/api/custom_field_defs", createCustomFieldRoutes(db, auth));
```

### 2.3 Update existing CRM routes to pass through custom_fields

In **`packages/server/src/routes/crm.ts`**, the `snakeToCamel` function already handles all fields. The `custom_fields` column will automatically be included in SELECT * queries and passed through in POST/PUT bodies since the route uses generic Drizzle inserts.

**Verify**: Make sure the generic POST handler doesn't strip `custom_fields` from the body. The current handler does `db.insert(table).values(camelBody)` where `camelBody` comes from the request — so `customFields` in the JSON body will map to `customFields` in Drizzle (which maps to `custom_fields` column). This should work without changes.

---

## Phase 3 — Frontend Data Layer

### 3.1 Type definitions

In **`src/hooks/use-contacts.ts`** (and use-companies.ts, use-deals.ts), add `customFields` to the type:
```typescript
export interface ContactSummary {
  // ... existing fields ...
  customFields?: Record<string, unknown>;
}
```

Also add a `Contact` type (full record for edit form) with all fields including `customFields`.

### 3.2 Custom field defs hook

Create **`src/hooks/use-custom-field-defs.ts`**:
```typescript
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { fetchApi } from "@/lib/api";

export interface CustomFieldDef {
  id: number;
  resource: string;
  name: string;
  label: string;
  fieldType: "text" | "number" | "date" | "select" | "boolean";
  options?: string[];
  position: number;
}

export function useCustomFieldDefs(resource: string) {
  return useQuery<CustomFieldDef[]>({
    queryKey: ["custom_field_defs", resource],
    queryFn: () => fetchApi(`/api/custom_field_defs?resource=${resource}`),
  });
}

export function useCreateCustomFieldDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Omit<CustomFieldDef, "id" | "position">) =>
      fetchApi("/api/custom_field_defs", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["custom_field_defs", vars.resource] });
    },
  });
}

export function useDeleteCustomFieldDef() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, resource }: { id: number; resource: string }) =>
      fetchApi(`/api/custom_field_defs/${id}`, { method: "DELETE" }),
    onSuccess: (_, vars) => {
      qc.invalidateQueries({ queryKey: ["custom_field_defs", vars.resource] });
    },
  });
}
```

### 3.3 CRUD mutations for contacts/companies/deals

Add to **`src/hooks/use-contacts.ts`** (and equivalents):
```typescript
import { useMutation, useQueryClient } from "@tanstack/react-query";

export function useCreateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (data: Partial<Contact>) =>
      fetchApi<Contact>("/api/contacts", { method: "POST", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contacts_summary"] });
    },
  });
}

export function useUpdateContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: number; data: Partial<Contact> }) =>
      fetchApi<Contact>(`/api/contacts/${id}`, { method: "PUT", body: JSON.stringify(data) }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contacts_summary"] });
    },
  });
}

export function useDeleteContact() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: number) =>
      fetchApi(`/api/contacts/${id}`, { method: "DELETE" }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["contacts"] });
      qc.invalidateQueries({ queryKey: ["contacts_summary"] });
    },
  });
}
```

Do the same for companies and deals.

---

## Phase 4 — Shared Components

### 4.1 ManageColumnsDialog

Create **`src/components/manage-columns-dialog.tsx`**:

This dialog lets users add/delete custom fields for a given resource.

```tsx
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Trash2, Plus, Settings2 } from "lucide-react";
import { useCustomFieldDefs, useCreateCustomFieldDef, useDeleteCustomFieldDef } from "@/hooks/use-custom-field-defs";

interface Props {
  resource: "contacts" | "companies" | "deals";
}

export function ManageColumnsDialog({ resource }: Props) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<string>("text");

  const { data: defs = [] } = useCustomFieldDefs(resource);
  const createDef = useCreateCustomFieldDef();
  const deleteDef = useDeleteCustomFieldDef();

  const handleAdd = async () => {
    if (!label.trim()) return;
    await createDef.mutateAsync({
      resource,
      name: label.toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, ""),
      label: label.trim(),
      fieldType: fieldType as any,
    });
    setLabel("");
    setFieldType("text");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Settings2 className="h-3.5 w-3.5" />
          Manage Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Custom Columns</DialogTitle>
        </DialogHeader>

        {/* Existing custom fields */}
        <div className="space-y-2">
          {defs.length === 0 && (
            <p className="text-sm text-muted-foreground">No custom columns yet.</p>
          )}
          {defs.map((def) => (
            <div key={def.id} className="flex items-center justify-between rounded-md border px-3 py-2">
              <div>
                <span className="text-sm font-medium">{def.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">({def.fieldType})</span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteDef.mutate({ id: def.id, resource })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        {/* Add new field */}
        <div className="border-t pt-4 space-y-3">
          <p className="text-sm font-medium">Add New Column</p>
          <Input
            placeholder="Column name (e.g. Lead Source)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Select value={fieldType} onValueChange={setFieldType}>
            <SelectTrigger>
              <SelectValue placeholder="Field type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="boolean">Checkbox</SelectItem>
              <SelectItem value="select">Dropdown (define options after)</SelectItem>
            </SelectContent>
          </Select>
          <Button onClick={handleAdd} disabled={!label.trim() || createDef.isPending} className="w-full gap-1">
            <Plus className="h-4 w-4" />
            Add Column
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
```

### 4.2 CustomFieldInput

Create **`src/components/custom-field-input.tsx`**:

Renders the right input based on `fieldType`, used inside create/edit sheets.

```tsx
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { CustomFieldDef } from "@/hooks/use-custom-field-defs";

interface Props {
  def: CustomFieldDef;
  value: unknown;
  onChange: (value: unknown) => void;
}

export function CustomFieldInput({ def, value, onChange }: Props) {
  switch (def.fieldType) {
    case "number":
      return (
        <Input
          type="number"
          value={(value as number) ?? ""}
          onChange={(e) => onChange(e.target.value === "" ? null : Number(e.target.value))}
        />
      );
    case "date":
      return (
        <Input
          type="date"
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
    case "boolean":
      return (
        <Checkbox
          checked={Boolean(value)}
          onCheckedChange={(checked) => onChange(checked)}
        />
      );
    case "select":
      return (
        <Select value={(value as string) ?? ""} onValueChange={onChange}>
          <SelectTrigger>
            <SelectValue placeholder="Select..." />
          </SelectTrigger>
          <SelectContent>
            {(def.options ?? []).map((opt) => (
              <SelectItem key={opt} value={opt}>{opt}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      );
    default:
      return (
        <Input
          value={(value as string) ?? ""}
          onChange={(e) => onChange(e.target.value || null)}
        />
      );
  }
}
```

### 4.3 useCustomColumns hook

Create **`src/hooks/use-custom-columns.ts`**:

Returns TanStack Table `ColumnDef[]` entries generated from custom field definitions.

```typescript
import { type ColumnDef } from "@tanstack/react-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";
import { useCustomFieldDefs } from "./use-custom-field-defs";

export function useCustomColumns<TData extends { customFields?: Record<string, unknown> }>(
  resource: "contacts" | "companies" | "deals"
): ColumnDef<TData>[] {
  const { data: defs = [] } = useCustomFieldDefs(resource);
  return defs.map((def): ColumnDef<TData> => ({
    id: `custom_${def.name}`,
    accessorFn: (row) => row.customFields?.[def.name],
    header: ({ column }) => <DataTableColumnHeader column={column} title={def.label} />,
    meta: { title: def.label },
    cell: ({ getValue }) => {
      const val = getValue<unknown>();
      if (val == null) return "—";
      if (def.fieldType === "boolean") return val ? "Yes" : "No";
      if (def.fieldType === "date" && typeof val === "string") {
        return new Date(val).toLocaleDateString();
      }
      return String(val);
    },
  }));
}
```

---

## Phase 5 — Contact Sheet

Create **`src/components/sheets/ContactSheet.tsx`**:

```tsx
import { useEffect, useState } from "react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetFooter } from "@/components/ui/sheet";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { Trash2 } from "lucide-react";
import { useCreateContact, useUpdateContact, useDeleteContact, type Contact } from "@/hooks/use-contacts";
import { useCustomFieldDefs } from "@/hooks/use-custom-field-defs";
import { CustomFieldInput } from "@/components/custom-field-input";

interface Props {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contact?: Contact | null; // null = create mode, Contact = edit mode
}

const EMPTY: Partial<Contact> = {
  firstName: "",
  lastName: "",
  email: "",
  title: "",
  status: "",
  background: "",
  customFields: {},
};

export function ContactSheet({ open, onOpenChange, contact }: Props) {
  const isEdit = !!contact;
  const [form, setForm] = useState<Partial<Contact>>(EMPTY);

  const { data: customDefs = [] } = useCustomFieldDefs("contacts");
  const createContact = useCreateContact();
  const updateContact = useUpdateContact();
  const deleteContact = useDeleteContact();

  // Populate form when contact changes
  useEffect(() => {
    setForm(contact ?? EMPTY);
  }, [contact, open]);

  const set = (field: keyof Contact, value: unknown) =>
    setForm((prev) => ({ ...prev, [field]: value }));

  const setCustom = (name: string, value: unknown) =>
    setForm((prev) => ({
      ...prev,
      customFields: { ...(prev.customFields ?? {}), [name]: value },
    }));

  const handleSubmit = async () => {
    if (isEdit && contact) {
      await updateContact.mutateAsync({ id: contact.id, data: form });
    } else {
      await createContact.mutateAsync(form);
    }
    onOpenChange(false);
  };

  const handleDelete = async () => {
    if (!contact) return;
    if (!confirm("Delete this contact?")) return;
    await deleteContact.mutateAsync(contact.id);
    onOpenChange(false);
  };

  const isPending = createContact.isPending || updateContact.isPending;

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="w-full max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle>{isEdit ? "Edit Contact" : "New Contact"}</SheetTitle>
        </SheetHeader>

        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <Label>First Name</Label>
              <Input value={form.firstName ?? ""} onChange={(e) => set("firstName", e.target.value)} />
            </div>
            <div className="space-y-1.5">
              <Label>Last Name</Label>
              <Input value={form.lastName ?? ""} onChange={(e) => set("lastName", e.target.value)} />
            </div>
          </div>

          <div className="space-y-1.5">
            <Label>Email</Label>
            <Input type="email" value={form.email ?? ""} onChange={(e) => set("email", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Title / Role</Label>
            <Input value={form.title ?? ""} onChange={(e) => set("title", e.target.value)} />
          </div>

          <div className="space-y-1.5">
            <Label>Status</Label>
            <Input value={form.status ?? ""} onChange={(e) => set("status", e.target.value)} placeholder="e.g. warm, cold, hot" />
          </div>

          <div className="space-y-1.5">
            <Label>Background</Label>
            <Textarea
              value={form.background ?? ""}
              onChange={(e) => set("background", e.target.value)}
              rows={3}
            />
          </div>

          {/* Custom fields */}
          {customDefs.length > 0 && (
            <>
              <Separator />
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Custom Fields</p>
              {customDefs.map((def) => (
                <div key={def.id} className="space-y-1.5">
                  <Label>{def.label}</Label>
                  <CustomFieldInput
                    def={def}
                    value={form.customFields?.[def.name]}
                    onChange={(val) => setCustom(def.name, val)}
                  />
                </div>
              ))}
            </>
          )}
        </div>

        <SheetFooter className="flex justify-between">
          {isEdit && (
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteContact.isPending}>
              <Trash2 className="h-4 w-4 mr-1" />
              Delete
            </Button>
          )}
          <div className="flex gap-2 ml-auto">
            <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
            <Button onClick={handleSubmit} disabled={isPending}>
              {isPending ? "Saving..." : isEdit ? "Save" : "Create"}
            </Button>
          </div>
        </SheetFooter>
      </SheetContent>
    </Sheet>
  );
}
```

---

## Phase 6 — Company Sheet

Create **`src/components/sheets/CompanySheet.tsx`** — same pattern as ContactSheet:

Fields:
- `name` (required, text)
- `sector` (text or select)
- `website` (text)
- `city`, `country` (text)
- `phoneNumber` (text)
- `description` (textarea)
- Custom fields section at bottom

Mutations: `useCreateCompany`, `useUpdateCompany`, `useDeleteCompany` from `use-companies.ts`.

---

## Phase 7 — Deal Sheet

Create **`src/components/sheets/DealSheet.tsx`** — same pattern:

Fields:
- `name` (required, text)
- `stage` (select: "opportunity", "proposal", "won", "lost", etc.)
- `category` (text)
- `amount` (number input)
- `expectedClosingDate` (date input)
- `description` (textarea)
- Custom fields section at bottom

Mutations: `useCreateDeal`, `useUpdateDeal`, `useDeleteDeal` from `use-deals.ts`.

---

## Phase 8 — Update Page Components

### 8.1 ContactsPage

**`src/components/pages/ContactsPage.tsx`** — full replacement:

```tsx
import { useState } from "react";
import { type ColumnDef } from "@tanstack/react-table";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
import { useContacts, type ContactSummary } from "@/hooks/use-contacts";
import { DataTable } from "@/components/data-table";
import { DataTableColumnHeader } from "@/components/tablecn/data-table/data-table-column-header";
import { ContactSheet } from "@/components/sheets/ContactSheet";
import { ManageColumnsDialog } from "@/components/manage-columns-dialog";
import { useCustomColumns } from "@/hooks/use-custom-columns";

// Static base columns
const BASE_COLUMNS: ColumnDef<ContactSummary>[] = [
  {
    accessorKey: "firstName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="First Name" />,
    meta: { title: "First Name" },
  },
  {
    accessorKey: "lastName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Last Name" />,
    meta: { title: "Last Name" },
  },
  {
    accessorKey: "email",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Email" />,
    meta: { title: "Email" },
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Company" />,
    meta: { title: "Company" },
  },
  {
    accessorKey: "status",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Status" />,
    meta: { title: "Status" },
  },
  {
    accessorKey: "nbTasks",
    header: ({ column }) => <DataTableColumnHeader column={column} title="Tasks" />,
    meta: { title: "Tasks" },
  },
];

export function ContactsPage() {
  const [sheetOpen, setSheetOpen] = useState(false);
  const [selected, setSelected] = useState<ContactSummary | null>(null);

  const { data, isPending, isError } = useContacts({ pagination: { page: 1, perPage: 100 } });
  const customColumns = useCustomColumns<ContactSummary>("contacts");
  const columns = [...BASE_COLUMNS, ...customColumns];

  const handleRowClick = (row: ContactSummary) => {
    setSelected(row);
    setSheetOpen(true);
  };

  const handleNew = () => {
    setSelected(null);
    setSheetOpen(true);
  };

  if (isError) {
    return <div className="p-8 text-center text-destructive">Failed to load contacts.</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-semibold tracking-tight">Contacts</h1>
        <div className="flex items-center gap-2">
          <span className="text-sm text-muted-foreground">{data ? `${data.total} total` : ""}</span>
          <Button size="sm" onClick={handleNew} className="gap-1">
            <Plus className="h-4 w-4" />
            New Contact
          </Button>
        </div>
      </div>

      <DataTable
        columns={columns}
        data={isPending ? [] : (data?.data ?? [])}
        onRowClick={handleRowClick}
        toolbar={<ManageColumnsDialog resource="contacts" />}
      />

      <ContactSheet
        open={sheetOpen}
        onOpenChange={setSheetOpen}
        contact={selected as any}
      />
    </div>
  );
}
```

### 8.2 CompaniesPage — same pattern
- Add `CompanySheet` + `ManageColumnsDialog resource="companies"`
- `BASE_COLUMNS` stays the same, append `useCustomColumns("companies")`

### 8.3 DealsPage — same pattern
- Add `DealSheet` + `ManageColumnsDialog resource="deals"`
- `BASE_COLUMNS` stays the same, append `useCustomColumns("deals")`

---

## Phase 9 — DataTable toolbar prop support

The existing `DataTable` component already accepts a `toolbar` prop:
```tsx
<div className="ml-auto flex items-center gap-2">
  {toolbar}
  <DataTableViewOptions table={table} />
</div>
```

No changes needed here — `ManageColumnsDialog` will be passed as `toolbar`.

---

## Phase 10 — Fetch single record for edit

When a row is clicked, `ContactSummary` (the list type) is passed to the sheet. But the sheet may need the full record (e.g. `background`, `customFields`, etc.) that might not be in the summary.

Add a `useContact(id)` hook that fetches the full contact:

```typescript
// src/hooks/use-contacts.ts
export function useContact(id: number | null) {
  return useQuery<Contact>({
    queryKey: ["contacts", id],
    queryFn: () => fetchApi<Contact>(`/api/contacts/${id}`),
    enabled: id != null,
  });
}
```

In `ContactSheet`, when in edit mode:
```tsx
const { data: fullContact } = useContact(contact?.id ?? null);
// Use fullContact for the form instead of contact
useEffect(() => {
  setForm(fullContact ?? contact ?? EMPTY);
}, [fullContact, contact, open]);
```

Do the same for companies and deals.

---

## Acceptance Criteria

### CRUD Sheets
- [ ] "New Contact" button visible in ContactsPage header, opens blank sheet
- [ ] Clicking a contact row opens edit sheet pre-filled with contact data
- [ ] Save creates/updates the record, sheet closes, table refreshes
- [ ] Delete button (edit mode only) removes the record with confirm dialog
- [ ] Same behavior for Companies and Deals
- [ ] Custom field values are saved and re-loaded correctly

### Dynamic Columns
- [ ] "Manage Columns" button opens dialog showing existing custom fields
- [ ] User can add a custom field (label + type) — appears as a new table column
- [ ] User can delete a custom field — column disappears from table + forms
- [ ] Custom field inputs appear in create/edit sheets
- [ ] Column visibility dropdown (existing `DataTableViewOptions`) still works for show/hide

---

## File Summary

| File | Action |
|---|---|
| `packages/server/src/db/schema/contacts.ts` | Add `customFields` column |
| `packages/server/src/db/schema/companies.ts` | Add `customFields` column |
| `packages/server/src/db/schema/deals.ts` | Add `customFields` column |
| `packages/server/src/db/schema/custom_field_defs.ts` | **Create** |
| `packages/server/src/db/schema/index.ts` | Export `customFieldDefs` |
| `packages/server/src/routes/custom-fields.ts` | **Create** |
| `packages/server/src/app.ts` | Mount `/api/custom_field_defs` route |
| DB migration SQL | Add columns + create table |
| `src/hooks/use-custom-field-defs.ts` | **Create** |
| `src/hooks/use-custom-columns.ts` | **Create** |
| `src/hooks/use-contacts.ts` | Add create/update/delete/single mutations |
| `src/hooks/use-companies.ts` | Add create/update/delete/single mutations |
| `src/hooks/use-deals.ts` | Add create/update/delete/single mutations |
| `src/components/manage-columns-dialog.tsx` | **Create** |
| `src/components/custom-field-input.tsx` | **Create** |
| `src/components/sheets/ContactSheet.tsx` | **Create** |
| `src/components/sheets/CompanySheet.tsx` | **Create** |
| `src/components/sheets/DealSheet.tsx` | **Create** |
| `src/components/pages/ContactsPage.tsx` | Rewrite |
| `src/components/pages/CompaniesPage.tsx` | Rewrite |
| `src/components/pages/DealsPage.tsx` | Rewrite |

---

## Notes

- `fetchApi` is the base fetch helper in `src/lib/api/index.ts` — check its signature before using in new hooks; it may need `{ method, body, headers }` shape matching existing usage
- Server snake_case ↔ camelCase conversion is handled by `snakeToCamel()` in `crm.ts` — custom field names going through the body will be passed as-is since they're nested inside `custom_fields` jsonb
- The `configuration` table already exists and could be used to store custom field defs instead of a new table — but a dedicated table is cleaner and avoids naming conflicts
- For deal stages in `DealSheet`, hardcode the defaults ("opportunity", "proposal-made", "in-negociation", "won", "lost", "delayed") — these match the existing data
