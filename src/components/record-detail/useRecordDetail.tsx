import type { ReactNode } from "react";
import { useState, useEffect, useCallback, useMemo } from "react";
import { useParams, useNavigate } from "react-router";
import { toast } from "sonner";
import { showError } from "@/lib/show-error";
import { useObject, useAttributes } from "@/hooks/use-object-registry";
import type { Attribute } from "@/types/objects";
import {
  useRecord,
  useRecords,
  useUpdateRecord,
  useDeleteRecord,
  useCreateRecord,
} from "@/hooks/use-records";
import { useToggleFavorite, useIsFavorite } from "@/hooks/use-favorites";
import { useRecentItems, type RecentItem } from "@/hooks/use-recent-items";
import { trackRecentRoute } from "@/lib/recent-routes";
import {
  usePageTitle,
  usePageHeaderBreadcrumb,
  usePageHeaderActions,
} from "@/contexts/page-header";
import { RecordDetailBreadcrumb } from "./RecordDetailBreadcrumb";
import { RecordDetailHeaderActions } from "./RecordDetailHeaderActions";
import type { ObjectConfig } from "@/types/objects";
import type { UseMutationResult } from "@tanstack/react-query";

export interface UseRecordDetailReturn {
  objectSlug: string;
  recordId: string | number;
  numericRecordId: number;
  obj: ObjectConfig | undefined;
  record: unknown;
  attributes: Attribute[];
  isPending: boolean;
  isError: boolean;
  displayName: string;
  activeTab: string;
  setActiveTab: (tab: string) => void;
  confirmDeleteOpen: boolean;
  setConfirmDeleteOpen: (open: boolean) => void;
  showAllFields: boolean;
  setShowAllFields: (show: boolean) => void;
  editableAttributes: Attribute[];
  visibleEditableAttributes: Attribute[];
  systemAttributes: Attribute[];
  hiddenCount: number;
  emptyFieldsCount: number;
  breadcrumbPortal: ReactNode;
  headerActionsPortal: ReactNode;
  handleFieldSave: (attr: Attribute) => (value: unknown) => void;
  handleDelete: () => Promise<void>;
  deleteRecord: UseMutationResult<unknown, Error, string | number, unknown>;
}

