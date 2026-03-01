import { useState, useEffect, useCallback } from "react";

const STORAGE_KEY = "crm:recent";
const MAX_ITEMS = 6;

export interface RecentItem {
  type: "contact" | "company" | "deal";
  id: number;
  name: string;
  visitedAt: number;
}

function loadRecentItems(): RecentItem[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return parsed.filter(
      (x): x is RecentItem =>
        typeof x === "object" &&
        x !== null &&
        (x as RecentItem).type !== undefined &&
        typeof (x as RecentItem).id === "number" &&
        typeof (x as RecentItem).name === "string" &&
        typeof (x as RecentItem).visitedAt === "number"
    );
  } catch {
    return [];
  }
}

function saveRecentItems(items: RecentItem[]) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  } catch {
    // ignore
  }
}

export function useRecentItems(): [RecentItem[], (item: RecentItem) => void] {
  const [items, setItems] = useState<RecentItem[]>([]);

  useEffect(() => {
    setItems(loadRecentItems());
  }, []);

  const addRecentItem = useCallback((item: RecentItem) => {
    setItems((prev) => {
      const next = [
        { ...item, visitedAt: Date.now() },
        ...prev.filter((x) => !(x.type === item.type && x.id === item.id)),
      ].slice(0, MAX_ITEMS);
      saveRecentItems(next);
      return next;
    });
  }, []);

  return [items, addRecentItem];
}
