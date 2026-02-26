import { Slot } from "@radix-ui/react-slot";
import { cn } from "@/lib/utils";
import type { ComponentPropsWithoutRef, ReactNode } from "react";
import { forwardRef } from "react";

export const tableToolbarOptionClasses =
  "inline-flex items-center gap-1.5 h-6 px-2 rounded-md text-xs font-medium text-muted-foreground hover:text-foreground hover:bg-muted/50 transition-colors shrink-0 [&_svg]:size-3.5 [&_svg]:shrink-0";

export interface TableToolbarOptionProps
  extends Omit<ComponentPropsWithoutRef<"button">, "children"> {
  asChild?: boolean;
  icon?: ReactNode;
  children?: ReactNode;
}

/**
 * Pill-shaped button for the CRM table toolbar. Use for Sort, Filter, Import, Export, Create.
 * Consistent compact style that blends with the table header.
 */
export const TableToolbarOption = forwardRef<
  HTMLButtonElement,
  TableToolbarOptionProps
>(function TableToolbarOption(
  { asChild, icon, children, className, ...props },
  ref
) {
  const Comp = asChild ? Slot : "button";
  return (
    <Comp
      ref={ref}
      className={cn(tableToolbarOptionClasses, className)}
      {...props}
    >
      {asChild ? children : (
        <>
          {icon}
          {children != null && <span>{children}</span>}
        </>
      )}
    </Comp>
  );
});
