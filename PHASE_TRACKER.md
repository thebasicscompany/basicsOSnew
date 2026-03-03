# CRM Redesign: Object-Attribute-Record System — Phase Tracker

## Source of Truth for Parallel Worktree Execution

### Phase Status

| Phase | Branch | Status | Files Created | Files Modified | Merge Conflicts Risk |
|-------|--------|--------|--------------|----------------|---------------------|
| P1: Field Type Registry | agent-aec55303 | IN PROGRESS (34 files) | src/field-types/** (~60 files) | none | NONE |
| P2: Universal Cell + Form | agent-a290cf5c | IN PROGRESS (5 files) | src/components/cells/**, src/components/create-record/**, src/components/create-attribute/** | none | NONE |
| P3: Database + API | agent-abbe062c | COMPLETED | packages/server/drizzle/0005*, packages/server/src/db/schema/object-config.ts, packages/server/src/routes/object-config.ts | packages/server/src/app.ts, schema/index.ts | LOW |
| P4: Object Registry + Hooks | agent-a08d409a | IN PROGRESS (6 files) | src/types/**, src/providers/ObjectRegistryProvider.tsx, src/hooks/use-noco-views.ts, use-records.ts, use-views.ts, use-object-registry.ts, use-favorites.ts | none | NONE |
| P5: DataTable + View System | agent-a9b1ee17 | IN PROGRESS | src/components/data-table/** | none | NONE |
| P6: Generic Pages + Routing | agent-a5c7d052 | IN PROGRESS | src/components/pages/ObjectListPage.tsx, RecordDetailPage.tsx | src/App.tsx | MEDIUM |
| P7: Generic Kanban | agent-af9e62e0 | IN PROGRESS | src/components/kanban/** | none | NONE |
| P8: Object Settings | agent-a8e210e2 | IN PROGRESS | src/components/object-settings/** | none | NONE |
| P9: Navigation + Cmd Palette | agent-a6f34978 | IN PROGRESS | none | src/components/command-palette.tsx, HubSidebar.tsx | MEDIUM |
| P10: Cleanup + Verify | — | BLOCKED (all phases) | none | many deletions | HIGH |

### Shared Interface Contract (FieldTypeDefinition)

All phases MUST use this exact interface for consistency:

```typescript
// src/field-types/types.ts — canonical interface
interface FieldTypeDefinition {
  key: string;
  label: string;
  icon: ComponentType;
  group: 'standard' | 'relational' | 'ai-autofill';
  hasTypeConfig: boolean;
  TypeConfigComponent: ComponentType<TypeConfigProps> | null;
  defaultTypeConfig: Record<string, any>;
  CellDisplay: ComponentType<CellDisplayProps>;
  KanbanDisplay: ComponentType<KanbanDisplayProps>;
  DetailDisplay: ComponentType<DetailDisplayProps>;
  CellEditor: ComponentType<CellEditorProps>;
  KanbanEditor: ComponentType<KanbanEditorProps>;
  FormInput: ComponentType<FormInputProps>;
  DetailEditor: ComponentType<DetailEditorProps>;
  editorStyle: 'inline' | 'popover' | 'expanding' | 'toggle';
  validate: (value: any, config: Record<string, any>) => ValidationResult;
  parseValue: (raw: any) => any;
  serializeValue: (value: any) => any;
  getEmptyValue: () => any;
  isEmpty: (value: any) => boolean;
  formatDisplayValue: (value: any, config: Record<string, any>) => string;
  comparator: (a: any, b: any, config?: Record<string, any>) => number;
  FilterComponent: ComponentType<FilterProps> | null;
  filterOperators: FilterOperator[];
  availableCalculations: CalculationType[];
  calculate: (values: any[], calcType: CalculationType) => any;
  placeholder: string;
  searchPlaceholder?: string;
}
```

### Attribute Type (used by Phase 4, 5, 6, 7, 8)

```typescript
interface Attribute {
  id: string;
  name: string;
  columnName: string;
  uiType: string;          // key into fieldTypeRegistry
  nocoUidt: string;        // original NocoDB uidt
  config: Record<string, any>;
  isPrimary: boolean;
  isSystem: boolean;
  isHiddenByDefault: boolean;
  icon?: string;
  order: number;
}
```

### ObjectConfig Type (used by Phase 4, 6, 8, 9)

```typescript
interface ObjectConfig {
  id: number;
  slug: string;
  singularName: string;
  pluralName: string;
  icon: string;
  iconColor: string;
  nocoTableName: string;
  type: 'standard' | 'system';
  isActive: boolean;
  position: number;
  settings: Record<string, any>;
  attributes: Attribute[];
}
```

### Import Paths Convention

- Field types: `@/field-types` or `@/field-types/registry`
- Cell components: `@/components/cells`
- Types: `@/types/objects` and `@/types/views`
- Hooks: `@/hooks/use-records`, `@/hooks/use-noco-views`, etc.
- Object registry: `@/hooks/use-object-registry`

### Merge Order

1. P1 (field-types) — foundation, no conflicts
2. P3 (database) — independent backend, touches app.ts
3. P4 (hooks + types) — imports from P1
4. P2 (cells) — imports from P1
5. P5 (datatable) — imports from P1, P2, P4
6. P7 (kanban) — imports from P1, P2, P4
7. P6 (pages) — imports from P4, P5, P7, touches App.tsx
8. P8 (settings) — imports from P1, P4
9. P9 (nav) — imports from P4, touches sidebar
10. P10 (cleanup) — final pass

### Verification Checklist

- [x] `make typecheck` passes after all merges
- [x] `make lint` — zero errors (pre-existing warnings only)
- [x] `make build` passes after all merges (18.67s, 395 precache entries)
- [x] All 17 field types created with display/editor/form components
- [x] All 17 field types have validation, calculations, filter operators
- [x] Views system: ViewSelector, ViewSaveBar, dirty state tracking
- [x] Kanban board: @dnd-kit DnD, column colors, card display
- [x] Create record modal: dynamic form from attributes, validation
- [x] Create attribute modal: type picker, name input, type config
- [x] Backward compat: existing routes preserved alongside /objects/:slug
- [x] Navigation sidebar: dynamic "Records" section from useObjects()
- [x] Command palette: dynamic "Navigate to" and "Create" commands
- [x] Database: object_config + overrides + favorites tables + API routes
- [x] Worktrees cleaned up after merge
