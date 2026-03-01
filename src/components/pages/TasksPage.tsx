import { useState, useMemo } from "react";
import {
  startOfToday,
  endOfToday,
  endOfTomorrow,
  endOfWeek,
  getDay,
  isPast,
  isWithinInterval,
  parseISO,
  format,
} from "date-fns";
import { CheckSquare, Square, Plus, Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useTasks, useMarkTaskDone, useDeleteTask, useCreateTask, type Task } from "@/hooks/use-tasks";
import { useContacts, type ContactSummary } from "@/hooks/use-contacts";
import { ContactSheet } from "@/components/sheets/ContactSheet";

// ── Time bucket helpers ──────────────────────────────────────────────────────

function getBucket(dueDate: string | null): "overdue" | "today" | "tomorrow" | "thisWeek" | "later" {
  if (!dueDate) return "later";
  const date = parseISO(dueDate);
  const now = new Date();
  if (isPast(endOfToday()) ? false : date < startOfToday()) return "overdue";
  if (date < startOfToday()) return "overdue";
  if (isWithinInterval(date, { start: startOfToday(), end: endOfToday() })) return "today";
  if (isWithinInterval(date, { start: endOfToday(), end: endOfTomorrow() })) return "tomorrow";
  const endOfWeekDate = endOfWeek(now, { weekStartsOn: 0 });
  if (getDay(now) < 5 && date <= endOfWeekDate) return "thisWeek";
  return "later";
}

const BUCKETS = [
  { key: "overdue", label: "Overdue" },
  { key: "today", label: "Today" },
  { key: "tomorrow", label: "Tomorrow" },
  { key: "thisWeek", label: "This week" },
  { key: "later", label: "Later" },
] as const;

// ── Task row ─────────────────────────────────────────────────────────────────

function TaskRow({
  task,
  contactName,
  onContactClick,
}: {
  task: Task;
  contactName: string | null;
  onContactClick: () => void;
}) {
  const markDone = useMarkTaskDone();
  const deleteTask = useDeleteTask();
  const isDone = !!task.doneDate;

  const handleToggle = () => {
    markDone.mutate(
      { id: task.id, done: !isDone },
      { onError: () => toast.error("Failed to update task") },
    );
  };

  const handleDelete = () => {
    deleteTask.mutate(task.id, {
      onSuccess: () => toast.success("Task deleted"),
      onError: () => toast.error("Failed to delete task"),
    });
  };

  return (
    <div className="group flex items-start gap-3 py-2">
      <button
        onClick={handleToggle}
        disabled={markDone.isPending}
        className="mt-0.5 shrink-0 text-muted-foreground hover:text-primary transition-colors"
      >
        {isDone ? (
          <CheckSquare className="size-4 text-primary" />
        ) : (
          <Square className="size-4" />
        )}
      </button>
      <div className="min-w-0 flex-1">
        <p className={`text-sm ${isDone ? "line-through text-muted-foreground" : ""}`}>
          {task.text ?? "—"}
        </p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          {task.type && task.type !== "None" && (
            <Badge variant="outline" className="text-xs py-0">
              {task.type}
            </Badge>
          )}
          {contactName && (
            <button
              onClick={onContactClick}
              className="text-xs text-muted-foreground hover:text-primary hover:underline transition-colors"
            >
              {contactName}
            </button>
          )}
          {task.dueDate && (
            <span className="text-xs text-muted-foreground">
              {format(parseISO(task.dueDate), "MMM d")}
            </span>
          )}
        </div>
      </div>
      <button
        onClick={handleDelete}
        disabled={deleteTask.isPending}
        className="mt-0.5 shrink-0 text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-destructive transition-all"
        title="Delete task"
      >
        <Trash2 className="size-3.5" />
      </button>
    </div>
  );
}

// ── Add task dialog ───────────────────────────────────────────────────────────

