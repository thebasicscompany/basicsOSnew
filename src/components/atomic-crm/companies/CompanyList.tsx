import { useGetIdentity, useListContext, useRecordContext } from "ra-core";
import {
  TableToolbarCreateButton,
  TableToolbarExportButton,
} from "../table";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { TextField } from "@/components/admin/text-field";
import { DateField } from "@/components/admin/date-field";
import { NumberField } from "@/components/admin/number-field";

import { TablecnListTable } from "../table/TablecnListTable";
import { CompanyEmpty } from "./CompanyEmpty";
import { CompanyListFilter } from "./CompanyListFilter";
import { CompanyAvatar } from "./CompanyAvatar";
import { useConfigurationContext } from "../root/ConfigurationContext";
import { sizes } from "./sizes";
import type { Company } from "../types";
import type { ColumnDef } from "@tanstack/react-table";

export const CompanyList = () => {
  const { identity } = useGetIdentity();
  if (!identity) return null;
  return (
    <List
      title={false}
      perPage={25}
      sort={{ field: "name", order: "ASC" }}
      actions={false}
      pagination={<ListPagination rowsPerPageOptions={[10, 25, 50, 100]} />}
      filters={[<CompanyListFilter key="company" />]}
    >
      <CompanyListLayout />
    </List>
  );
};

const CompanyNameCell = () => (
  <div className="flex items-center gap-2">
    <CompanyAvatar width={20} height={20} />
    <TextField source="name" className="font-medium" />
  </div>
);

const SectorCell = () => {
  const { companySectors } = useConfigurationContext();
  const company = useRecordContext<Company>();
  if (!company) return null;
  const label = companySectors.find((s) => s.value === company.sector)?.label;
  return (
    <span className="text-muted-foreground">{label ?? company.sector}</span>
  );
};

const SizeCell = () => {
  const company = useRecordContext<Company>();
  if (!company) return null;
  const label = sizes.find((s) => s.id === company.size)?.name;
  return (
    <span className="text-muted-foreground">{label ?? company.size}</span>
  );
};

const companyColumns: ColumnDef<Company, unknown>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Company",
    cell: () => <CompanyNameCell />,
    size: 200,
    enableResizing: true,
  },
  {
    id: "sector",
    accessorKey: "sector",
    header: "Sector",
    cell: () => <SectorCell />,
    size: 120,
    enableResizing: true,
  },
  {
    id: "size",
    accessorKey: "size",
    header: "Size",
    cell: () => <SizeCell />,
    size: 100,
    enableResizing: true,
  },
  {
    id: "nb_contacts",
    accessorKey: "nb_contacts",
    header: () => <div className="text-right">Contacts</div>,
    cell: () => (
      <div className="text-right">
        <NumberField source="nb_contacts" />
      </div>
    ),
    size: 100,
    enableResizing: true,
  },
  {
    id: "nb_deals",
    accessorKey: "nb_deals",
    header: () => <div className="text-right">Deals</div>,
    cell: () => (
      <div className="text-right">
        <NumberField source="nb_deals" />
      </div>
    ),
    size: 80,
    enableResizing: true,
  },
  {
    id: "created_at",
    accessorKey: "created_at",
    header: "Created",
    cell: () => <DateField source="created_at" />,
    size: 120,
    enableResizing: true,
  },
];

const CompanyListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters) return <CompanyEmpty />;

  return (
    <TablecnListTable
      columns={companyColumns}
      sortFields={["name", "created_at", "nb_contacts"]}
      toolbarActions={
        <>
          <TableToolbarExportButton />
          <TableToolbarCreateButton label="New Company" />
        </>
      }
    />
  );
};

