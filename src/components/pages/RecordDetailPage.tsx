import { useParams, Link } from "react-router";
import { ArrowLeftIcon } from "@phosphor-icons/react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { DetailField } from "@/components/cells";
import {
  DetailSkeleton,
  NotesTabContent,
  RecordDetailDetailsSidebar,
  RecordDetailDeleteDialog,
  useRecordDetail,
} from "@/components/record-detail";

export function RecordDetailPage() {
  const { objectSlug = "" } = useParams<{ objectSlug: string }>();
  const {
    objectSlug: objSlug,
    numericRecordId,
    obj,
    record,
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
    deleteRecord,
  } = useRecordDetail();

  if (!obj) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-medium">Object not found</p>
        <p className="text-sm text-muted-foreground">
          No object with slug &ldquo;{objectSlug}&rdquo; exists.
        </p>
        <Button variant="outline" size="sm" asChild>
          <Link to="/dashboard">
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
            Back to dashboard
          </Link>
        </Button>
      </div>
    );
  }

  if (isPending) {
    return <DetailSkeleton />;
  }

  if (isError || !record) {
    return (
      <div className="flex flex-col items-center justify-center gap-4 py-24 text-center">
        <p className="text-lg font-medium">{obj.singularName} not found</p>
        <Button variant="outline" size="sm" asChild>
          <Link to={`/objects/${objectSlug}`}>
            <ArrowLeftIcon className="mr-1.5 h-4 w-4" />
            Back to {obj.pluralName}
          </Link>
        </Button>
      </div>
    );
  }

  const rec = record as Record<string, unknown>;

  return (
    <>
      {breadcrumbPortal}
      {headerActionsPortal}
      <div className="space-y-6 pt-4 pb-8">
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList>
              <TabsTrigger value="overview">Overview</TabsTrigger>
              <TabsTrigger value="activity">Activity</TabsTrigger>
              <TabsTrigger value="notes">Notes</TabsTrigger>
              <TabsTrigger value="tasks">Tasks</TabsTrigger>
            </TabsList>

            <TabsContent value="overview" className="mt-4 space-y-6">
              <div className="space-y-0.5">
                {visibleEditableAttributes.map((attr) => (
                  <DetailField
                    key={attr.id}
                    attribute={attr}
                    value={rec[attr.columnName]}
                    onSave={handleFieldSave(attr)}
                  />
                ))}
                {!showAllFields && hiddenCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground -ml-1"
                    onClick={() => setShowAllFields(true)}
                  >
                    Show {hiddenCount} empty {hiddenCount === 1 ? "field" : "fields"}
                  </Button>
                )}
                {showAllFields && emptyFieldsCount > 0 && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-7 text-xs text-muted-foreground -ml-1"
                    onClick={() => setShowAllFields(false)}
                  >
                    Hide empty fields
                  </Button>
                )}
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-4">
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                No activity yet.
              </div>
            </TabsContent>

            <TabsContent value="notes" className="mt-4">
              <NotesTabContent
                objectSlug={objSlug}
                recordId={numericRecordId}
              />
            </TabsContent>

            <TabsContent value="tasks" className="mt-4">
              <div className="rounded-lg border border-dashed py-12 text-center text-sm text-muted-foreground">
                No tasks yet.
              </div>
            </TabsContent>
          </Tabs>

          <RecordDetailDetailsSidebar
            record={rec}
            visibleEditableAttributes={visibleEditableAttributes}
            systemAttributes={systemAttributes}
            showAllFields={showAllFields}
            hiddenCount={hiddenCount}
            onFieldSave={handleFieldSave}
            onShowAllFields={() => setShowAllFields(true)}
            onHideEmptyFields={() => setShowAllFields(false)}
          />
        </div>
      </div>

      <RecordDetailDeleteDialog
        open={confirmDeleteOpen}
        onOpenChange={setConfirmDeleteOpen}
        displayName={displayName}
        onConfirm={handleDelete}
        isDeleting={deleteRecord.isPending}
      />
    </>
  );
}