export function useRecordDetail(): UseRecordDetailReturn {
  const { objectSlug = "", recordId: recordIdParam = "" } = useParams<{
    objectSlug: string;
    recordId: string;
  }>();
  const navigate = useNavigate();
  const recordId = /^\d+$/.test(recordIdParam)
    ? parseInt(recordIdParam, 10)
    : recordIdParam;

  const obj = useObject(objectSlug);
  const attributes = useAttributes(objectSlug);

  const {
    data: record,
    isPending,
    isError,
  } = useRecord(objectSlug, recordId ?? "");
  const updateRecord = useUpdateRecord(objectSlug);
  const deleteRecord = useDeleteRecord(objectSlug);
  const createRecord = useCreateRecord(objectSlug);

  const numericRecordId =
    typeof recordId === "number"
      ? recordId
      : parseInt(String(recordId), 10) || 0;
  const isFavorite = useIsFavorite(objectSlug, numericRecordId);
  const toggleFavoriteMutation = useToggleFavorite();

  const [, addRecentItem] = useRecentItems();

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [showAllFields, setShowAllFields] = useState(false);
  const [activeTab, setActiveTab] = useState(() =>
    typeof window !== "undefined" && window.location.hash === "#notes"
      ? "notes"
      : "overview",
  );

  useEffect(() => {
    const hash = window.location.hash;
    if (hash === "#notes") setActiveTab("notes");
  }, []);

  const primaryAttr = useMemo(
    () => attributes.find((a) => a.isPrimary),
    [attributes],
  );

  const displayName = useMemo(() => {
    if (!record || !primaryAttr) return "\u2026";
    const val = (record as Record<string, unknown>)[primaryAttr.columnName];
    return typeof val === "string" && val ? val : "Unnamed";
  }, [record, primaryAttr]);

  usePageTitle("");

  const { data: listData } = useRecords(objectSlug, {
    page: 1,
    perPage: 200,
  });
  const listIds = useMemo(
    () =>
      (listData?.data ?? []).map(
        (r) => (r as Record<string, unknown>).Id as number,
      ),
    [listData],
  );
  const currentIndex = listIds.indexOf(recordId as number);
  const prevId = currentIndex > 0 ? listIds[currentIndex - 1] : null;
  const nextId =
    currentIndex >= 0 && currentIndex < listIds.length - 1
      ? listIds[currentIndex + 1]
      : null;

  const handleToggleFavorite = useCallback(() => {
    if (!numericRecordId) return;
    toggleFavoriteMutation.mutate({
      objectSlug,
      recordId: numericRecordId,
    });
  }, [objectSlug, numericRecordId, toggleFavoriteMutation]);

  const handleDuplicate = useCallback(async () => {
    if (!record || !obj || !primaryAttr) return;
    const rec = record as Record<string, unknown>;
    const data: Record<string, unknown> = {};
    for (const attr of attributes) {
      if (attr.isSystem || attr.columnName === "Id") continue;
      if (rec[attr.columnName] != null) {
        data[attr.columnName] = rec[attr.columnName];
      }
    }
    const primaryVal = rec[primaryAttr.columnName];
    if (typeof primaryVal === "string") {
      data[primaryAttr.columnName] = `${primaryVal} (copy)`;
    }
    try {
      const created = await createRecord.mutateAsync(data);
      const newId = (created as Record<string, unknown>).Id;
      if (newId != null) {
        navigate(`/objects/${objectSlug}/${newId}`);
        toast.success("Record duplicated");
      }
    } catch (err) {
      showError(err, "Failed to duplicate record");
    }
  }, [
    record,
    obj,
    primaryAttr,
    attributes,
    createRecord,
    navigate,
    objectSlug,
  ]);

  const breadcrumbForHeader =
    obj && !isPending && !isError && record ? (
      <RecordDetailBreadcrumb
        objectSlug={objectSlug}
        obj={obj}
        recordName={
          primaryAttr
            ? typeof (record as Record<string, unknown>)[
                primaryAttr.columnName
              ] === "string" &&
              (record as Record<string, unknown>)[primaryAttr.columnName]
              ? String(
                  (record as Record<string, unknown>)[primaryAttr.columnName],
                )
              : "Unnamed"
            : "\u2026"
        }
      />
    ) : null;
  const breadcrumbPortal = usePageHeaderBreadcrumb(breadcrumbForHeader);

  const headerActionsNode =
    obj && record ? (
      <RecordDetailHeaderActions
        listIdsLength={listIds.length}
        prevId={prevId}
        nextId={nextId}
        isFavorite={isFavorite}
        onBack={() => navigate(`/objects/${objectSlug}`)}
        onPrev={() =>
          prevId != null && navigate(`/objects/${objectSlug}/${prevId}`)
        }
        onNext={() =>
          nextId != null && navigate(`/objects/${objectSlug}/${nextId}`)
        }
        onToggleFavorite={handleToggleFavorite}
        onEdit={() => navigate(`/objects/${objectSlug}/${recordId}`)}
        onDuplicate={handleDuplicate}
        onDeleteOpen={() => setConfirmDeleteOpen(true)}
      />
    ) : null;
  const headerActionsPortal = usePageHeaderActions(headerActionsNode);

  useEffect(() => {
    if (!record || !obj || !recordId) return;
    if (!displayName || displayName === "\u2026") return;
    const slugToType: Record<string, "contact" | "company" | "deal"> = {
      contacts: "contact",
      companies: "company",
      deals: "deal",
    };
    const recentType = slugToType[objectSlug];
    if (recentType) {
      const numId =
        typeof recordId === "number"
          ? recordId
          : parseInt(String(recordId), 10);
      addRecentItem({
        type: recentType,
        id: numId,
        name: displayName,
      } as RecentItem);
    }
    trackRecentRoute({
      path: `/objects/${objectSlug}/${recordId}`,
      title: displayName,
      objectType: objectSlug,
    });
  }, [record, obj, recordId, objectSlug, displayName, addRecentItem]);

  useEffect(() => {
    if (displayName && displayName !== "\u2026") {
      document.title = `${displayName} | Basics CRM`;
    }
    return () => {
      document.title = "Basics CRM";
    };
  }, [displayName]);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && !confirmDeleteOpen) {
        navigate(`/objects/${objectSlug}`);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [navigate, objectSlug, confirmDeleteOpen]);

  const handleFieldSave = useCallback(
    (attr: Attribute) => (value: unknown) => {
      if (!recordId) return;
      updateRecord.mutate(
        { id: recordId, data: { [attr.columnName]: value } },
        {
          onError: () => {
            toast.error("Failed to save field");
          },
        },
      );
    },
    [recordId, updateRecord],
  );

  const handleDelete = useCallback(async () => {
    if (!recordId) return;
    try {
      await deleteRecord.mutateAsync(recordId);
      navigate(`/objects/${objectSlug}`);
    } catch (err) {
      showError(
        err,
        `Failed to delete ${obj?.singularName?.toLowerCase() ?? "record"}`,
      );
    }
  }, [recordId, deleteRecord, navigate, objectSlug, obj]);

  const editableAttributes = useMemo(
    () =>
      attributes
        .filter((a) => !a.isSystem && !a.isPrimary)
        .sort((a, b) => a.order - b.order),
    [attributes],
  );

  const systemAttributes = useMemo(
    () =>
      attributes
        .filter((a) => a.isSystem && a.columnName !== "Id")
        .sort((a, b) => a.order - b.order),
    [attributes],
  );

  const isValueEmpty = useCallback(
    (val: unknown) => val == null || val === "" || val === false,
    [],
  );

  const visibleEditableAttributes = useMemo(() => {
    if (showAllFields) return editableAttributes;
    return editableAttributes.filter((attr) => {
      if (!record) return true;
      const rec = record as Record<string, unknown>;
      return !isValueEmpty(rec[attr.columnName]);
    });
  }, [editableAttributes, record, showAllFields, isValueEmpty]);

  const emptyFieldsCount = useMemo(() => {
    if (!record) return 0;
    const rec = record as Record<string, unknown>;
    return editableAttributes.filter((attr) =>
      isValueEmpty(rec[attr.columnName]),
    ).length;
  }, [editableAttributes, record, isValueEmpty]);

  const hiddenCount =
    editableAttributes.length - visibleEditableAttributes.length;

  return {
    objectSlug,
    recordId,
    numericRecordId,
    obj,
    record,
    attributes,
    isPending,
    isError,
    displayName,
    activeTab,
    setActiveTab,
    confirmDeleteOpen,
    setConfirmDeleteOpen,
    showAllFields,
    setShowAllFields,
    editableAttributes,
    visibleEditableAttributes,
    systemAttributes,
    hiddenCount,
    emptyFieldsCount,
    breadcrumbPortal,
    headerActionsPortal,
    handleFieldSave,
    handleDelete,
    updateRecord,
    deleteRecord,
  };
}
