import { HugeiconsIcon } from "@hugeicons/react";
import { Add01Icon, Delete02Icon, Edit02Icon } from "@hugeicons/core-free-icons";
import {
  useCreate,
  useDelete,
  useGetList,
  useNotify,
  useUpdate,
} from "ra-core";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useConfigurationContext } from "../root/ConfigurationContext";

const TRIGGER_TYPES = [
  { value: "deal_stage_change", label: "Deal stage changes" },
  { value: "contact_created", label: "Contact created" },
] as const;

const ACTION_TYPES = [
  { value: "create_task", label: "Create task" },
] as const;

export type AutomationRule = {
  id: number;
  sales_id: number;
  name: string;
  enabled: boolean;
  trigger_type: string;
  trigger_config: Record<string, unknown>;
  action_type: string;
  action_config: Record<string, unknown>;
};

const defaultRule = (): Partial<AutomationRule> => ({
  name: "",
  enabled: true,
  trigger_type: "deal_stage_change",
  trigger_config: { target_stage: "" },
  action_type: "create_task",
  action_config: { text: "Follow up", type: "call", due_offset_days: 7 },
});

export const AutomationRulesSection = () => {
  const { data: rules = [], isLoading } = useGetList<AutomationRule>(
    "automation_rules",
    {
      sort: { field: "created_at", order: "DESC" },
    },
  );
  const [create] = useCreate();
  const [update] = useUpdate();
  const [remove] = useDelete();
  const notify = useNotify();
  const { dealStages, taskTypes } = useConfigurationContext();
  const [editingId, setEditingId] = useState<number | null>(null);
  const [creating, setCreating] = useState(false);
  const [formData, setFormData] = useState<Partial<AutomationRule>>(defaultRule);

  const handleSave = async () => {
    try {
      if (editingId) {
        await update("automation_rules", {
          id: editingId,
          data: formData as AutomationRule,
          previousData: rules.find((r) => r.id === editingId),
        });
        notify("Automation rule updated");
        setEditingId(null);
      } else if (creating) {
        await create("automation_rules", {
          data: formData as Omit<AutomationRule, "id">,
        });
        notify("Automation rule created");
        setCreating(false);
      }
      setFormData(defaultRule());
    } catch {
      notify("Failed to save automation rule", { type: "error" });
    }
  };

  const handleDelete = async (id: number) => {
    try {
      await remove("automation_rules", { id, previousData: rules.find((r) => r.id === id) });
      notify("Automation rule deleted");
      if (editingId === id) setEditingId(null);
    } catch {
      notify("Failed to delete automation rule", { type: "error" });
    }
  };

  const openEdit = (rule: AutomationRule) => {
    setFormData({
      name: rule.name,
      enabled: rule.enabled,
      trigger_type: rule.trigger_type,
      trigger_config: rule.trigger_config ?? {},
      action_type: rule.action_type,
      action_config: rule.action_config ?? {},
    });
    setEditingId(rule.id);
    setCreating(false);
  };

  const openCreate = () => {
    setFormData(defaultRule());
    setCreating(true);
    setEditingId(null);
  };

  const closeDialog = () => {
    setCreating(false);
    setEditingId(null);
    setFormData(defaultRule());
  };

  const formatRuleDescription = (rule: AutomationRule) => {
    const trigger =
      rule.trigger_type === "deal_stage_change"
        ? `When deal → ${(rule.trigger_config as { target_stage?: string })?.target_stage || "?"}`
        : "When contact created";
    const action =
      rule.action_type === "create_task"
        ? `Create task: ${(rule.action_config as { text?: string })?.text || "Follow up"}`
        : rule.action_type;
    return `${trigger} → ${action}`;
  };

  const isOpen = creating || editingId !== null;

  return (
    <Card id="automations">
      <CardContent className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-xl font-semibold text-muted-foreground">
            Automations
          </h2>
          <Button size="sm" variant="outline" onClick={openCreate}>
            <HugeiconsIcon icon={Add01Icon} className="h-4 w-4 mr-1" />
            Add rule
          </Button>
        </div>
        <p className="text-sm text-muted-foreground">
          Create rules that run automatically when deals or contacts change.
        </p>
        {isLoading ? (
          <p className="text-sm text-muted-foreground">Loading…</p>
        ) : rules.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No automation rules yet. Add one to get started.
          </p>
        ) : (
          <ul className="space-y-2">
            {rules.map((rule) => (
              <li
                key={rule.id}
                className="flex items-center justify-between rounded-md border p-3"
              >
                <div className="flex items-center gap-3">
                  <Switch
                    checked={rule.enabled}
                    onCheckedChange={async (checked) => {
                      await update("automation_rules", {
                        id: rule.id,
                        data: { ...rule, enabled: checked },
                        previousData: rule,
                      });
                      notify(checked ? "Rule enabled" : "Rule disabled");
                    }}
                  />
                  <div>
                    <p className="font-medium">{rule.name || "Unnamed rule"}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatRuleDescription(rule)}
                    </p>
                  </div>
                </div>
                <div className="flex gap-1">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => openEdit(rule)}
                  >
                    <HugeiconsIcon icon={Edit02Icon} className="h-4 w-4" />
                  </Button>
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => handleDelete(rule.id)}
                  >
                    <HugeiconsIcon icon={Delete02Icon} className="h-4 w-4" />
                  </Button>
                </div>
              </li>
            ))}
          </ul>
        )}
      </CardContent>

      <Dialog open={isOpen} onOpenChange={(open) => !open && closeDialog()}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingId ? "Edit automation rule" : "Add automation rule"}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Rule name</Label>
              <input
                className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                value={formData.name ?? ""}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, name: e.target.value }))
                }
                placeholder="e.g. Schedule handoff when deal won"
              />
            </div>
            <div className="space-y-2">
              <Label>When (trigger)</Label>
              <Select
                value={formData.trigger_type}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    trigger_type: v,
                    trigger_config:
                      v === "deal_stage_change"
                        ? { target_stage: "" }
                        : {},
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {TRIGGER_TYPES.map((t) => (
                    <SelectItem key={t.value} value={t.value}>
                      {t.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.trigger_type === "deal_stage_change" && (
                <div className="space-y-2 mt-2">
                  <Label>Target stage</Label>
                  <Select
                    value={
                      (formData.trigger_config as { target_stage?: string })
                        ?.target_stage ?? ""
                    }
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        trigger_config: {
                          ...(prev.trigger_config as object),
                          target_stage: v,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select stage" />
                    </SelectTrigger>
                    <SelectContent>
                      {dealStages?.map((s) => (
                        <SelectItem key={s.value} value={s.value}>
                          {s.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
            <div className="space-y-2">
              <Label>Then (action)</Label>
              <Select
                value={formData.action_type}
                onValueChange={(v) =>
                  setFormData((prev) => ({
                    ...prev,
                    action_type: v,
                    action_config:
                      v === "create_task"
                        ? {
                            text: "Follow up",
                            type: "call",
                            due_offset_days: 7,
                          }
                        : {},
                  }))
                }
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {ACTION_TYPES.map((a) => (
                    <SelectItem key={a.value} value={a.value}>
                      {a.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {formData.action_type === "create_task" && (
                <div className="space-y-2 mt-2">
                  <Label>Task description</Label>
                  <input
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={
                      (formData.action_config as { text?: string })?.text ?? ""
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        action_config: {
                          ...(prev.action_config as object),
                          text: e.target.value,
                        },
                      }))
                    }
                    placeholder="e.g. Schedule handoff call"
                  />
                  <Label>Task type</Label>
                  <Select
                    value={
                      (formData.action_config as { type?: string })?.type ??
                      "call"
                    }
                    onValueChange={(v) =>
                      setFormData((prev) => ({
                        ...prev,
                        action_config: {
                          ...(prev.action_config as object),
                          type: v,
                        },
                      }))
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {taskTypes?.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {t.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Label>Due in (days)</Label>
                  <input
                    type="number"
                    min={1}
                    className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors"
                    value={
                      (formData.action_config as { due_offset_days?: number })
                        ?.due_offset_days ?? 7
                    }
                    onChange={(e) =>
                      setFormData((prev) => ({
                        ...prev,
                        action_config: {
                          ...(prev.action_config as object),
                          due_offset_days: parseInt(e.target.value, 10) || 7,
                        },
                      }))
                    }
                  />
                </div>
              )}
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.enabled ?? true}
                onCheckedChange={(v) =>
                  setFormData((prev) => ({ ...prev, enabled: v }))
                }
              />
              <Label>Enabled</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={closeDialog}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={
                !formData.name?.trim() ||
                (formData.trigger_type === "deal_stage_change" &&
                  !(formData.trigger_config as { target_stage?: string })
                    ?.target_stage)
              }
            >
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </Card>
  );
};
