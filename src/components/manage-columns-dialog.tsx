import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, Settings2 } from "lucide-react";
import {
  useCustomFieldDefs,
  useCreateCustomFieldDef,
  useDeleteCustomFieldDef,
} from "@/hooks/use-custom-field-defs";

interface ManageColumnsDialogProps {
  resource: "contacts" | "companies" | "deals";
}

export function ManageColumnsDialog({ resource }: ManageColumnsDialogProps) {
  const [open, setOpen] = useState(false);
  const [label, setLabel] = useState("");
  const [fieldType, setFieldType] = useState<string>("text");

  const { data: defs = [] } = useCustomFieldDefs(resource);
  const createDef = useCreateCustomFieldDef();
  const deleteDef = useDeleteCustomFieldDef();

  const handleAdd = async () => {
    if (!label.trim()) return;
    const name = label
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");
    await createDef.mutateAsync({
      resource,
      name: name || "field",
      label: label.trim(),
      fieldType: fieldType as "text" | "number" | "date" | "select" | "boolean",
      options: fieldType === "select" ? [] : undefined,
    });
    setLabel("");
    setFieldType("text");
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm" className="h-8 gap-1">
          <Settings2 className="h-3.5 w-3.5" />
          Manage Columns
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Manage Custom Columns</DialogTitle>
        </DialogHeader>

        <div className="space-y-2">
          {defs.length === 0 && (
            <p className="text-sm text-muted-foreground">
              No custom columns yet.
            </p>
          )}
          {defs.map((def) => (
            <div
              key={def.id}
              className="flex items-center justify-between rounded-md border px-3 py-2"
            >
              <div>
                <span className="text-sm font-medium">{def.label}</span>
                <span className="ml-2 text-xs text-muted-foreground">
                  ({def.fieldType})
                </span>
              </div>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => deleteDef.mutate({ id: def.id, resource })}
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            </div>
          ))}
        </div>

        <div className="space-y-3 border-t pt-4">
          <p className="text-sm font-medium">Add New Column</p>
          <Input
            placeholder="Column name (e.g. Lead Source)"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAdd()}
          />
          <Select value={fieldType} onValueChange={setFieldType}>
            <SelectTrigger>
              <SelectValue placeholder="Field type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Text</SelectItem>
              <SelectItem value="number">Number</SelectItem>
              <SelectItem value="date">Date</SelectItem>
              <SelectItem value="boolean">Checkbox</SelectItem>
              <SelectItem value="select">
                Dropdown (define options after)
              </SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={handleAdd}
            disabled={!label.trim() || createDef.isPending}
            className="w-full gap-1"
          >
            <Plus className="h-4 w-4" />
            Add Column
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
