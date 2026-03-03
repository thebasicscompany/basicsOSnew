/**
 * CreateRecordModal — dialog for creating new records.
 *
 * Features:
 *  - Dynamic form driven by Attribute array (via RecordForm)
 *  - Validates all fields before submission
 *  - "Create more" toggle: keep modal open and clear form after creation
 *  - Cmd+Enter keyboard shortcut to submit
 *  - Loading state during API call
 */

import React, {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { ScrollArea } from "@/components/ui/scroll-area";
import { getFieldType } from "@/field-types";
import type { Attribute } from "@/field-types/types";
import { useCreateRecord } from "@/hooks/use-records";
import { RecordForm } from "./RecordForm";

// ---------------------------------------------------------------------------
// Props
// ---------------------------------------------------------------------------

export interface CreateRecordModalProps {
  objectSlug: string;
  objectName: string;
  attributes: Attribute[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated?: (record: any) => void;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function buildInitialValues(attributes: Attribute[]): Record<string, any> {
  const values: Record<string, any> = {};
  for (const attr of attributes) {
    if (attr.isSystem || attr.isHiddenByDefault) continue;
    values[attr.columnName] = undefined;
  }
  return values;
}

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export function CreateRecordModal({
  objectSlug,
  objectName,
  attributes,
  open,
  onOpenChange,
  onCreated,
}: CreateRecordModalProps) {
  const [values, setValues] = useState<Record<string, any>>(() =>
    buildInitialValues(attributes),
  );
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [createMore, setCreateMore] = useState(false);

  const createRecord = useCreateRecord(objectSlug);
  const formRef = useRef<HTMLDivElement>(null);

  // Reset form when modal opens
  useEffect(() => {
    if (open) {
      setValues(buildInitialValues(attributes));
      setErrors({});
    }
  }, [open, attributes]);

  // Visible (form-relevant) attributes
  const visibleAttributes = useMemo(
    () => attributes.filter((a) => !a.isSystem && !a.isHiddenByDefault),
    [attributes],
  );

  // ---- field change handler ------------------------------------------------

  const handleChange = useCallback((fieldName: string, value: any) => {
    setValues((prev) => ({ ...prev, [fieldName]: value }));
    // Clear field error on edit
    setErrors((prev) => {
      if (!prev[fieldName]) return prev;
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
  }, []);

  // ---- validation ----------------------------------------------------------

  const validate = useCallback((): boolean => {
    const newErrors: Record<string, string> = {};

    for (const attr of visibleAttributes) {
      const fieldType = getFieldType(attr.uiType);
      const result = fieldType.validate(values[attr.columnName], attr.config);

      if (!result.valid) {
        newErrors[attr.columnName] = result.message ?? "Invalid value";
      }

      // Primary field is required
      if (attr.isPrimary && fieldType.isEmpty(values[attr.columnName])) {
        newErrors[attr.columnName] = `${attr.name} is required`;
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  }, [visibleAttributes, values]);

  // ---- submit --------------------------------------------------------------

  const handleSubmit = useCallback(async () => {
    if (!validate()) return;

    try {
      const record = await createRecord.mutateAsync(values);
      onCreated?.(record);

      if (createMore) {
        // Clear form for next entry
        setValues(buildInitialValues(attributes));
        setErrors({});
      } else {
        onOpenChange(false);
      }
    } catch {
      // Mutation error is surfaced via createRecord.error in the UI
    }
  }, [
    validate,
    values,
    createRecord,
    onCreated,
    createMore,
    attributes,
    onOpenChange,
  ]);

  // ---- keyboard shortcut: Cmd+Enter to submit ------------------------------

  useEffect(() => {
    if (!open) return;

    function handleKeyDown(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "Enter") {
        e.preventDefault();
        handleSubmit();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [open, handleSubmit]);

  // ---- render --------------------------------------------------------------

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>Create {objectName}</DialogTitle>
          <DialogDescription>
            Fill in the fields below to create a new {objectName.toLowerCase()}.
          </DialogDescription>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-3">
          <div ref={formRef}>
            <RecordForm
              attributes={attributes}
              values={values}
              onChange={handleChange}
              errors={errors}
            />
          </div>
        </ScrollArea>

        {createRecord.error && (
          <p className="text-sm text-destructive">
            {(createRecord.error as Error).message ??
              "Failed to create record."}
          </p>
        )}

        <DialogFooter className="items-center gap-4">
          <div className="flex items-center gap-2 mr-auto">
            <Switch
              id="create-more"
              checked={createMore}
              onCheckedChange={setCreateMore}
            />
            <Label
              htmlFor="create-more"
              className="text-sm font-normal cursor-pointer"
            >
              Create more
            </Label>
          </div>

          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
            disabled={createRecord.isPending}
          >
            Cancel
          </Button>

          <Button onClick={handleSubmit} disabled={createRecord.isPending}>
            {createRecord.isPending ? "Creating..." : `Create ${objectName}`}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
