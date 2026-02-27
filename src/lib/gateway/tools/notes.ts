import { getList, create } from "@/lib/api/crm";
import type { CrmTool } from "./types";

export const list_notes: CrmTool<
  { contact_id: number; limit?: number },
  { data: unknown[]; total: number }
> = {
  name: "list_notes",
  description:
    "List notes for a contact. Use when the user asks about notes, comments, or history for a specific person.",
  parameters: {
    type: "object",
    properties: {
      contact_id: {
        type: "number",
        description: "Contact ID to list notes for",
      },
      limit: {
        type: "number",
        description: "Max number of results (default 25)",
      },
    },
    required: ["contact_id"],
  },
  async execute(params) {
    const result = await getList("contact_notes", {
      filter: { contact_id: params.contact_id },
      pagination: { page: 1, perPage: params.limit ?? 25 },
    });
    return result;
  },
};

export const create_note: CrmTool<
  { contact_id: number; text: string; type?: string },
  unknown
> = {
  name: "create_note",
  description:
    "Add a note to a contact. Use when the user wants to record a note, comment, or update about someone.",
  parameters: {
    type: "object",
    properties: {
      contact_id: {
        type: "number",
        description: "Contact ID to add the note to",
      },
      text: {
        type: "string",
        description: "Note content",
      },
      type: {
        type: "string",
        description: "Note type (e.g. call, meeting, email)",
      },
    },
    required: ["contact_id", "text"],
  },
  async execute(params) {
    const data = await create("contact_notes", {
      contact_id: params.contact_id,
      text: params.text,
      type: params.type,
    });
    return data;
  },
};
