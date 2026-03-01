# UX Improvements: Notion-like CRM Experience

This document lists user experience improvements to make the CRM feel more like Notion: fast, keyboard-first, minimal friction, and context-aware.

---

## Implemented

### 1. Global command palette (⌘K / Ctrl+K)
- **What:** A command palette opens from anywhere with **⌘K** (Mac) or **Ctrl+K** (Windows/Linux).
- **Includes:** Quick navigation (Dashboard, Contacts, Companies, Deals, Tasks, Settings, etc.) and quick actions (New Contact, New Company, New Deal) that navigate and open the create sheet.
- **Why Notion-like:** Notion’s quick find and slash commands reduce clicks and keep focus in the product.

### 2. Deep links for “New” from command palette
- **What:** List pages (Contacts, Companies, Deals) support `?open=new` in the URL. The command palette uses this so “New Contact” (etc.) opens the create sheet immediately.
- **Why Notion-like:** One action from the palette completes the flow without an extra click.

### 3. Clearer clickable table rows
- **What:** Rows in data tables that open a sheet on click now have a hover state (`hover:bg-muted/50`) so it’s obvious they’re interactive.
- **Why Notion-like:** Subtle but clear affordance, similar to Notion’s list/database rows.

---

## Recommended (not yet implemented)

### Navigation and layout

| Improvement | Description | Notion-like benefit |
|-------------|-------------|----------------------|
| **Shareable detail URLs** | Add routes like `/contacts/:id`, `/companies/:id` so a contact/company can be opened in a full-page or split view and the URL can be shared or bookmarked. | Same as Notion: link to a “page” (record). |
| **Split view** | Optional list + detail side-by-side (e.g. list left, detail right in a panel/sheet) so the list stays visible while editing. | Less context switching. |
| **Breadcrumbs** | On detail or nested views, show breadcrumbs (e.g. Contacts > Acme Corp). | Orientation and quick back. |

### Forms and editing

| Improvement | Description | Notion-like benefit |
|-------------|-------------|----------------------|
| **Inline editing** | Click a cell (e.g. name, status) to edit in place (input or small popover), save on blur/Enter. Keep the sheet for “full record” or many fields. | Edit where you see it, fewer modals. |
| **Full-page create/edit** | Optional routes like `/contacts/new`, `/contacts/:id` for long forms and deep linking; “New” could open either sheet or full page. | Document-like creation and sharing. |
| **Fewer confirm dialogs** | For low-risk actions (e.g. delete task), consider undo toasts or soft delete instead of a blocking confirmation. | Less interruption. |

### Lists and views

| Improvement | Description | Notion-like benefit |
|-------------|-------------|----------------------|
| **Deal pipeline (Kanban)** | Toggle on Deals page: Table view vs Board view by stage. | Visual pipeline like Notion boards. |
| **Faceted filters** | Use existing tablecn filter/facet components on Contacts, Companies, Deals for status, sector, stage, etc. | Narrow down without leaving the list. |
| **Card / list layout toggle** | Optional card or compact list layout for contacts/companies. | Different density and “block” feel. |
| **Saved views** | Save filter/sort/column sets as named views (e.g. “My hot leads”). | Personal workspaces. |

### Loading and transitions

| Improvement | Description | Notion-like benefit |
|-------------|-------------|----------------------|
| **Consistent skeletons** | Use a shared table skeleton (e.g. `DataTableSkeleton`) on list load; add skeleton placeholders for dashboard cards and chart. | No layout jump, perceived speed. |
| **View transitions** | Optional View Transitions API or router-level transition when switching pages. | Smoother, more app-like. |
| **Snappier sheet/dialog** | Slightly shorter open/close durations for sheets and dialogs if they feel slow. | Responsive feel. |

### Typography and spacing

| Improvement | Description | Notion-like benefit |
|-------------|-------------|----------------------|
| **Type scale** | Define a small set of tokens (e.g. page title, section, body) in CSS and use them consistently. | Cohesive, calm typography. |
| **Page rhythm** | One token or convention for vertical spacing on list and detail pages. | Consistent density. |
| **Compact mode** | Optional denser list (smaller row height / spacing) for power users. | More data on screen. |

### Commands and shortcuts

| Improvement | Description | Notion-like benefit |
|-------------|-------------|----------------------|
| **Shortcut hints in UI** | Show ⌘K in the command palette and in tooltips (e.g. “New Contact ⌘K”). | Discoverability. |
| **Document shortcuts** | In sidebar footer or Settings, list “⌘K Command palette”, “⌘B Toggle sidebar”. | Power users. |
| **Search from palette** | In palette, “Search contacts / companies / deals” that filters and opens the right record. | Notion-style quick find. |

### Notes and rich content

| Improvement | Description | Notion-like benefit |
|-------------|-------------|----------------------|
| **Rich text for descriptions** | Use a minimal rich text or block editor (e.g. Tiptap) for Background/Description on contact, company, deal. | Notion-like blocks and formatting. |
| **Notes as first-class** | If notes exist as an entity: list + detail with rich text and inline create from contact/company/deal. | Notes as pages. |
| **Markdown preview** | If keeping plain textarea, add a simple markdown preview or single “block” per field. | Slight document feel without full editor. |

---

## Summary

- **Done:** Global command palette (⌘K), `?open=new` for create sheets, table row hover.
- **Next:** Consider shareable detail URLs, inline editing, Kanban for deals, faceted filters, skeletons, and shortcut hints for a stronger Notion-like experience.
