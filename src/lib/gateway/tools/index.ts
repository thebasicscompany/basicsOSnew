import type { CrmTool } from "./types";
import {
  search_contacts,
  get_contact,
  create_contact,
  update_contact,
} from "./contacts";
import {
  search_deals,
  get_deal,
  create_deal,
  update_deal,
} from "./deals";
import { search_companies, create_company } from "./companies";
import { list_tasks, create_task, complete_task } from "./tasks";
import { list_notes, create_note } from "./notes";

export const ALL_CRM_TOOLS: CrmTool[] = [
  search_contacts,
  get_contact,
  create_contact,
  update_contact,
  search_deals,
  get_deal,
  create_deal,
  update_deal,
  search_companies,
  create_company,
  list_tasks,
  create_task,
  complete_task,
  list_notes,
  create_note,
];

export type { CrmTool, JsonSchema, JsonSchemaProperty } from "./types";
export {
  search_contacts,
  get_contact,
  create_contact,
  update_contact,
  search_deals,
  get_deal,
  create_deal,
  update_deal,
  search_companies,
  create_company,
  list_tasks,
  create_task,
  complete_task,
  list_notes,
  create_note,
};
