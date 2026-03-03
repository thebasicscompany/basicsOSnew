import { SectionCards } from "@/components/dashboard/section-cards";
import { ChartAreaInteractive } from "@/components/dashboard/chart-area-interactive";

export function DashboardPage() {
  return (
    <div className="flex h-full flex-col overflow-auto p-4">
      <h1 className="mb-4 text-lg font-semibold">Dashboard</h1>
      <SectionCards />
      <div className="mt-4">
        <ChartAreaInteractive />
      </div>
    </div>
  );
}
