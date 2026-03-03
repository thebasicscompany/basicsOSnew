# Sidebar Block Implementation Plan

**Goal:** Use the shadcn sidebar-07 **layout** (header/footer structure) to fix glitchy behavior; port our logic into it. **Terminology:** "Team" → **Workspace** (one workspace for now; multi-workspace later). "Projects" → **Records** (dynamic objects). **Decisions:** Collapsible groups (Apps, Records, Automations); Search as header button; keep NavUser demo items (Billing, Notifications, etc.); **Option B** — AppLayout in `src/` (app owns the shell). Restructure routes as needed.

---

## 0. Recommended Sidebar Layout (Opinion)

Best practice for dashboard/CRM sidebars (see [UX Planet](https://uxplanet.org/best-ux-practices-for-designing-a-sidebar-9174ee0ecaa2), [shadcn blocks](https://www.shadcnblocks.com/block/sidebar4)): **group by function**, use **collapsible sections** to reduce clutter, keep **active route** visible. Suggested structure:

| Group | Purpose | Items (sub-items = links) |
|-------|---------|---------------------------|
| **Apps** | Product surfaces | **CRM** (Dashboard), **AI Chat**, **Voice**, **MCP**, **Connections** |
| **Records** | Data objects (dynamic) | Rendered by `ObjectRegistryNavSection` — Companies, Deals, People, etc. |
| **Automations** | Workflow feature | **All** (list), **Builder**, **Runs**, **Logs** |

- **Apps:** One collapsible; each item is a direct link (no sub-items). Keeps “where do I work?” in one place.
- **Records:** Already a `SidebarGroup` from `ObjectRegistryNavSection`; stays as-is, placed after Apps.
- **Automations:** One collapsible with sub-items so we can add Runs/Logs without cluttering the bar. Routes: `/automations` (All), `/automations/create` or first id (Builder), `/automations/runs`, `/automations/logs` (add these if not present).

**Search:** Header button (not in nav list) that triggers ⌘K / command palette.

**Block structure to follow:** [shadcn sidebar](https://ui.shadcn.com/docs/components/radix/sidebar) — `SidebarProvider` → `Sidebar` → `SidebarHeader` | `SidebarContent` | `SidebarFooter` | `SidebarRail`; main content in `SidebarInset`. No extra `<main>` around SidebarInset.

---

## 1. Current State (Where Things Live)

### 1.1 Layout and shell (today)

- **HubLayout** (shell): `packages/hub/src/HubLayout.tsx`
  - Renders: `SidebarProvider` → `HubSidebar` → `SidebarInset` (with `#main-content` and `Outlet`).
  - Imports sidebar primitives from `basics-os/src/components/ui/sidebar` (note: hub package imports from the main app’s `src`).
- **HubSidebar** (our current sidebar): `packages/hub/src/HubSidebar.tsx`
  - Structure: `Sidebar` (collapsible="icon") → `SidebarHeader` (Basics Hub + SidebarTrigger) → `SidebarContent` (Search, Dashboard, hub nav items, `extraNavContent`) → `SidebarFooter` (Profile, Settings, Import, Sign out).
  - Uses: `authClient` from `basics-os/src/lib/auth`, `ROUTES` from `./routes`, Hugeicons, `Link`/`useMatch`/`useNavigate` from react-router.
  - Receives `extraNavContent` (in the app this is `<ObjectRegistryNavSection />`).

### 1.2 Block components (sidebar-07, already in repo)

All under `src/components/`:

| File | Purpose |
|------|--------|
| `app-sidebar.tsx` | Block’s sidebar: `Sidebar` → `SidebarHeader` (TeamSwitcher) → `SidebarContent` (NavMain, NavProjects) → `SidebarFooter` (NavUser) → `SidebarRail`. Currently uses **demo data** only. |
| `team-switcher.tsx` | Header dropdown: shows active “team” (name, logo, plan). **To become WorkspaceSwitcher.** |
| `nav-main.tsx` | Collapsible nav group (“Platform”) with items that can have sub-items. Uses `<a href>`; for SPA should use React Router `Link`. |
| `nav-projects.tsx` | Second group (“Projects”) with list + “More”. **To be replaced by Records** (see §3). |
| `nav-user.tsx` | Footer user dropdown: avatar, name, email; menu with Account, Billing, Notifications, Log out. Expects `user: { name, email, avatar }`. |

### 1.3 Our logic to preserve

- **Routes:** `packages/hub/src/routes.ts` — `ROUTES` (e.g. `/dashboard`, `/chat`, `/profile`, `/objects`, …).
- **Main nav items (from HubSidebar):**
  - Search (⌘K) → dispatch keyboard event.
  - Dashboard → `ROUTES.CRM`
  - AI Chat → `ROUTES.CHAT`
  - Automations → `ROUTES.AUTOMATIONS`
  - Connections → `ROUTES.CONNECTIONS`
  - Voice → `ROUTES.VOICE`
  - MCP → `ROUTES.MCP`
- **Records (dynamic):** `src/components/ObjectRegistryNavSection.tsx`
  - Uses `useObjects()` from `@/hooks/use-object-registry`.
  - Renders a `SidebarGroup` with label “Records”, group action “New record”, and a list of object links (`/objects/:slug`) with icons from `getObjectIcon(obj.icon)`.
  - Each item has a “+” action that navigates to `?create=true`. Keep this behavior.
- **Footer (current):** Profile, Settings, Import, Sign out. Sign out: `authClient.signOut()` then `navigate("/")` (see HubSidebar).
- **Auth / user:** `src/lib/auth.tsx` — `authClient` (better-auth), `useSession()`. Session has `session.user` (Better Auth default: typically `id`, `name`, `email`, `image`). NavUser expects `{ name, email, avatar }` — map `image` → `avatar` if needed.

### 1.4 Sidebar UI primitive

- `src/components/ui/sidebar.tsx` — desktop-only; provides `SidebarProvider`, `Sidebar`, `SidebarInset`, `SidebarHeader`, `SidebarContent`, `SidebarFooter`, `SidebarRail`, `SidebarTrigger`, menu components, etc. No changes to this file are required for this plan.

---

## 2. Target Structure (After Implementation)

```
SidebarProvider
├── Sidebar (collapsible="icon")
│   ├── SidebarHeader
│   │   ├── WorkspaceSwitcher     ← one workspace for now ("Basics Hub")
│   │   └── Search button (⌘K)   ← header button, opens command palette
│   ├── SidebarContent
│   │   ├── NavGroup "Apps"       ← collapsible: CRM, AI Chat, Voice, MCP, Connections
│   │   ├── Records               ← ObjectRegistryNavSection (Companies, Deals, People, …)
│   │   └── NavGroup "Automations"← collapsible: All, Builder, Runs, Logs
│   ├── SidebarFooter
│   │   └── NavUser               ← user from useSession(); keep demo items + Profile/Settings/Import/Sign out
│   └── SidebarRail
└── SidebarInset
    └── (flex column: #main-content, ErrorBoundary, Outlet)
```

- **WorkspaceSwitcher:** Rename from TeamSwitcher; label “Workspaces”. Single workspace for now; data shape `{ name, logo, plan }[]`.
- **Search:** A button in the header (e.g. next to or below WorkspaceSwitcher) that dispatches the ⌘K keyboard event. Command palette lives in `src/components/command-palette.tsx` (or wherever it’s wired).
- **Nav groups:** Three sections — **Apps** (static links), **Records** (ObjectRegistryNavSection), **Automations** (sub-routes). Use a shared **nav config** (see §2b) and a component that renders multiple collapsible groups with React Router `Link` and active state.
- **NavUser:** Keep block’s demo items (Upgrade to Pro, Account, Billing, Notifications). Add or replace with: Profile, Settings, Import, Sign out. User from `useSession()`; map `session.user.image` → `avatar`.

---

## 2b. Route Restructure and Nav Config

### Routes (restructure)

**File:** `packages/hub/src/routes.ts` (or a copy in `src/lib/routes.ts` if the app should own route constants).

- **Keep:** `/dashboard`, `/chat`, `/voice`, `/mcp`, `/connections`, `/profile`, `/settings`, `/import`, `/tasks`, `/objects/:slug`, `/objects/:slug/:id`.
- **Automations:** Keep `/automations` (list), `/automations/create`, `/automations/:id` (builder). **Add** `/automations/runs` and `/automations/logs` for the sidebar (can render placeholder or reuse list for now).
- **Suggested ROUTES shape** (add new keys, keep old for redirects):

```ts
// packages/hub/src/routes.ts (or src/lib/routes.ts)
export const ROUTES = {
  // Apps
  CRM: "/dashboard",
  CHAT: "/chat",
  VOICE: "/voice",
  MCP: "/mcp",
  CONNECTIONS: "/connections",
  // Automations (base + sub-routes)
  AUTOMATIONS: "/automations",
  AUTOMATIONS_RUNS: "/automations/runs",
  AUTOMATIONS_LOGS: "/automations/logs",
  // User
  PROFILE: "/profile",
  SETTINGS: "/settings",
  IMPORT: "/import",
  TASKS: "/tasks",
  // Records (object list/detail are dynamic)
  OBJECTS: "/objects",
  OBJECTS_SLUG: "/objects/:slug",
  OBJECTS_SLUG_DETAIL: "/objects/:slug/:id",
  // Legacy redirects (keep until no longer needed)
  CRM_COMPANIES: "/companies",
  CRM_CONTACTS: "/contacts",
  CRM_DEALS: "/deals",
  // ...
} as const;
```

- In **App.tsx**, add `<Route path={ROUTES.AUTOMATIONS_RUNS} element={...} />` and `ROUTES.AUTOMATIONS_LOGS` (e.g. placeholder or AutomationsApp sub-routes if that package owns them).

### Nav config (abstract, data-driven)

**Suggested file:** `src/config/sidebar-nav.ts` (or `src/lib/sidebar-nav.ts`).

Define a single source of truth for **static** nav groups (Apps, Automations). Records stay dynamic via `ObjectRegistryNavSection`.

```ts
// Example shape — adapt to your NavMain/NavGroup component API
import type { ComponentType } from "react";
import { ROUTES } from "@basics-os/hub"; // or from src/lib/routes

export type NavItem = { title: string; path: string; icon?: ComponentType<{ className?: string }> };
export type NavGroupConfig = { label: string; items: NavItem[] };

export const SIDEBAR_NAV_APPS: NavGroupConfig = {
  label: "Apps",
  items: [
    { title: "CRM", path: ROUTES.CRM },
    { title: "AI Chat", path: ROUTES.CHAT },
    { title: "Voice", path: ROUTES.VOICE },
    { title: "MCP", path: ROUTES.MCP },
    { title: "Connections", path: ROUTES.CONNECTIONS },
  ],
};

export const SIDEBAR_NAV_AUTOMATIONS: NavGroupConfig = {
  label: "Automations",
  items: [
    { title: "All", path: ROUTES.AUTOMATIONS },
    { title: "Builder", path: `${ROUTES.AUTOMATIONS}/create` },
    { title: "Runs", path: ROUTES.AUTOMATIONS_RUNS },
    { title: "Logs", path: ROUTES.AUTOMATIONS_LOGS },
  ],
};
```

Use these in the component that renders **multiple** collapsible groups (see Step 2 below). Icons can be added to each item and imported from `lucide-react` or `@hugeicons/core-free-icons`.

---

## 3. Implementation Steps

### Step 1: Restructure routes

- **File:** `packages/hub/src/routes.ts`. Add `AUTOMATIONS_RUNS`, `AUTOMATIONS_LOGS`; keep all existing keys for redirects and compatibility.
- **App.tsx:** Add `<Route path={ROUTES.AUTOMATIONS_RUNS} element={...} />` and same for `AUTOMATIONS_LOGS`. Use a placeholder page (e.g. “Runs” / “Logs” title) or wire into `AutomationsApp` if that package uses nested routes (e.g. `path: "runs"` under `/automations/*`).
- **Automations package:** If automations owns sub-routes, add `runs` and `logs` in `packages/automations/src/AutomationsApp.tsx` and point ROUTES to `/automations/runs` and `/automations/logs`.

### Step 2: WorkspaceSwitcher

- Create `src/components/workspace-switcher.tsx` (copy from `team-switcher.tsx`). Rename component and UI labels to “Workspace”/“Workspaces”. Props: `workspaces: { name, logo, plan }[]`. For now pass one item: `[{ name: "Basics Hub", logo: Icon, plan: "Desktop" }]`. Use lucide or existing icon.

### Step 3: Nav config + multi-group collapsible nav

- **Add** `src/config/sidebar-nav.ts` (or `src/lib/sidebar-nav.ts`) with `SIDEBAR_NAV_APPS` and `SIDEBAR_NAV_AUTOMATIONS` as in §2b. Add `icon` to each item (lucide or hugeicons).
- **Generalize nav for multiple groups:** Either:
  - **A)** Use `nav-main.tsx` once per group (e.g. render `<NavMain label="Apps" items={...} />` and `<NavMain label="Automations" items={...} />`). To do that, change `NavMain` to accept an optional `label` prop and use it instead of hardcoded “Platform”; or
  - **B)** Create `NavCollapsibleGroup` (or `SidebarNavGroups`) that takes `groups: NavGroupConfig[]` and for each renders a `SidebarGroup` + `SidebarGroupLabel` + collapsible list of links. Use React Router `Link` and `useLocation()` for `isActive`.
- **Replace** any `<a href>` in nav with `<Link to={...}>` and set active state from `useLocation().pathname` or `useMatch()`.

### Step 4: Search as header button

- In the component that renders `SidebarHeader`, add a button (e.g. “Search” or magnifier icon) that runs: `document.dispatchEvent(new KeyboardEvent("keydown", { key: "k", ctrlKey: true, metaKey: true, bubbles: true }))` so the existing command palette (⌘K) opens. Place it next to or below WorkspaceSwitcher. See `packages/hub/src/HubSidebar.tsx` for the current ⌘K dispatch.

### Step 5: Records section

- Do **not** use `nav-projects.tsx`. In AppSidebar’s `SidebarContent`, after the Apps (and Automations) nav groups, render `<ObjectRegistryNavSection />`. No changes to ObjectRegistryNavSection needed.

### Step 6: NavUser with session + keep demo items

- In the parent of `NavUser`, call `useSession()` from `src/lib/auth.tsx`. Map `session?.user` to `{ name, email, avatar: session.user.image ?? "" }`. Pass to `<NavUser user={...} />`. Handle loading (don’t render or show skeleton).
- **Keep** NavUser’s demo dropdown items (Upgrade to Pro, Account, Billing, Notifications). **Add** Profile (link to ROUTES.PROFILE), Settings, Import, and **Sign out** (call `authClient.signOut()` then `navigate("/")`). You may need to edit `src/components/nav-user.tsx` to accept optional extra items or a `onSignOut` prop and links for Profile/Settings/Import.

### Step 7: AppSidebar (single component, block layout)

- **File:** `src/components/app-sidebar.tsx`. Overwrite with:
  - `Sidebar` (collapsible="icon")
  - `SidebarHeader`: WorkspaceSwitcher + Search button
  - `SidebarContent`: Apps group (from config), ObjectRegistryNavSection, Automations group (from config)
  - `SidebarFooter`: NavUser (user from session)
  - `SidebarRail`
- Data: workspaces (one item), nav from `sidebar-nav.ts`, user from useSession(). Optional: reuse `border-r border-[var(--twenty-border-light)]` etc. from HubSidebar.

### Step 8: AppLayout in src (follow the block)

- **Create** `src/layouts/AppLayout.tsx` (or `src/components/app-layout.tsx`). Structure (per [shadcn pattern](https://ui.shadcn.com/docs/components/radix/sidebar)):
  ```tsx
  <SidebarProvider>
    <AppSidebar />
    <SidebarInset>
      <div className="flex flex-1 flex-col min-h-0">
        <div id="main-content" className="... max-w-screen-xl mx-auto flex-1 ...">
          <ErrorBoundary ...>
            <Outlet />
          </ErrorBoundary>
        </div>
      </div>
    </SidebarInset>
  </SidebarProvider>
  ```
  Do **not** wrap `SidebarInset` in another `<main>` (SidebarInset renders as `<main>`). Copy error boundary and #main-content styling from `packages/hub/src/HubLayout.tsx`.

### Step 9: Switch App.tsx to AppLayout

- In `src/App.tsx`, replace `HubLayout extraNavContent={...}` with `AppLayout` for the protected route. Keep `ROUTES` from `@basics-os/hub`. Ensure CommandPalette remains rendered (e.g. next to AppLayout inside the same route element).

### Step 10: Cleanup and test

- Remove or deprecate `HubLayout`/`HubSidebar` usage from this app. Ensure TooltipProvider is at root (already in App.tsx). Test: sidebar collapse/expand, all nav links (Apps, Records, Automations), Search button (⌘K), user menu (Profile, Settings, Import, Sign out, demo items), and redirects (e.g. /companies → /objects/companies).

---

## 4. File / Context Quick Reference

| Need | Location |
|------|----------|
| Route constants | `packages/hub/src/routes.ts` (`ROUTES`) — add AUTOMATIONS_RUNS, AUTOMATIONS_LOGS |
| Auth (session, sign out) | `src/lib/auth.tsx` (`useSession`, `authClient`) |
| Current main nav + footer | `packages/hub/src/HubSidebar.tsx` (Search ⌘K dispatch, handleLogout) |
| Records (dynamic) | `src/components/ObjectRegistryNavSection.tsx`, `src/hooks/use-object-registry.ts` |
| Object icons | `src/lib/object-icon-map.ts` (`getObjectIcon`) |
| Block sidebar | `src/components/app-sidebar.tsx` (to overwrite with our layout) |
| WorkspaceSwitcher | Create from `src/components/team-switcher.tsx` → `workspace-switcher.tsx` |
| Nav config | Create `src/config/sidebar-nav.ts` (Apps + Automations groups) |
| NavMain / multi-group | `src/components/nav-main.tsx` (generalize label or add NavCollapsibleGroups) |
| NavUser | `src/components/nav-user.tsx` (keep demo items; add Profile/Settings/Import/Sign out) |
| App layout | Create `src/layouts/AppLayout.tsx` — SidebarProvider, AppSidebar, SidebarInset, Outlet |
| App entry | `src/App.tsx` (switch to AppLayout, keep ROUTES from hub) |
| Command palette (⌘K) | `src/components/command-palette.tsx` or wherever global ⌘K is listened |
| Automations sub-routes | `packages/automations/src/AutomationsApp.tsx` (add runs/logs if needed) |

---

## 5. Decisions (Answered)

1. **Workspaces:** One workspace for now (“Basics Hub”); structure for multiple later.
2. **Nav:** Collapsible groups — **Apps** (CRM, AI Chat, Voice, MCP, Connections), **Records** (ObjectRegistryNavSection), **Automations** (All, Builder, Runs, Logs).
3. **Search:** Header button (not in nav list); triggers ⌘K.
4. **NavUser:** Keep demo items (Billing, Notifications, etc.); add Profile, Settings, Import, Sign out.
5. **Structure:** Follow the block; app owns shell — **Option B**: AppLayout in `src/`, replace HubLayout in App.tsx.

---

## 6. Summary

- **Layout:** Block pattern — SidebarProvider → Sidebar (Header + Content + Footer + Rail) → SidebarInset. AppLayout in `src/` owns the shell.
- **Header:** WorkspaceSwitcher (one workspace) + Search button (⌘K).
- **Content:** Apps group (collapsible) → Records (ObjectRegistryNavSection) → Automations group (collapsible). Data-driven from `sidebar-nav.ts`; Records stay dynamic.
- **Footer:** NavUser (session user; keep demo items + Profile/Settings/Import/Sign out).
- **Routes:** Add `/automations/runs` and `/automations/logs`; rest in §2b.
- **Desktop-only:** No mobile; sidebar already desktop-only.

Implement in order: **1** Routes → **2** WorkspaceSwitcher → **3** Nav config + multi-group nav (with Link) → **4** Search button → **5** Records placement → **6** NavUser session + items → **7** AppSidebar → **8** AppLayout → **9** App.tsx → **10** Cleanup & test.
