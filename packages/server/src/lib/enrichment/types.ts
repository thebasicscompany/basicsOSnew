export interface EnrichmentResult {
  entityType: "contact" | "company";
  entityId: number;
  fieldsUpdated: string[];
  data: Record<string, unknown>;
  sources: string[];
}

export interface EnrichSourceParams {
  db: unknown;
  organizationId: string;
  entityType: "contact" | "company";
  entityId: number;
  existingData: Record<string, unknown>;
  gatewayUrl: string;
  gatewayHeaders: Record<string, string>;
  env: Record<string, string>;
}
