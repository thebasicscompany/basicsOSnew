import jsonExport from "jsonexport/dist";
import {
  downloadCSV,
  InfiniteListBase,
  useGetIdentity,
  useListContext,
  useRecordContext,
  type Exporter,
} from "ra-core";
import { formatRelative } from "date-fns";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";

import type { Company, Contact, Sale, Tag } from "../types";
import type { ColumnDef } from "@tanstack/react-table";
import { ContactEmpty } from "./ContactEmpty";
import {
  TableToolbarContactImportButton,
  TableToolbarCreateButton,
  TableToolbarExportButton,
} from "../table";
import {
  ContactListContentMobile,
} from "./ContactListContent";
import {
  ContactListFilterSummary,
  ContactListFilter,
} from "./ContactListFilter";
import { InfinitePagination } from "../misc/InfinitePagination";
import MobileHeader from "../layout/MobileHeader";
import { MobileContent } from "../layout/MobileContent";
import { CRMListTable } from "../CRMListTable";
import { Avatar } from "./Avatar";
import { Status } from "../misc/Status";

export const ContactList = () => {
  const { identity } = useGetIdentity();

  if (!identity) return null;

  return (
    <List
      title={false}
      actions={false}
      perPage={25}
      sort={{ field: "last_seen", order: "DESC" }}
      exporter={exporter}
      pagination={<ListPagination rowsPerPageOptions={[10, 25, 50, 100]} />}
      filters={[<ContactListFilter key="contact" />]}
    >
      <ContactListLayoutDesktop />
    </List>
  );
};

const ContactNameCell = () => {
  const contact = useRecordContext<Contact>();
  if (!contact) return null;
  const name = `${contact.first_name ?? ""} ${contact.last_name ?? ""}`.trim();
  return (
    <div className="flex items-center gap-2">
      <Avatar width={20} height={20} />
      <span className="font-medium">{name || "—"}</span>
    </div>
  );
};

const CompanyCell = () => (
  <ReferenceField source="company_id" reference="companies" link={false}>
    <TextField source="name" className="text-muted-foreground" />
  </ReferenceField>
);

const PrimaryEmailCell = () => {
  const contact = useRecordContext<Contact>();
  if (!contact?.email_jsonb?.length) return <span className="text-muted-foreground">—</span>;
  const work = contact.email_jsonb.find((e) => e.type === "Work");
  const home = contact.email_jsonb.find((e) => e.type === "Home");
  const other = contact.email_jsonb.find((e) => e.type === "Other");
  const email = work ?? home ?? other;
  return <span className="text-muted-foreground">{email?.email ?? "—"}</span>;
};

const PrimaryPhoneCell = () => {
  const contact = useRecordContext<Contact>();
  if (!contact?.phone_jsonb?.length) return <span className="text-muted-foreground">—</span>;
  const work = contact.phone_jsonb.find((p) => p.type === "Work");
  const home = contact.phone_jsonb.find((p) => p.type === "Home");
  const other = contact.phone_jsonb.find((p) => p.type === "Other");
  const phone = work ?? home ?? other;
  return <span className="text-muted-foreground">{phone?.number ?? "—"}</span>;
};

const StatusCell = () => {
  const contact = useRecordContext<Contact>();
  if (!contact?.status) return null;
  return <Status status={contact.status} />;
};

const LastActivityCell = () => {
  const contact = useRecordContext<Contact>();
  if (!contact?.last_seen) return <span className="text-muted-foreground">—</span>;
  const now = Date.now();
  return (
    <span className="text-muted-foreground">
      {formatRelative(contact.last_seen, now)}
    </span>
  );
};

const TasksCell = () => {
  const contact = useRecordContext<Contact>();
  const n = contact?.nb_tasks ?? 0;
  if (n === 0) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-muted-foreground">
      {n} task{n !== 1 ? "s" : ""}
    </span>
  );
};

const TitleCell = () => {
  const contact = useRecordContext<Contact>();
  return (
    <span className={contact?.title ? "" : "text-muted-foreground"}>
      {contact?.title || "—"}
    </span>
  );
};

