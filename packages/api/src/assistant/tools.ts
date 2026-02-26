import type { SupabaseClient } from "@supabase/supabase-js";

export const ASSISTANT_TOOLS = [
  {
    type: "function" as const,
    function: {
      name: "create_task",
      description:
        "Create a new task for a contact. Use when the user wants to add a follow-up task, reminder, or to-do for a contact.",
      parameters: {
        type: "object",
        properties: {
          contact_id: {
            type: "number",
            description: "The ID of the contact to create the task for",
          },
          text: {
            type: "string",
            description: "Description of the task",
          },
          type: {
            type: "string",
            description: "Task type (e.g. call, email, meeting)",
            default: "call",
          },
          due_date: {
            type: "string",
            description:
              "Due date in ISO 8601 format (e.g. 2025-02-28T12:00:00Z)",
          },
        },
        required: ["contact_id", "text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "add_note",
      description:
        "Add a note to a contact or deal. Use when the user wants to record a note, comment, or update about a contact or deal.",
      parameters: {
        type: "object",
        properties: {
          contact_id: {
            type: "number",
            description: "The ID of the contact to add the note to",
          },
          deal_id: {
            type: "number",
            description: "The ID of the deal to add the note to",
          },
          text: {
            type: "string",
            description: "The note content",
          },
        },
        required: ["text"],
      },
    },
  },
  {
    type: "function" as const,
    function: {
      name: "update_deal",
      description:
        "Update a deal's stage or other fields. Use when the user wants to change deal status, stage, or other attributes.",
      parameters: {
        type: "object",
        properties: {
          deal_id: {
            type: "number",
            description: "The ID of the deal to update",
          },
          stage: {
            type: "string",
            description: "The new stage for the deal",
          },
        },
        required: ["deal_id"],
      },
    },
  },
];

export async function executeAssistantTool(
  supabase: SupabaseClient,
  salesId: number,
  toolName: string,
  args: Record<string, unknown>
): Promise<string> {
  try {
    if (toolName === "create_task") {
      const contactId = args.contact_id as number;
      const text = args.text as string;
      const type = (args.type as string) ?? "call";
      const dueDate = (args.due_date as string) ?? new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();

      const { data, error } = await supabase.from("tasks").insert({
        contact_id: contactId,
        sales_id: salesId,
        type,
        text,
        due_date: dueDate,
      }).select("id").single();

      if (error) {
        console.error("[assistant] create_task error:", error);
        return `Error: ${error.message}`;
      }
      return `Task created successfully (id: ${data?.id})`;
    }

    if (toolName === "add_note") {
      const contactId = args.contact_id as number | undefined;
      const dealId = args.deal_id as number | undefined;
      const text = args.text as string;

      if (contactId) {
        const { data, error } = await supabase
          .from("contact_notes")
          .insert({
            contact_id: contactId,
            sales_id: salesId,
            text,
          })
          .select("id")
          .single();

        if (error) {
          console.error("[assistant] add_note (contact) error:", error);
          return `Error: ${error.message}`;
        }
        return `Note added to contact (id: ${data?.id})`;
      }

      if (dealId) {
        const { data, error } = await supabase
          .from("deal_notes")
          .insert({
            deal_id: dealId,
            sales_id: salesId,
            text,
          })
          .select("id")
          .single();

        if (error) {
          console.error("[assistant] add_note (deal) error:", error);
          return `Error: ${error.message}`;
        }
        return `Note added to deal (id: ${data?.id})`;
      }

      return "Error: Must specify contact_id or deal_id";
    }

    if (toolName === "update_deal") {
      const dealId = args.deal_id as number;
      const stage = args.stage as string | undefined;

      const updateData: Record<string, unknown> = {
        updated_at: new Date().toISOString(),
      };
      if (stage) updateData.stage = stage;

      const { error } = await supabase
        .from("deals")
        .update(updateData)
        .eq("id", dealId)
        .eq("sales_id", salesId);

      if (error) {
        console.error("[assistant] update_deal error:", error);
        return `Error: ${error.message}`;
      }
      return `Deal updated successfully`;
    }

    return `Unknown tool: ${toolName}`;
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[assistant] tool execution error:", err);
    return `Error: ${msg}`;
  }
}
