import { useState, type ReactNode } from "react";
import { PageHeaderContext } from "./page-header-context";

export function PageHeaderProvider({ children }: { children: ReactNode }) {
  const [title, setTitle] = useState("");
  const [actionsContainer, setActionsContainer] = useState<HTMLElement | null>(
    null,
  );
  const [breadcrumbContainer, setBreadcrumbContainer] =
    useState<HTMLElement | null>(null);
  const [titleSlotInUse, setTitleSlotInUse] = useState(false);
  const [titleSlotContainer, setTitleSlotContainer] =
    useState<HTMLElement | null>(null);
  return (
    <PageHeaderContext.Provider
      value={{
        title,
        setTitle,
        actionsContainer,
        setActionsContainer,
        breadcrumbContainer,
        setBreadcrumbContainer,
        titleSlotInUse,
        setTitleSlotInUse,
        titleSlotContainer,
        setTitleSlotContainer,
      }}
    >
      {children}
    </PageHeaderContext.Provider>
  );
}
