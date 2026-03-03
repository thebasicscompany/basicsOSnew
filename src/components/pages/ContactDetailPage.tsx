import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router";
import { ArrowLeft, Pencil, Trash2, CheckSquare, FileText } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { useContact, useDeleteContact, useUpdateContact } from "@/hooks/use-contacts";
import { useContactNotes, useCreateContactNote, useDeleteContactNote } from "@/hooks/use-contact-notes";
import { useDeals } from "@/hooks/use-deals";
import { useCompany } from "@/hooks/use-companies";
import { useTasks, useCreateTask, useMarkTaskDone, useDeleteTask } from "@/hooks/use-tasks";
import { useRecentItems } from "@/hooks/use-recent-items";
import { ContactSheet } from "@/components/sheets/ContactSheet";
import { ContactStatusBadge, DealStageBadge } from "@/components/status-badge";
import { NotesFeed } from "@/components/notes-feed";
import { ROUTES } from "@basics-os/hub";
import { Input } from "@/components/ui/input";
import {
  InlineTextField,
  InlineTextareaField,
  InlineSelectField,
  type InlineSelectOption,
} from "@/components/inline-edit-field";

const CONTACT_STATUS_OPTIONS: InlineSelectOption[] = [
  { value: "lead", label: "Lead" },
  { value: "qualified", label: "Qualified" },
  { value: "customer", label: "Customer" },
  { value: "churned", label: "Churned" },
];

function FieldRow({ label, value }: { label: string; value: React.ReactNode }) {
  if (!value) return null;
  return (
    <div className="flex items-start gap-2 py-1.5">
      <span className="w-28 shrink-0 pt-0.5 text-[12px] text-muted-foreground">{label}</span>
      <span className="min-w-0 flex-1 text-[13px]">{value}</span>
    </div>
  );
}

function Avatar({ src, name }: { src?: string | null; name: string }) {
  const initials = name.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase();
  if (src) {
    return <img src={src} alt={name} className="size-10 rounded-full object-cover" />;
  }
  return (
    <div className="flex size-10 items-center justify-center rounded-full bg-primary/10 text-sm font-semibold text-primary">
      {initials || "?"}
    </div>
  );
}

