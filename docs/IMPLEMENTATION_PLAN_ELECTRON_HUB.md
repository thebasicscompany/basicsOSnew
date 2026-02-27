# Implementation Plan: Electron Hub + Multi-App Suite

**Goal:** Convert atomic-crm into an Electron-based "Basics Hub" where CRM is one of several apps. Add sidebar entries for Automations, Voice Native (Wispr), and Custom MCP. Architecture should support a monorepo with separate app modules that funnel into a single shell.

---

## 1. Target Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         Basics Hub (Electron)                            │
├─────────────────────────────────────────────────────────────────────────┤
│  Sidebar                    │  Main Content Area                        │
│  ───────                    │  ─────────────────                        │
│  • CRM                      │                                            │
│  • Automations              │  [Active app renders here]                  │
│  • Launch Voice Native      │  - CRM: Dashboard, Contacts, Deals, etc.  │
│  • View Custom MCP          │  - Automations: Rules, triggers, actions   │
│  • Settings / Profile       │  - Voice: Wispr flow (stub)                │
│                             │  - MCP: Custom MCP viewer (stub)           │
└─────────────────────────────────────────────────────────────────────────┘
```

---

## 2. Monorepo Structure (Proposed)

```
atomic-crm/
├── apps/
│   └── electron/                 # Electron main process + preload
│       ├── src/
│       │   ├── main.ts           # Electron main
│       │   ├── preload.ts        # Context bridge
│       │   └── server.ts         # Optional: spawn/bundle server
│       ├── package.json
│       └── electron-builder.json
│
├── apps/
│   └── web/                      # Optional: keep web build for PWA/demo
│       └── (current root src, refactored to consume packages)
│
├── packages/
│   ├── hub/                      # Hub shell: layout, sidebar, routing, auth
│   │   ├── src/
│   │   │   ├── HubShell.tsx      # Root shell with sidebar + outlet
│   │   │   ├── HubSidebar.tsx    # Sidebar with all app nav items
│   │   │   ├── HubLayout.tsx     # Layout wrapper
│   │   │   └── routes.ts         # Route definitions
│   │   └── package.json
│   │
│   ├── crm/                      # CRM app module (extracted from current)
│   │   ├── src/
│   │   │   ├── CRMApp.tsx        # CRM as a sub-app (wraps Admin/Resources)
│   │   │   ├── CRM routes, components (contacts, deals, etc.)
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── automations/              # Automations app module
│   │   ├── src/
│   │   │   ├── AutomationsApp.tsx  # Main automations view (stub → full later)
│   │   │   ├── AutomationRulesList.tsx  # Move from settings
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── voice/                    # Voice Native (Wispr) app module
│   │   ├── src/
│   │   │   ├── VoiceApp.tsx      # Stub: "Launch Voice Native" screen
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── mcp-viewer/               # Custom MCP viewer app module
│   │   ├── src/
│   │   │   ├── MCPViewerApp.tsx  # Stub: "View Custom MCP" screen
│   │   │   └── index.ts
│   │   └── package.json
│   │
│   ├── server/                   # Existing backend (unchanged structure)
│   │   └── ...
│   │
│   ├── api/                      # AI assistant API (unchanged)
│   │   └── ...
│   │
│   └── shared/                   # Shared types, utils, UI primitives
│       ├── src/
│       │   ├── types.ts
│       │   ├── constants.ts
│       │   └── index.ts
│       └── package.json
│
├── src/                          # App entry (web or electron renderer)
│   ├── main.tsx                  # Renders HubShell + routes
│   ├── App.tsx                   # Chooses Hub vs legacy for migration
│   └── index.css
│
├── package.json                  # Root workspace
├── pnpm-workspace.yaml           # Add apps/*, packages/*
└── vite.config.ts                # Build for web
```

---

## 3. Phased Implementation

### Phase 1: Monorepo Restructure + Hub Shell (No Electron Yet)

**Goal:** Introduce hub shell and sidebar without breaking existing web app.

| Step | Task | Details |
|------|------|---------|
| 1.1 | Update `pnpm-workspace.yaml` | Add `apps/*` if introducing apps folder |
| 1.2 | Create `packages/hub` | HubShell, HubSidebar, HubLayout. Sidebar items: CRM, Automations, Voice, MCP, Settings |
| 1.3 | Create `packages/crm` | Extract CRM component tree into package. CRM becomes a route at `/crm/*` |
| 1.4 | Create `packages/automations` | Stub AutomationsApp. Move AutomationRulesSection logic here; route at `/automations` |
| 1.5 | Create `packages/voice` | Stub VoiceApp with "Launch Voice Native" placeholder; route at `/voice` |
| 1.6 | Create `packages/mcp-viewer` | Stub MCPViewerApp with "View Custom MCP" placeholder; route at `/mcp` |
| 1.7 | Wire HubShell in App | Replace direct `<CRM />` with `<HubShell><Routes>...</Routes></HubShell>`. Default route `/` redirects to `/crm` |
| 1.8 | Update Layout | Layout uses HubSidebar instead of CRMSidebar. CRM’s internal sidebar (Dashboard, Contacts, etc.) stays inside CRMApp |

**Deliverable:** Web app works as before, but with new sidebar: CRM, Automations, Voice, MCP. CRM is one tab. Others are stubs.

---

### Phase 2: Electron Shell

**Goal:** Wrap the app in Electron. No server bundling yet.

| Step | Task | Details |
|------|------|---------|
| 2.1 | Create `apps/electron` | `electron`, `electron-builder` (or `electron-vite`) |
| 2.2 | Main process | Create BrowserWindow, load built Vite output via `file://` or `loadFile` |
| 2.3 | Preload | Minimal contextBridge if needed (e.g. `window.electron` for future IPC) |
| 2.4 | Vite config | Ensure build output works for Electron (e.g. `base: './'`, correct asset paths) |
| 2.5 | Build script | `pnpm build` → build web app, then `electron-builder` to produce installers |
| 2.6 | Dev workflow | `pnpm dev` runs Vite; `pnpm dev:electron` runs Electron in dev (loads `localhost:5173`) |

**Deliverable:** Electron app launches and shows the hub. User still runs server separately (`pnpm dev:server`).

---

### Phase 3: Server Integration (Optional / Later)

| Step | Task | Details |
|------|------|---------|
| 3.1 | Bundle server in Electron | Spawn server as child process from main, or embed SQLite + Hono for offline |
| 3.2 | Auto-start server | On app launch, start server if not running |
| 3.3 | Config | Store `DATABASE_URL`, etc. in user data dir |

**Note:** Phase 3 can be deferred. Many Electron CRMs run with a separate server.

---

### Phase 4: Stub → Real Implementations

| App | Stub → Full |
|-----|-------------|
| **Automations** | Already has AutomationRulesSection. Move to dedicated `/automations` page. Add triggers, actions, logs. |
| **Voice** | Integrate Wispr SDK. Microphone access, voice → CRM actions. |
| **MCP Viewer** | Connect to MCP server(s). List tools, show responses. |

---

## 4. Routing Structure

```
/                     → Redirect to /crm
/crm                  → CRM dashboard (default CRM view)
/crm/contacts         → Contact list
/crm/companies        → Companies
/crm/deals            → Deals
/crm/settings         → CRM-specific settings (or move to hub-level)
/automations          → Automations app (rules, triggers)
/voice                → Voice Native (Wispr)
/mcp                  → Custom MCP viewer
/profile              → User profile (hub-level)
/settings             → Hub-level settings
```

---

## 5. Hub Sidebar Design

```tsx
// packages/hub/src/HubSidebar.tsx (conceptual)

const HUB_NAV_ITEMS = [
  { path: "/crm",        label: "CRM",              icon: Home01Icon },
  { path: "/automations", label: "Automations",     icon: AutomationIcon },
  { path: "/voice",      label: "Launch Voice Native", icon: MicrophoneIcon },
  { path: "/mcp",       label: "View Custom MCP",  icon: PlugIcon },
];

// Footer: Profile, Settings, Import
```

---

## 6. Key Files to Create/Modify

| File | Action |
|------|--------|
| `pnpm-workspace.yaml` | Add `apps/*` |
| `packages/hub/package.json` | New package |
| `packages/hub/src/HubShell.tsx` | New: root shell with Router, auth, layout |
| `packages/hub/src/HubSidebar.tsx` | New: sidebar with CRM, Automations, Voice, MCP |
| `packages/hub/src/HubLayout.tsx` | New: layout using HubSidebar |
| `packages/crm/package.json` | New: extract CRM |
| `packages/crm/src/CRMApp.tsx` | New: wraps current CRM, mounts at /crm |
| `packages/automations/...` | New: stub + move AutomationRulesSection |
| `packages/voice/...` | New: stub |
| `packages/mcp-viewer/...` | New: stub |
| `src/App.tsx` | Use HubShell, render Routes |
| `src/main.tsx` | Unchanged (or add electron check) |
| `apps/electron/...` | New: main, preload, builder config |
| `vite.config.ts` | Ensure Electron-compatible build |
| `package.json` | Add electron scripts, electron-builder |

---

## 7. Migration Strategy for CRM

**Option A: In-place refactor**
- Keep CRM code in `src/components/atomic-crm/` initially
- Create `packages/crm` that re-exports from `../src` (or use path alias)
- Gradually move files into `packages/crm`

**Option B: Big-bang extract**
- Move `src/components/atomic-crm/*` → `packages/crm/src/`
- Update all imports
- Fix any circular deps

**Recommendation:** Option A for Phase 1. Create `packages/crm` as a thin wrapper that imports from current locations. Move files in Phase 4 or when touching them.

---

## 8. Electron-Specific Considerations

| Topic | Approach |
|-------|----------|
| **API base URL** | In Electron: `http://localhost:3001` or configurable. Use `import.meta.env.VITE_API_URL` with fallback. |
| **Auth redirects** | `BETTER_AUTH_URL` must match. For Electron: `file://` or custom protocol `basics://` |
| **Protocol handler** | Consider `basics://auth/callback` for OAuth in Electron |
| **Auto-updates** | Add `electron-updater` when ready for releases |

---

## 9. Open Questions

1. **Default landing:** Should `/` go to CRM dashboard or a hub "home" that shows widgets from all apps?
2. **CRM settings vs hub settings:** Keep automations in Settings, or split? (Proposal: Automations = dedicated app; Settings = profile, theme, import)
3. **Mobile layout:** Current MobileLayout/MobileDashboard—should hub have a mobile view, or is Electron desktop-only for now?
4. **Shared auth:** Hub handles auth once; all apps (CRM, Automations, etc.) use same session. Confirm?
5. **Wispr integration:** Is Wispr a specific SDK/API? Need docs or repo link for integration details.
6. **Custom MCP:** Is "View Custom MCP" meant to (a) configure MCP server URLs, (b) show MCP tools/responses in-app, or (c) both?
7. **Nx vs pnpm workspaces:** Use Nx for task orchestration and caching, or stick with pnpm workspaces + scripts?

---

## 10. Estimated Effort (Rough)

| Phase | Effort | Notes |
|-------|--------|-------|
| Phase 1: Hub + monorepo | 2–3 days | Most impactful; enables everything else |
| Phase 2: Electron shell | 1–2 days | Straightforward with electron-vite or electron-builder |
| Phase 3: Server bundling | 2–4 days | Optional; can defer |
| Phase 4: Stub → real | Variable | Per app |

---

## 11. Success Criteria

- [ ] Web app runs with new hub sidebar (CRM, Automations, Voice, MCP)
- [ ] CRM works as before under `/crm`
- [ ] Automations, Voice, MCP show stub screens
- [ ] Electron app launches and displays hub
- [ ] Single `pnpm install` at root works
- [ ] Clear path to fill stubs and add server bundling
