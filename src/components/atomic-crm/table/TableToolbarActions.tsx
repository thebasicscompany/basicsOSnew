import { HugeiconsIcon } from "@hugeicons/react";
import {
  Add01Icon,
  Download01Icon,
  Upload01Icon,
} from "@hugeicons/core-free-icons";
import { useCallback } from "react";
import type { Exporter } from "ra-core";
import {
  fetchRelatedRecords,
  Translate,
  useCreatePath,
  useDataProvider,
  useListContext,
  useNotify,
  useResourceContext,
} from "ra-core";
import { Link } from "react-router";

import { TableToolbarOption } from "./TableToolbarOption";
import { ContactImportDialog } from "../contacts/ContactImportButton";
import { useState } from "react";

const stopPropagation = (e: React.MouseEvent) => e.stopPropagation();

export type TableToolbarCreateButtonProps = {
  label?: string;
  resource?: string;
};

export const TableToolbarCreateButton = ({
  label,
  resource: targetResource,
}: TableToolbarCreateButtonProps) => {
  const resource = useResourceContext();
  const createPath = useCreatePath();
  const link = createPath({
    resource: targetResource ?? resource,
    type: "create",
  });
  return (
    <TableToolbarOption asChild>
      <Link to={link} onClick={stopPropagation}>
        <HugeiconsIcon icon={Add01Icon} />
        <Translate i18nKey={label ?? "ra.action.create"}>
          {label ?? "Create"}
        </Translate>
      </Link>
    </TableToolbarOption>
  );
};

export type TableToolbarExportButtonProps = {
  exporter?: Exporter;
  label?: string;
  maxResults?: number;
};

export const TableToolbarExportButton = (props: TableToolbarExportButtonProps) => {
  const {
    maxResults = 1000,
    onClick,
    label = "ra.action.export",
    exporter: customExporter,
  } = props;
  const {
    getData,
    total,
    resource,
    exporter: exporterFromContext,
  } = useListContext();
  const exporter = customExporter || exporterFromContext;
  const dataProvider = useDataProvider();
  const notify = useNotify();
  const handleClick = useCallback(
    (event: React.MouseEvent<HTMLButtonElement>) => {
      if (!getData) {
        throw new Error(
          "ListContext.getData must be defined to use ExportButton."
        );
      }
      getData({ maxResults })
        .then(
          (data) =>
            exporter &&
            exporter(
              data,
              fetchRelatedRecords(dataProvider),
              dataProvider,
              resource
            )
        )
        .catch((error) => {
          console.error(error);
          notify("HTTP Error", { type: "error" });
        });
      onClick?.(event);
    },
    [dataProvider, exporter, getData, maxResults, notify, onClick, resource]
  );

  return (
    <TableToolbarOption
      icon={<HugeiconsIcon icon={Download01Icon} />}
      onClick={handleClick}
      disabled={total === 0}
    >
      <Translate i18nKey={label}>Export</Translate>
    </TableToolbarOption>
  );
};

export const TableToolbarContactImportButton = () => {
  const [modalOpen, setModalOpen] = useState(false);
  return (
    <>
      <TableToolbarOption
        icon={<HugeiconsIcon icon={Upload01Icon} />}
        onClick={() => setModalOpen(true)}
      >
        Import CSV
      </TableToolbarOption>
      <ContactImportDialog open={modalOpen} onClose={() => setModalOpen(false)} />
    </>
  );
};
