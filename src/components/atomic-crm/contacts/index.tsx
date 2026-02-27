import type { Contact } from "../types";
import { ContactCreate } from "./ContactCreate";
import { ContactEdit } from "./ContactEdit";
import { ContactShow } from "./ContactShow";

export default {
  show: ContactShow,
  edit: ContactEdit,
  create: ContactCreate,
  recordRepresentation: (record: Contact) =>
    record?.first_name + " " + record?.last_name,
};
