import type { ConnectionLineComponent } from "@xyflow/react";

const HALF = 0.5;

/** Matches Vercel workflow-builder-template Connection line */
export const WorkflowConnection: ConnectionLineComponent = ({
  fromX,
  fromY,
  toX,
  toY,
}) => (
  <g>
    <path
      d={`M${fromX},${fromY} C ${fromX + (toX - fromX) * HALF},${fromY} ${fromX + (toX - fromX) * HALF},${toY} ${toX},${toY}`}
      fill="none"
      stroke="var(--ring)"
      strokeWidth={1}
    />
    <circle
      cx={toX}
      cy={toY}
      fill="var(--background)"
      r={3}
      stroke="var(--ring)"
      strokeWidth={1}
    />
  </g>
);
