import { useGetIdentity, useListContext, useRecordContext } from "ra-core";
import { matchPath, useLocation } from "react-router";
import { AutocompleteInput } from "@/components/admin/autocomplete-input";
import { List } from "@/components/admin/list";
import { ListPagination } from "@/components/admin/list-pagination";
import { ReferenceField } from "@/components/admin/reference-field";
import { TextField } from "@/components/admin/text-field";
import { ReferenceInput } from "@/components/admin/reference-input";
import { FilterButton } from "@/components/admin/filter-form";
import { SearchInput } from "@/components/admin/search-input";
import { SelectInput } from "@/components/admin/select-input";

import { useConfigurationContext } from "../root/ConfigurationContext";
import {
  TableToolbarCreateButton,
  TableToolbarExportButton,
} from "../table";
import { TablecnListTable } from "../table/TablecnListTable";
import { DealArchivedList } from "./DealArchivedList";
import { DealCreate } from "./DealCreate";
import { DealEdit } from "./DealEdit";
import { DealEmpty } from "./DealEmpty";
import { DealShow } from "./DealShow";
import { OnlyMineInput } from "./OnlyMineInput";
import { findDealLabel } from "./deal";
import type { Deal } from "../types";
import type { ColumnDef } from "@tanstack/react-table";

const DealList = () => {
  const { identity } = useGetIdentity();
  const { dealCategories } = useConfigurationContext();

  if (!identity) return null;

  const dealFilters = [
    <SearchInput source="q" alwaysOn key="q" />,
    <ReferenceInput source="company_id" reference="companies" key="company_id">
      <AutocompleteInput label={false} placeholder="Company" />
    </ReferenceInput>,
    <SelectInput
      source="category"
      emptyText="Category"
      choices={dealCategories}
      optionText="label"
      optionValue="value"
      key="category"
    />,
    <OnlyMineInput source="sales_id" alwaysOn key="sales_id" />,
  ];

  return (
    <List
      perPage={25}
      filter={{ "archived_at@is": null }}
      title={false}
      sort={{ field: "index", order: "DESC" }}
      filters={dealFilters}
      actions={false}
      pagination={<ListPagination rowsPerPageOptions={[10, 25, 50, 100]} />}
    >
      <DealLayout />
    </List>
  );
};

const DealNameCell = () => {
  const deal = useRecordContext<Deal>();
  return (
    <span className="font-medium">{deal?.name ?? "—"}</span>
  );
};

const DealCompanyCell = () => (
  <ReferenceField source="company_id" reference="companies" link={false}>
    <TextField source="name" className="text-muted-foreground" />
  </ReferenceField>
);

const DealCategoryCell = () => {
  const deal = useRecordContext<Deal>();
  const { dealCategories } = useConfigurationContext();
  const label = dealCategories.find((c) => c.value === deal?.category)?.label;
  return (
    <span className="text-muted-foreground">{label ?? deal?.category ?? "—"}</span>
  );
};

const DealStageCell = () => {
  const deal = useRecordContext<Deal>();
  const { dealStages } = useConfigurationContext();
  const label = deal?.stage ? findDealLabel(dealStages, deal.stage) : null;
  return (
    <span className="text-muted-foreground">{label ?? deal?.stage ?? "—"}</span>
  );
};

const DealAmountCell = () => {
  const deal = useRecordContext<Deal>();
  if (deal?.amount == null) return <span className="text-muted-foreground">—</span>;
  return (
    <span>
      {deal.amount.toLocaleString("en-US", {
        style: "currency",
        currency: "USD",
        currencyDisplay: "narrowSymbol",
      })}
    </span>
  );
};

const DealExpectedClosingCell = () => {
  const deal = useRecordContext<Deal>();
  if (!deal?.expected_closing_date) return <span className="text-muted-foreground">—</span>;
  return (
    <span className="text-muted-foreground">
      {new Date(deal.expected_closing_date).toLocaleDateString()}
    </span>
  );
};

const dealColumns: ColumnDef<Deal, unknown>[] = [
  {
    id: "name",
    accessorKey: "name",
    header: "Deal",
    cell: () => <DealNameCell />,
    size: 200,
    enableResizing: true,
  },
  {
    id: "company_id",
    accessorKey: "company_id",
    header: "Company",
    cell: () => <DealCompanyCell />,
    size: 150,
    enableResizing: true,
  },
  {
    id: "category",
    accessorKey: "category",
    header: "Category",
    cell: () => <DealCategoryCell />,
    size: 120,
    enableResizing: true,
  },
  {
    id: "stage",
    accessorKey: "stage",
    header: "Stage",
    cell: () => <DealStageCell />,
    size: 120,
    enableResizing: true,
  },
  {
    id: "amount",
    accessorKey: "amount",
    header: () => <div className="text-right">Amount</div>,
    cell: () => (
      <div className="text-right">
        <DealAmountCell />
      </div>
    ),
    size: 120,
    enableResizing: true,
  },
  {
    id: "expected_closing_date",
    accessorKey: "expected_closing_date",
    header: "Expected closing",
    cell: () => <DealExpectedClosingCell />,
    size: 120,
    enableResizing: true,
  },
];

const DealListLayout = () => {
  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters) return <DealEmpty />;

  return (
    <TablecnListTable
      columns={dealColumns}
      sortFields={["name", "amount", "index", "expected_closing_date"]}
      toolbarActions={
        <>
          <FilterButton />
          <TableToolbarExportButton />
          <TableToolbarCreateButton label="New Deal" />
        </>
      }
    />
  );
};

const DealLayout = () => {
  const location = useLocation();
  const matchCreate = matchPath("/deals/create", location.pathname);
  const matchShow = matchPath("/deals/:id/show", location.pathname);
  const matchEdit = matchPath("/deals/:id", location.pathname);

  const { data, isPending, filterValues } = useListContext();
  const hasFilters = filterValues && Object.keys(filterValues).length > 0;

  if (isPending) return null;
  if (!data?.length && !hasFilters)
    return (
      <>
        <DealEmpty>
          <DealShow open={!!matchShow} id={matchShow?.params.id} />
          <DealArchivedList />
        </DealEmpty>
      </>
    );

  return (
    <div className="w-full">
      <DealListLayout />
      <DealArchivedList />
      <DealCreate open={!!matchCreate} />
      <DealEdit open={!!matchEdit && !matchCreate} id={matchEdit?.params.id} />
      <DealShow open={!!matchShow} id={matchShow?.params.id} />
    </div>
  );
};

export default DealList;
