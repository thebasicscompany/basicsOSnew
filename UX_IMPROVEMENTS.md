# UX & Quality of Life Improvements

Audit of the live codebase. Issues are grouped by theme, ordered within each group by severity.

---

## 1. Loading States

**Problem:** ContactsPage, CompaniesPage, DealsPage all render an empty table while data loads (`data={isPending ? [] : data}`). Users see a blank table with no feedback.

**Fix:** Replace with skeleton rows using `animate-pulse`, following the pattern already in `AutomationListPage` (lines 132–141).

**Good pattern to copy:**
```tsx
// AutomationListPage skeleton rows
{[...Array(3)].map((_, i) => (
  <div key={i} className="animate-pulse h-14 rounded-lg bg-muted" />
))}
```

**Affected files:**
- `src/components/pages/ContactsPage.tsx`
- `src/components/pages/CompaniesPage.tsx`
- `src/components/pages/DealsPage.tsx`

---

## 2. Empty States

**Problem:** When no data exists, Contacts/Companies/Deals show a blank table with "No results." in the footer. There's no guidance or call-to-action for new users.

**Fix:** Detect empty + not-loading and show a centred empty state with icon, message, and primary action button.

**Good pattern to copy:** `AutomationListPage` lines 101–115 (icon, heading, description, "Create your first automation" button).

**Affected files:**
- `src/components/pages/ContactsPage.tsx`
- `src/components/pages/CompaniesPage.tsx`
- `src/components/pages/DealsPage.tsx`
- `src/components/pages/TasksPage.tsx` — already has "No upcoming tasks." but no CTA

---

## 3. Confirmation Dialogs — Replace `confirm()`

**Problem:** Three sheets use `window.confirm()` for destructive deletes. It's unstyled, blocks the UI thread, and can't be themed. Task deletion has no confirmation at all.

| Location | Current | Risk |
|---|---|---|
| `ContactSheet` line 80 | `if (!confirm("Delete this contact?"))` | Low (has confirm) |
| `CompanySheet` line 81 | `if (!confirm("Delete this company?"))` | Low (has confirm) |
| `DealSheet` line 91 | `if (!confirm("Delete this deal?"))` | Low (has confirm) |
| `TasksPage` TaskRow | No confirmation — instant delete | **High (no confirm)** |
| `AutomationListPage` line 187 | `if (confirm(...))` | Low (has confirm) |

**Fix:** Replace all `confirm()` calls with an `AlertDialog` (shadcn). Add a confirmation step to TaskRow before delete.

**Good pattern to copy:** `SettingsPage` "Clear API key" dialog — uses `Dialog` with title, description, and Cancel/Confirm buttons.

---

## 4. Cache Invalidation Bugs (Stale Data)

**Problem:** After mutations, related query caches are not invalidated. Data shown elsewhere becomes stale until a page refresh.

| Mutation | Missing invalidation | Symptom |
|---|---|---|
| Delete contact | `companies` (nbContacts) | Company list still shows old contact count |
| Delete company | `contacts_summary` | Contacts still show old company name |
| Update contact | `companies` | Company's contact count stale |
| Update deal | `contacts_summary` | Contact linked to deal shows stale data |
| Create task | `contacts` (full record) | Contact detail shows stale task count |
| Delete task | `contacts` (full record) | Contact detail shows stale task count |

**Fix:** In each `useMutation` `onSuccess`, invalidate all related query keys. Example for `useDeleteContact`:
```ts
onSuccess: () => {
  queryClient.invalidateQueries({ queryKey: ["contacts"] });
  queryClient.invalidateQueries({ queryKey: ["contacts_summary"] });
  queryClient.invalidateQueries({ queryKey: ["companies"] }); // ← add this
  queryClient.invalidateQueries({ queryKey: ["tasks"] });     // ← add this
},
```

**Affected files:**
- `src/hooks/use-contacts.ts`
- `src/hooks/use-companies.ts`
- `src/hooks/use-deals.ts`
- `src/hooks/use-tasks.ts`

---

## 5. Over-fetching / Pagination

**Problem:** Lists load large fixed page sizes that don't match the UI's display limit. Most of the fetched data is never displayed.

| Hook | Fetches | Displays | Waste |
|---|---|---|---|
| `useContacts` | 100 | 25 (DataTable default) | 75 records |
| `useCompanies` | 100 | 25 | 75 records |
| `useDeals` | 100 | 25 | 75 records |
| `useTasks` | 500 | All (visible by bucket) | Fine for now, but will break at scale |
| `useContacts` in TaskAddDialog | 500 | 20 (sliced) | 480 contacts fetched, 20 shown |

**Fix (short term):** Match fetch limit to display limit (25). For TaskAddDialog contact search, fetch on-demand as the user types rather than loading 500 upfront.

**Fix (long term):** Implement server-side pagination — pass `page` and `perPage` from DataTable's pagination state to the API query.

---

## 6. Task Search

**Problem:** TasksPage has no search. With many tasks spread across time buckets, finding a specific task requires scrolling through every bucket.

**Fix:** Add a search input above the bucket list that filters `activeTasks` by `task.text` and `contactName`.

```tsx
const [search, setSearch] = useState("");
const filteredTasks = activeTasks.filter(t =>
  !search || t.text?.toLowerCase().includes(search.toLowerCase())
);
```

---

## 7. Contact Search Dropdown UX (TaskAddDialog)

