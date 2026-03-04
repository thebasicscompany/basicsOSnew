import { createContext } from "react";

export interface PageHeaderCtx {
  title: string;
  setTitle: (t: string) => void;
  actionsContainer: HTMLElement | null;
  setActionsContainer: (el: HTMLElement | null) => void;
  breadcrumbContainer: HTMLElement | null;
  setBreadcrumbContainer: (el: HTMLElement | null) => void;
  titleSlotInUse: boolean;
  setTitleSlotInUse: (v: boolean) => void;
  titleSlotContainer: HTMLElement | null;
  setTitleSlotContainer: (el: HTMLElement | null) => void;
}

export const PageHeaderContext = createContext<PageHeaderCtx>({
  title: "",
  setTitle: () => {},
  actionsContainer: null,
  setActionsContainer: () => {},
  breadcrumbContainer: null,
  setBreadcrumbContainer: () => {},
  titleSlotInUse: false,
  setTitleSlotInUse: () => {},
  titleSlotContainer: null,
  setTitleSlotContainer: () => {},
});
