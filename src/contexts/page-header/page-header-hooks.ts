import { createPortal } from "react-dom";
import { useContext, useLayoutEffect, type ReactNode } from "react";
import { PageHeaderContext } from "./page-header-context";

/**
 * Call this at the top of any page component to register a title in the
 * layout's sticky header. Uses useLayoutEffect so the title is painted on
 * the first frame (no visible flash).
 */
export function usePageTitle(title: string) {
  const { setTitle } = useContext(PageHeaderContext);
  useLayoutEffect(() => {
    setTitle(title);
    return () => setTitle("");
  }, [title, setTitle]);
}

export function usePageHeaderTitle() {
  return useContext(PageHeaderContext).title;
}

/**
 * Returns a portal ReactNode that renders `actions` into the layout header's
 * action slot. Render the returned node anywhere in the page component's JSX.
 */
export function usePageHeaderActions(actions: ReactNode): ReactNode {
  const { actionsContainer } = useContext(PageHeaderContext);
  if (!actionsContainer) return null;
  return createPortal(actions, actionsContainer);
}

export function useRegisterActionsContainer(): (
  el: HTMLElement | null,
) => void {
  return useContext(PageHeaderContext).setActionsContainer;
}

export function usePageHeaderBreadcrumb(breadcrumb: ReactNode): ReactNode {
  const { breadcrumbContainer } = useContext(PageHeaderContext);
  if (!breadcrumbContainer) return null;
  return createPortal(breadcrumb, breadcrumbContainer);
}

export function useRegisterBreadcrumbContainer(): (
  el: HTMLElement | null,
) => void {
  return useContext(PageHeaderContext).setBreadcrumbContainer;
}

export function useRegisterTitleSlotContainer(): (
  el: HTMLElement | null,
) => void {
  return useContext(PageHeaderContext).setTitleSlotContainer;
}

export function usePageHeaderTitleSlot(content: ReactNode): ReactNode {
  const { titleSlotContainer, setTitleSlotInUse } =
    useContext(PageHeaderContext);
  useLayoutEffect(() => {
    setTitleSlotInUse(true);
    return () => setTitleSlotInUse(false);
  }, [setTitleSlotInUse]);
  if (!titleSlotContainer) return null;
  return createPortal(content, titleSlotContainer);
}

export function useTitleSlotInUse(): boolean {
  return useContext(PageHeaderContext).titleSlotInUse;
}
