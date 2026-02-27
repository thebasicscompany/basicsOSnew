/**
 * CRM tool interface for AI assistant.
 * Tools call the same getList/create/update from crm.ts that the UI uses.
 */

export interface JsonSchemaProperty {
  type: string;
  description?: string;
  enum?: string[];
  items?: JsonSchemaProperty;
}

export interface JsonSchema {
  type: "object";
  properties: Record<string, JsonSchemaProperty>;
  required?: string[];
  additionalProperties?: boolean;
}

export interface CrmTool<TParams = unknown, TResult = unknown> {
  name: string;
  description: string;
  parameters: JsonSchema;
  execute: (params: TParams) => Promise<TResult>;
}