export function ContactDetailPage() {
  const { id } = useParams<{ id: string }>();
  const contactId = id ? parseInt(id, 10) : null;
  const navigate = useNavigate();

  const [editOpen, setEditOpen] = useState(false);
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [newTaskText, setNewTaskText] = useState("");

  const { data: contact, isPending, isError } = useContact(contactId);
  const { data: notesData, isPending: notesPending } = useContactNotes(contactId);
  const { data: dealsData } = useDeals({ pagination: { page: 1, perPage: 100 } });
  const { data: tasksData } = useTasks();
  const { data: company } = useCompany(contact?.companyId ?? null);

  const createNote = useCreateContactNote();
  const deleteNote = useDeleteContactNote();
  const deleteContact = useDeleteContact();
  const updateContact = useUpdateContact();
  const createTask = useCreateTask();
  const markDone = useMarkTaskDone();
  const deleteTask = useDeleteTask();
  const [, addRecentItem] = useRecentItems();

  useEffect(() => {
    if (!contact || !contactId) return;
    const name =
      [contact.firstName, contact.lastName].filter(Boolean).join(" ") ||
      contact.email ||
      "Unnamed";
    addRecentItem({ type: "contact", id: contactId, name });
  }, [contact, contactId, addRecentItem]);

  const notes = notesData?.data ?? [];
  const contactDeals = (dealsData?.data ?? []).filter(
    (d) => d.contactIds?.includes(contactId!)
  );
  const contactTasks = (tasksData?.data ?? []).filter(
    (t) => t.contactId === contactId
  );

  const displayName = contact
    ? [contact.firstName, contact.lastName].filter(Boolean).join(" ") || contact.email || "Unnamed"
    : "";

  const handleDelete = async () => {
    if (!contactId) return;
    try {
      await deleteContact.mutateAsync(contactId);
      navigate(ROUTES.CRM_CONTACTS);
    } catch {
      toast.error("Failed to delete contact");
    }
  };

  const handleAddTask = async () => {
    if (!contactId || !newTaskText.trim()) return;
    try {
      await createTask.mutateAsync({ contactId, text: newTaskText.trim() });
      setNewTaskText("");
    } catch {
      toast.error("Failed to create task");
    }
  };

  if (isPending) {
    return (
      <div className="p-4 space-y-4">
        <div className="h-6 w-32 rounded bg-muted animate-pulse" />
        <div className="h-24 rounded-lg bg-muted animate-pulse" />
      </div>
    );
  }

  if (isError || !contact) {
    return <div className="p-8 text-center text-destructive">Contact not found.</div>;
  }

  return (
    <>
      <div className="flex h-full flex-col overflow-auto p-4">
        {/* Back */}
        <button
          className="mb-3 flex items-center gap-1 text-[13px] text-muted-foreground hover:text-foreground transition-colors w-fit"
          onClick={() => navigate(ROUTES.CRM_CONTACTS)}
        >
          <ArrowLeft className="size-3.5" />
          Contacts
        </button>

        {/* Header */}
        <div className="flex items-start justify-between gap-4 mb-4">
          <div className="flex items-center gap-3 min-w-0">
            <Avatar src={contact.avatar?.src} name={displayName} />
            <div className="min-w-0">
              <div className="flex flex-wrap items-baseline gap-1.5">
                <InlineTextField
                  value={contact.firstName}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { firstName: v || null } })}
                  isSaving={updateContact.isPending}
                  className="min-h-0 rounded px-1 py-0 text-lg font-semibold hover:bg-muted/50"
                />
                <InlineTextField
                  value={contact.lastName}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { lastName: v || null } })}
                  isSaving={updateContact.isPending}
                  className="min-h-0 rounded px-1 py-0 text-lg font-semibold hover:bg-muted/50"
                />
              </div>
              <div className="mt-0.5 flex flex-wrap items-center gap-2 text-[12px] text-muted-foreground">
                {contact.title && <span>{contact.title}</span>}
                {contact.title && company && <span>·</span>}
                {company && (
                  <button className="hover:underline text-foreground" onClick={() => navigate(`/companies/${company.id}`)}>
                    {company.name}
                  </button>
                )}
                {contact.status && <ContactStatusBadge status={contact.status} />}
              </div>
            </div>
          </div>
          <div className="flex items-center gap-1.5 shrink-0">
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[13px]" onClick={() => setEditOpen(true)}>
              <Pencil className="size-3" />
              Edit
            </Button>
            <Button variant="ghost" size="sm" className="h-7 gap-1 text-[13px] text-destructive hover:text-destructive" onClick={() => setConfirmDeleteOpen(true)}>
              <Trash2 className="size-3" />
              Delete
            </Button>
          </div>
        </div>

        <div className="h-px bg-border mb-4" />

        {/* Body: two columns */}
        <div className="grid flex-1 grid-cols-1 gap-6 lg:grid-cols-[260px_1fr]">
          {/* Fields */}
          <div className="divide-y divide-border/50">
            <FieldRow
              label="First name"
              value={
                <InlineTextField
                  value={contact.firstName}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { firstName: v || null } })}
                  isSaving={updateContact.isPending}
                />
              }
            />
            <FieldRow
              label="Last name"
              value={
                <InlineTextField
                  value={contact.lastName}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { lastName: v || null } })}
                  isSaving={updateContact.isPending}
                />
              }
            />
            <FieldRow
              label="Email"
              value={
                <InlineTextField
                  value={contact.email}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { email: v || null } })}
                  isSaving={updateContact.isPending}
                />
              }
            />
            {(contact.phoneJsonb ?? []).map((p, i) => (
              <FieldRow key={i} label={i === 0 ? "Phone" : ""} value={`${p.number} (${p.type})`} />
            ))}
            <FieldRow
              label="Title"
              value={
                <InlineTextField
                  value={contact.title}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { title: v || null } })}
                  isSaving={updateContact.isPending}
                />
              }
            />
            <FieldRow
              label="Status"
              value={
                <InlineSelectField
                  value={contact.status}
                  options={CONTACT_STATUS_OPTIONS}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { status: v || null } })}
                  isSaving={updateContact.isPending}
                />
              }
            />
            <FieldRow
              label="LinkedIn"
              value={
                <InlineTextField
                  value={contact.linkedinUrl}
                  onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { linkedinUrl: v || null } })}
                  isSaving={updateContact.isPending}
                />
              }
            />
            <FieldRow label="First seen" value={contact.firstSeen ? new Date(contact.firstSeen).toLocaleDateString() : null} />
            <FieldRow label="Last seen" value={contact.lastSeen ? new Date(contact.lastSeen).toLocaleDateString() : null} />
            <div className="py-1.5">
              <p className="text-[12px] text-muted-foreground mb-1">Background</p>
              <InlineTextareaField
                value={contact.background}
                onSave={async (v) => updateContact.mutateAsync({ id: contactId!, data: { background: v || null } })}
                isSaving={updateContact.isPending}
                rows={3}
              />
            </div>
            {contact.customFields && Object.keys(contact.customFields).length > 0 && (
              <>
                <p className="text-[11px] font-medium uppercase tracking-wider text-muted-foreground/70 py-2">Custom Fields</p>
                {Object.entries(contact.customFields).map(([k, v]) => (
                  <FieldRow key={k} label={k} value={String(v ?? "")} />
                ))}
              </>
            )}
          </div>

          {/* Tabs */}
          <Tabs defaultValue="notes">
            <TabsList className="h-8 gap-0 rounded-none border-b border-border bg-transparent p-0">
              <TabsTrigger value="notes" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[12px] font-medium data-[state=active]:border-primary data-[state=active]:shadow-none">
                Notes {notes.length > 0 && `(${notes.length})`}
              </TabsTrigger>
              <TabsTrigger value="activity" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[12px] font-medium data-[state=active]:border-primary data-[state=active]:shadow-none">
                Activity
              </TabsTrigger>
              <TabsTrigger value="tasks" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[12px] font-medium data-[state=active]:border-primary data-[state=active]:shadow-none">
                Tasks {contactTasks.length > 0 && `(${contactTasks.length})`}
              </TabsTrigger>
              <TabsTrigger value="deals" className="h-8 rounded-none border-b-2 border-transparent px-3 text-[12px] font-medium data-[state=active]:border-primary data-[state=active]:shadow-none">
                Deals {contactDeals.length > 0 && `(${contactDeals.length})`}
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="mt-3">
              <NotesFeed
                notes={notes}
                isLoading={notesPending}
                onAdd={async (text) => { await createNote.mutateAsync({ contactId: contactId!, text }); }}
                onDelete={(noteId) => deleteNote.mutate({ id: noteId, contactId: contactId! })}
              />
            </TabsContent>

            <TabsContent value="activity" className="mt-3">
              {(() => {
                const activity = [
                  ...notes.map((n) => ({ type: "note" as const, id: n.id, date: n.date, text: n.text, done: false })),
                  ...contactTasks.map((t) => ({
                    type: "task" as const,
                    id: t.id,
                    date: t.dueDate ?? t.doneDate ?? t.id.toString(),
                    text: t.text ?? "",
                    done: !!t.doneDate,
                  })),
                ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
                if (activity.length === 0) {
                  return <p className="py-4 text-center text-[13px] text-muted-foreground">No activity yet.</p>;
                }
                return (
                  <div className="space-y-1.5">
                    {activity.map((item) =>
                      item.type === "note" ? (
                        <div key={`note-${item.id}`} className="flex gap-2 rounded-md border border-border/50 p-2.5 text-[13px]">
                          <FileText className="size-3.5 shrink-0 text-muted-foreground mt-0.5" />
                          <div className="min-w-0 flex-1">
                            <p className="whitespace-pre-wrap leading-relaxed">{item.text}</p>
                            <time className="text-[11px] text-muted-foreground">{new Date(item.date).toLocaleString()}</time>
                          </div>
                        </div>
                      ) : (
                        <div key={`task-${item.id}`} className="flex gap-2 rounded-md border border-border/50 p-2.5 text-[13px]">
                          <CheckSquare className={`size-3.5 shrink-0 mt-0.5 ${item.done ? "text-primary" : "text-muted-foreground"}`} />
                          <div className="min-w-0 flex-1">
                            <p className={item.done ? "line-through text-muted-foreground" : ""}>{item.text}</p>
                            <time className="text-[11px] text-muted-foreground">{new Date(item.date).toLocaleString()}</time>
                          </div>
                        </div>
                      )
                    )}
                  </div>
                );
              })()}
            </TabsContent>

            <TabsContent value="tasks" className="mt-3 space-y-3">
              <div className="flex gap-2">
                <Input
                  placeholder="New task…"
                  value={newTaskText}
                  onChange={(e) => setNewTaskText(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddTask()}
                  className="h-8 text-[13px]"
                />
                <Button size="sm" className="h-8 text-[13px]" onClick={handleAddTask} disabled={!newTaskText.trim()}>
                  Add
                </Button>
              </div>
              {contactTasks.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted-foreground">No tasks.</p>
              ) : (
                <div className="space-y-1">
                  {contactTasks.map((t) => (
                    <div key={t.id} className="flex items-center gap-2 rounded-md border border-border/50 px-2.5 py-2 text-[13px]">
                      <button onClick={() => markDone.mutate({ id: t.id, done: !t.doneDate })} className="shrink-0">
                        <CheckSquare className={`size-3.5 ${t.doneDate ? "text-primary" : "text-muted-foreground"}`} />
                      </button>
                      <span className={`flex-1 ${t.doneDate ? "line-through text-muted-foreground" : ""}`}>
                        {t.text}
                      </span>
                      {t.dueDate && (
                        <span className="text-[11px] text-muted-foreground">{new Date(t.dueDate).toLocaleDateString()}</span>
                      )}
                      <Button variant="ghost" size="icon" className="size-6 text-muted-foreground hover:text-destructive" onClick={() => deleteTask.mutate(t.id)}>
                        <Trash2 className="size-3" />
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </TabsContent>

            <TabsContent value="deals" className="mt-3">
              {contactDeals.length === 0 ? (
                <p className="py-4 text-center text-[13px] text-muted-foreground">No deals linked.</p>
              ) : (
                <div className="space-y-1">
                  {contactDeals.map((d) => (
                    <button
                      key={d.id}
                      className="w-full text-left rounded-md border border-border/50 p-2.5 hover:bg-muted/50 transition-colors"
                      onClick={() => navigate(`/deals/${d.id}`)}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[13px] font-medium">{d.name}</span>
                        <DealStageBadge stage={d.stage} />
                      </div>
                      {d.amount != null && (
                        <p className="mt-0.5 text-[11px] text-muted-foreground tabular-nums">
                          {new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(d.amount)}
                        </p>
                      )}
                    </button>
                  ))}
                </div>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>

      <ContactSheet open={editOpen} onOpenChange={setEditOpen} contact={contact} />

      <Dialog open={confirmDeleteOpen} onOpenChange={setConfirmDeleteOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Delete {displayName}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. All tasks and notes linked to this contact will also be removed.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setConfirmDeleteOpen(false)}>Cancel</Button>
            <Button variant="destructive" size="sm" onClick={handleDelete} disabled={deleteContact.isPending}>
              {deleteContact.isPending ? "Deleting…" : "Delete"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
