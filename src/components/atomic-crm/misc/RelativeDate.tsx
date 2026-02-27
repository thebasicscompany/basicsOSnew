import { differenceInDays, formatRelative } from "date-fns";

export function RelativeDate({ date }: { date?: string | null }) {
  if (date == null || date === "") return <span>—</span>;
  const dateObj = new Date(date);
  if (Number.isNaN(dateObj.getTime())) return <span>—</span>;

  const now = new Date();
  if (differenceInDays(now, dateObj) > 6) {
    return <span>{dateObj.toLocaleDateString()}</span>;
  }

  return <span>{formatRelative(dateObj, now)}</span>;
}
