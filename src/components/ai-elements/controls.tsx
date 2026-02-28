"use client";

import { useReactFlow } from "@xyflow/react";
import { Maximize2, ZoomIn, ZoomOut } from "lucide-react";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { ButtonGroup } from "@/components/ui/button-group";
import { Panel } from "@/components/ai-elements/panel";

/** Matches Vercel workflow-builder-template Controls (zoom in/out, fit view) */
export const WorkflowControls = () => {
  const { zoomIn, zoomOut, fitView } = useReactFlow();
  const [, setShowMinimap] = useState(false);

  return (
    <Panel
      className="workflow-controls-panel border-none bg-transparent p-0"
      position="bottom-left"
    >
      <ButtonGroup orientation="vertical">
        <Button
          className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
          onClick={() => zoomIn()}
          size="icon"
          title="Zoom in"
          variant="secondary"
        >
          <ZoomIn className="size-4" />
        </Button>
        <Button
          className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
          onClick={() => zoomOut()}
          size="icon"
          title="Zoom out"
          variant="secondary"
        >
          <ZoomOut className="size-4" />
        </Button>
        <Button
          className="border hover:bg-black/5 disabled:opacity-100 dark:hover:bg-white/5 disabled:[&>svg]:text-muted-foreground"
          onClick={() => fitView({ padding: 0.2, duration: 300 })}
          size="icon"
          title="Fit view"
          variant="secondary"
        >
          <Maximize2 className="size-4" />
        </Button>
      </ButtonGroup>
    </Panel>
  );
};