const contactColumns: ColumnDef<Contact, unknown>[] = [
  {
    id: "name",
    accessorKey: "first_name",
    header: "Name",
    cell: () => <ContactNameCell />,
    size: 180,
    enableResizing: true,
    meta: { sortKey: "first_name" },
  },
  {
    id: "company_id",
    accessorKey: "company_id",
    header: "Company",
    cell: () => <CompanyCell />,
    size: 150,
    enableResizing: true,
  },
  {
    id: "title",
    accessorKey: "title",
    header: "Title",
    cell: () => <TitleCell />,
    size: 120,
    enableResizing: true,
  },
  {
    id: "email_jsonb",
    accessorKey: "email_jsonb",
    header: "Email",
    cell: () => <PrimaryEmailCell />,
    size: 180,
    enableResizing: true,
  },
  {
    id: "phone_jsonb",
    accessorKey: "phone_jsonb",
    header: "Phone",
    cell: () => <PrimaryPhoneCell />,
    size: 120,
    enableResizing: true,
  },
  {
    id: "status",
    accessorKey: "status",
    header: "Status",
    cell: () => <StatusCell />,
    size: 100,
    enableResizing: true,
  },
  {
    id: "last_seen",
    accessorKey: "last_seen",
    header: "Last activity",
    cell: () => <LastActivityCell />,
    size: 120,
    enableResizing: true,
  },
  {
    id: "nb_tasks",
    accessorKey: "nb_tasks",
    header: "Tasks",
    cell: () => <TasksCell />,
    size: 80,
    enableResizing: true,
  },
];

const ContactListLayoutDesktop = () => {
  const { data, isPending, filterValues } = useListContext();

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;

  if (!data?.length && !hasFilters) return <ContactEmpty />;

  return (
    <CRMListTable
      columns={contactColumns}
      sortFields={["first_name", "last_name", "last_seen"]}
      toolbarActions={
        <>
          <TableToolbarContactImportButton />
          <TableToolbarExportButton exporter={exporter} />
          <TableToolbarCreateButton />
        </>
      }
    />
  );
};

export const ContactListMobile = () => {
  const { identity } = useGetIdentity();
  if (!identity) return null;

  return (
    <InfiniteListBase
      perPage={25}
      sort={{ field: "last_seen", order: "DESC" }}
      exporter={exporter}
      queryOptions={{
        onError: () => {
          /* Disable error notification as ContactListLayoutMobile handles it */
        },
      }}
    >
      <ContactListLayoutMobile />
    </InfiniteListBase>
  );
};

const ContactListLayoutMobile = () => {
  const { isPending, data, error, filterValues } = useListContext();

  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (!isPending && !data?.length && !hasFilters) return <ContactEmpty />;

  return (
    <div>
      <MobileHeader>
        <ContactListFilter />
      </MobileHeader>
      <MobileContent>
        <ContactListFilterSummary />
        <ContactListContentMobile />
        {!error && (
          <div className="flex justify-center">
            <InfinitePagination />
          </div>
        )}
      </MobileContent>
    </div>
  );
};

const exporter: Exporter<Contact> = async (records, fetchRelatedRecords) => {
  const companies = await fetchRelatedRecords<Company>(
    records,
    "company_id",
    "companies",
  );
  const sales = await fetchRelatedRecords<Sale>(records, "sales_id", "sales");
  const tags = await fetchRelatedRecords<Tag>(records, "tags", "tags");

  const contacts = records.map((contact) => {
    const exportedContact = {
      ...contact,
      company:
        contact.company_id != null
          ? companies[contact.company_id].name
          : undefined,
      sales:
        contact.sales_id != null && sales[contact.sales_id]
          ? `${sales[contact.sales_id].first_name} ${sales[contact.sales_id].last_name}`
          : undefined,
      tags: contact.tags
        ?.map((tagId) => tags[tagId]?.name)
        .filter(Boolean)
        .join(", "),
      email_work: contact.email_jsonb?.find((email) => email.type === "Work")
        ?.email,
      email_home: contact.email_jsonb?.find((email) => email.type === "Home")
        ?.email,
      email_other: contact.email_jsonb?.find((email) => email.type === "Other")
        ?.email,
      email_jsonb: JSON.stringify(contact.email_jsonb),
      email_fts: undefined,
      phone_work: contact.phone_jsonb?.find((phone) => phone.type === "Work")
        ?.number,
      phone_home: contact.phone_jsonb?.find((phone) => phone.type === "Home")
        ?.number,
      phone_other: contact.phone_jsonb?.find((phone) => phone.type === "Other")
        ?.number,
      phone_jsonb: JSON.stringify(contact.phone_jsonb),
      phone_fts: undefined,
    };
    delete exportedContact.email_fts;
    delete exportedContact.phone_fts;
    return exportedContact;
  });
  return jsonExport(contacts, {}, (_err: any, csv: string) => {
    downloadCSV(csv, "contacts");
  });
};
