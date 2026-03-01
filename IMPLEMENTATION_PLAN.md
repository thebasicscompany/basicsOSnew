# Implementation Plan — Notion/Attio-like CRM Features

## Status Legend
- [ ] Pending
- [x] Done
- [~] In progress

---

## Phase 1: Record Detail Pages (highest impact)

### 1.1 Routes
- [x] Add `CRM_CONTACT_DETAIL`, `CRM_COMPANY_DETAIL`, `CRM_DEAL_DETAIL` to `packages/hub/src/routes.ts`
- [x] Register `/contacts/:id`, `/companies/:id`, `/deals/:id` in `src/App.tsx`
- [x] Update list pages to link rows to detail pages (click navigates instead of opening sheet)
- [x] Update command palette results to navigate to detail pages

### 1.2 Contact Detail Page (`src/components/pages/ContactDetailPage.tsx`)
Layout: two-column (left: form fields; right: activity panel)
- [x] Header: avatar, full name, title, company, status badge, Edit/Delete actions
- [x] Fields section: email, phone, LinkedIn, background, custom fields
- [x] Notes tab: list of contact_notes + inline "Add note" textarea
- [x] Tasks tab: contact-scoped tasks list + add task inline
- [x] Related deals: deals where contactIds includes this contact's id

### 1.3 Company Detail Page (`src/components/pages/CompanyDetailPage.tsx`)
- [x] Header: logo, name, sector badge, website link, Edit/Delete actions
- [x] Fields: city, address, phone, size, revenue, LinkedIn, description, custom fields
- [x] Contacts tab: contacts where companyId = this company
- [x] Deals tab: deals where companyId = this company

### 1.4 Deal Detail Page (`src/components/pages/DealDetailPage.tsx`)
- [x] Header: name, stage badge, amount, expected close date, Edit/Delete actions
- [x] Fields: category, description, custom fields
- [x] Notes tab: deal_notes list + inline "Add note"
- [x] Contacts tab: resolve contactIds array → contact cards
- [x] Company: single company link card

---

## Phase 2: Notes UI

### 2.1 Hooks
- [x] `src/hooks/use-contact-notes.ts` — useContactNotes(contactId), useCreateContactNote, useDeleteContactNote
- [x] `src/hooks/use-deal-notes.ts` — useDealNotes(dealId), useCreateDealNote, useDeleteDealNote

### 2.2 Note Components
- [x] `src/components/notes-feed.tsx` — NotesFeed with inline add textarea (⌘+Enter) + per-note delete

---

## Phase 3: Avatars & Logos in Tables

- [ ] Add `AvatarCell` component to `src/components/data-table.tsx` or standalone file
- [ ] Contacts table: show avatar circle with initials fallback in first column
- [ ] Companies table: show logo square with initials fallback in Name column

---

## Phase 4: Faceted Filters on List Pages

- [ ] Add filter bar component `src/components/filter-bar.tsx`
  - Contacts: filter by status (cold/warm/hot/in-contract), has tasks
  - Companies: filter by sector
  - Deals: filter by stage
- [ ] Integrate filter state with existing `useContacts`/`useCompanies`/`useDeals` hooks via `filter` param

---

## Phase 5: Keyboard Shortcuts

- [ ] `Escape` closes any open sheet (already works via Radix)
- [ ] `⌘+Enter` / `Ctrl+Enter` submits the active sheet form
- [ ] Add shortcut hints to sheet footers

---

## Notes

- Notes backend is **fully ready**: `contact_notes` and `deal_notes` tables, CRUD via `/api/contact_notes?filter={"contact_id":X}`
- Keep sheets for create/edit; detail pages are **read + related records view**
- Use `useParams()` from react-router for `:id` in detail pages
- Navigate back to list with back button (`useNavigate(-1)`)
- Avatars use `{ src: string }` jsonb on contacts; logos same on companies
