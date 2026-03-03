export interface ViewConfig {
  id: string;
  title: string;
  type: "grid" | "kanban" | "gallery" | "form";
  order: number;
  isDefault: boolean;
  lockType?: "collaborative" | "locked" | "personal";
}

export interface ViewColumn {
  id: string;
  fieldId: string;
  title: string;
  show: boolean;
  order: number;
  width?: string;
}

export interface ViewSort {
  id: string;
  fieldId: string;
  direction: "asc" | "desc";
  order: number;
}

export interface ViewFilter {
  id: string;
  fieldId: string;
  operator: string;
  value: unknown;
  logicalOp: "and" | "or";
}

export interface ViewState {
  columns: ViewColumn[];
  sorts: ViewSort[];
  filters: ViewFilter[];
  isDirty: boolean;
}
