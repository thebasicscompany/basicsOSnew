import { HugeiconsIcon } from "@hugeicons/react";
import { AiChat01Icon } from "@hugeicons/core-free-icons";
import { Button } from "@/components/ui/button";
import { AssistantChatDrawer } from "./AssistantChatDrawer";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export function AssistantChatButton() {
  const isMobile = useIsMobile();
  return (
    <AssistantChatDrawer
      trigger={
        <Button
          size="icon"
          className={cn(
            "fixed right-6 z-50 size-14 rounded-full shadow-lg",
            isMobile ? "bottom-20" : "bottom-6"
          )}
          aria-label="Open AI Assistant"
        >
          <HugeiconsIcon icon={AiChat01Icon} className="size-6" />
        </Button>
      }
    />
  );
}
