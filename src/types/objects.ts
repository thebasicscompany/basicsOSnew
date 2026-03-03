export interface Attribute {
  id: string;
  name: string;
  columnName: string;
  uiType: string; // key into fieldTypeRegistry
  nocoUidt: string; // original NocoDB uidt
  config: Record<string, unknown>;
  isPrimary: boolean;
  isSystem: boolean;
  isHiddenByDefault: boolean;
  icon?: string;
  order: number;
}

export interface ObjectConfig {
  id: number;
  slug: string;
  singularName: string;
  pluralName: string;
  icon: string;
  iconColor: string;
  nocoTableName: string;
  type: "standard" | "system";
  isActive: boolean;
  position: number;
  settings: Record<string, unknown>;
  attributes: Attribute[];
}

export interface AttributeOverride {
  id: number;
  objectConfigId: number;
  columnName: string;
  displayName?: string;
  uiType?: string;
  icon?: string;
  isPrimary: boolean;
  isHiddenByDefault: boolean;
  config: Record<string, unknown>;
}

/**
 * Raw shape returned by the backend API (GET /api/object-config).
 * The `attributes` array here contains AttributeOverrides, not merged Attributes.
 */
export interface ObjectConfigApiResponse {
  id: number;
  slug: string;
  singularName: string;
  pluralName: string;
  icon: string;
  iconColor: string;
  nocoTableName: string;
  type: "standard" | "system";
  isActive: boolean;
  position: number;
  settings: Record<string, unknown>;
  attributes: AttributeOverride[];
}