**Problem:** The contact picker in "Add Task" requires typing to see contacts. There's no keyboard navigation in the dropdown (no arrow keys, no Enter-to-select). Clearing the typed text also clears the selected contactId, so mistyping loses selection.

**Fix options:**
- Use a `<Command>` (shadcn cmdk) component for the dropdown — it has built-in keyboard nav
- Or use a `<Select>` with a search input inside (shadcn has this pattern via `Combobox`)

---

## 8. Form Keyboard Submit (Enter Key)

**Problem:** No modal or sheet form submits on `Enter`. Users must click the Save/Create button.

**Fix:** Wrap form content in `<form onSubmit={handleSubmit}>` and change the primary button to `type="submit"`. Works automatically for all inputs.

**Affected:**
- `TasksPage` AddTaskDialog
- `ContactSheet`, `CompanySheet`, `DealSheet` (save handlers)

---

## 9. Predefined Option Fields

**Problem:** Several fields are free-text inputs where consistency matters. Users type whatever they want, resulting in status values like "warm", "Warm", "WARM" in the same dataset.

| Field | Current | Fix |
|---|---|---|
| Contact `status` | Text input, placeholder "e.g. warm, cold, hot" | Select with predefined options |
| Company `sector` | Text input | Select or Combobox with common sectors |
| Deal `amount` | Number input, no currency symbol | Prefix with "$" or currency select |

---

## 10. Automation Builder: Cron Help Text

**Problem:** The schedule trigger's cron field is a bare text input. Users unfamiliar with cron syntax have no guidance.

```tsx
// Current — AutomationBuilderPage ~line 445
<Input placeholder="0 9 * * 1" ... />
```

**Fix:** Add a help text row below the input:
```tsx
<p className="text-xs text-muted-foreground">
  Runs on a schedule. Example: <code>0 9 * * 1</code> = every Monday at 9am.{" "}
  <a href="https://crontab.guru" target="_blank" rel="noreferrer" className="underline">
    crontab.guru
  </a>
</p>
```

---

## 11. Automation Builder: "Available Variables" Inconsistency

**Problem:** The `{{variable}}` hint is only shown on some node config panels (AI, web search, Slack, etc.) but not on the trigger_schedule or action_crm panels. Users don't know what variables are available.

**Fix:** Show the variables hint consistently on every action node panel. Extract it into a shared `<VariablesHint context={context} />` component and render it in every node's config.

---

## 12. Import Page — Placeholder State

**Problem:** `ImportPage` renders only `"Import migration in progress."` — a placeholder string. Users who click Import expecting functionality are confused.

**Fix (short term):** Either implement the import UI or hide the Import nav item until it's ready. Showing a broken/placeholder page is worse than not showing it.

---

## 13. ProfilePage Error State

**Problem:** If `useMe()` fails, `ProfilePage` renders nothing — no error message, no retry. The page is silently blank.

**Fix:**
```tsx
if (isError) return (
  <div className="text-sm text-destructive">Failed to load profile. <Button variant="link" onClick={() => refetch()}>Retry</Button></div>
);
```

---

## 14. Sheet Mutation Error Handling

**Problem:** All three sheets (Contact, Company, Deal) close on save and then show a toast if it fails. The sheet is already gone by the time the user reads the error — they can't retry without reopening.

**Fix:** Only close the sheet on `onSuccess`. On `onError`, keep it open and show the toast:
```ts
mutateAsync(payload)
  .then(() => onOpenChange(false))
  .catch(() => toast.error("Failed to save"));
```

---

## 15. Minor / Low Effort

| Issue | File | Fix |
|---|---|---|
| Task due date defaults to today — if it's 11pm, tomorrow makes more sense | `TasksPage` line 156 | Default to empty or next day |
| Automation node delete has no visual feedback | `AutomationBuilderPage` | Toast "Node removed" on delete |
| "Column visibility" button has no tooltip | `data-table.tsx` line 89 | Add `title="Manage columns"` or shadcn `Tooltip` |
| DataTable "No results." text is small and plain | `data-table.tsx` line 127 | Add icon + larger text to match empty state design |
| Task type options are hardcoded | `TasksPage` lines 239–250 | Pull from config or at least a shared constant |
| Automation "enabled" toggle has no loading state | `AutomationListPage` | Show spinner on toggle while patch is in-flight |
| Delete contact/deal/company text is generic | All sheets | Use record name: "Delete John Smith? This cannot be undone." |

---

## Priority Order

| # | Item | Effort | Impact |
|---|---|---|---|
| 1 | Confirmation dialog for task delete | Low | High — data loss risk |
| 2 | Replace `confirm()` with AlertDialog in sheets | Low | Medium — polish |
| 3 | Skeleton loading states | Low | High — perceived performance |
| 4 | Cache invalidation fixes | Medium | High — data correctness |
| 5 | Empty states with CTAs | Low | Medium — onboarding |
| 6 | Sheet mutation error handling (don't close on error) | Low | Medium |
| 7 | Task search | Low | Medium |
| 8 | Cron help text + variables hint consistency | Low | Medium |
| 9 | ProfilePage error/retry state | Low | Low |
| 10 | Form keyboard submit (Enter) | Low | Low |
| 11 | Contact search Combobox | Medium | Medium |
| 12 | Predefined status/sector selects | Medium | Medium — data quality |
| 13 | Fix ImportPage placeholder | Low | High — avoids confusion |
| 14 | Pagination / over-fetching | High | Medium — performance at scale |
