export { listRecords, isListableResource, type ListParams, type ListResult } from "./list.js";
export { getOneRecord, type GetOneParams } from "./get-one.js";
export { insertRecord, type CreateParams } from "./create.js";
export {
  updateRecord,
  type UpdateParams,
} from "./update.js";
export {
  archiveDeal,
  hardDeleteRecord,
  type DeleteParams,
  type ArchiveResult,
  type HardDeleteResult,
} from "./delete.js";
export { mergeContacts, type MergeContactsParams } from "./merge-contacts.js";
export { restoreDeal, type RestoreParams } from "./restore.js";
export type { GenericFilter } from "./utils.js";