function AddTaskDialog({
  open,
  onOpenChange,
  contacts,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  contacts: ContactSummary[];
}) {
  const createTask = useCreateTask();
  const [contactId, setContactId] = useState<string>("");
  const [contactSearch, setContactSearch] = useState("");
  const [type, setType] = useState("None");
  const [text, setText] = useState("");
  const [dueDate, setDueDate] = useState(new Date().toISOString().slice(0, 10));

  const filteredContacts = useMemo(
    () =>
      contacts.filter((c) => {
        const name = `${c.firstName ?? ""} ${c.lastName ?? ""}`.toLowerCase();
        return name.includes(contactSearch.toLowerCase());
      }).slice(0, 20),
    [contacts, contactSearch],
  );

  const handleSubmit = () => {
    if (!contactId) { toast.error("Select a contact"); return; }
    if (!text.trim()) { toast.error("Enter task text"); return; }
    createTask.mutate(
      {
        contactId: parseInt(contactId, 10),
        type,
        text: text.trim(),
        dueDate: dueDate ? new Date(dueDate).toISOString() : undefined,
      },
      {
        onSuccess: () => {
          toast.success("Task created");
          onOpenChange(false);
          setContactId("");
          setContactSearch("");
          setType("None");
          setText("");
          setDueDate(new Date().toISOString().slice(0, 10));
        },
        onError: () => toast.error("Failed to create task"),
      },
    );
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>New task</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Contact</Label>
            <Input
              placeholder="Search contacts…"
              value={contactSearch}
              onChange={(e) => { setContactSearch(e.target.value); setContactId(""); }}
            />
            {contactSearch && !contactId && filteredContacts.length > 0 && (
              <div className="max-h-40 overflow-y-auto rounded-md border bg-popover shadow-md">
                {filteredContacts.map((c) => (
                  <button
                    key={c.id}
                    className="w-full px-3 py-2 text-left text-sm hover:bg-accent"
                    onClick={() => {
                      setContactId(String(c.id));
                      setContactSearch(`${c.firstName ?? ""} ${c.lastName ?? ""}`.trim());
                    }}
                  >
                    {c.firstName} {c.lastName}
                    {c.companyName && (
                      <span className="ml-1 text-muted-foreground">· {c.companyName}</span>
                    )}
                  </button>
                ))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <Label>Task</Label>
            <Input
              placeholder="Task description"
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label>Type</Label>
              <Select value={type} onValueChange={setType}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="None">None</SelectItem>
                  <SelectItem value="Call">Call</SelectItem>
                  <SelectItem value="Email">Email</SelectItem>
                  <SelectItem value="Meeting">Meeting</SelectItem>
                  <SelectItem value="Follow-up">Follow-up</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Due date</Label>
              <Input
                type="date"
                value={dueDate}
                onChange={(e) => setDueDate(e.target.value)}
              />
            </div>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            Cancel
          </Button>
          <Button onClick={handleSubmit} disabled={createTask.isPending}>
            {createTask.isPending && <Loader2 className="mr-1.5 size-4 animate-spin" />}
            Create
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

// ── Page ─────────────────────────────────────────────────────────────────────

export function TasksPage() {
  const { data: tasksData, isPending: tasksPending } = useTasks();
  const { data: contactsData } = useContacts({ pagination: { page: 1, perPage: 500 } });

  const [addOpen, setAddOpen] = useState(false);
  const [selectedContact, setSelectedContact] = useState<ContactSummary | null>(null);
  const [contactSheetOpen, setContactSheetOpen] = useState(false);

  const contacts = contactsData?.data ?? [];

  const contactMap = useMemo(
    () => new Map(contacts.map((c) => [c.id, c])),
    [contacts],
  );

  const tasks = tasksData?.data ?? [];

  // Only show non-done tasks (done within last 5 min still show briefly)
  const activeTasks = useMemo(
    () =>
      tasks.filter(
        (t) =>
          !t.doneDate ||
          new Date(t.doneDate) > new Date(Date.now() - 5 * 60 * 1000),
      ),
    [tasks],
  );

  const grouped = useMemo(() => {
    const groups: Record<string, Task[]> = {
      overdue: [], today: [], tomorrow: [], thisWeek: [], later: [],
    };
    for (const t of activeTasks) {
      groups[getBucket(t.dueDate)].push(t);
    }
    return groups;
  }, [activeTasks]);

  const handleContactClick = (contactId: number) => {
    const contact = contactMap.get(contactId);
    if (contact) {
      setSelectedContact(contact);
      setContactSheetOpen(true);
    }
  };

  return (
    <div className="max-w-2xl space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Tasks</h1>
          <p className="text-sm text-muted-foreground">
            {tasksPending ? "" : `${activeTasks.length} upcoming`}
          </p>
        </div>
        <Button size="sm" onClick={() => setAddOpen(true)} className="gap-1.5">
          <Plus className="size-4" />
          Add task
        </Button>
      </div>

      <Separator />

      {tasksPending && (
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Loader2 className="size-4 animate-spin" />
          Loading…
        </div>
      )}

      {!tasksPending && activeTasks.length === 0 && (
        <p className="text-sm text-muted-foreground">No upcoming tasks.</p>
      )}

      {BUCKETS.map(({ key, label }) => {
        const bucket = grouped[key];
        if (!bucket?.length) return null;
        return (
          <div key={key} className="space-y-1">
            <p className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {label}
            </p>
            <div className="divide-y rounded-lg border bg-card px-4">
              {bucket.map((task) => {
                const contact = task.contactId ? contactMap.get(task.contactId) : null;
                const contactName = contact
                  ? `${contact.firstName ?? ""} ${contact.lastName ?? ""}`.trim() || null
                  : null;
                return (
                  <TaskRow
                    key={task.id}
                    task={task}
                    contactName={contactName}
                    onContactClick={() => handleContactClick(task.contactId)}
                  />
                );
              })}
            </div>
          </div>
        );
      })}

      <AddTaskDialog
        open={addOpen}
        onOpenChange={setAddOpen}
        contacts={contacts}
      />

      <ContactSheet
        open={contactSheetOpen}
        onOpenChange={setContactSheetOpen}
        contact={selectedContact}
      />
    </div>
  );
}
