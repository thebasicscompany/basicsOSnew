import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";

export function DetailSkeleton() {
  return (
    <div className="space-y-6">
      <Skeleton className="h-6 w-48" />
      <div className="flex items-center gap-4">
        <Skeleton className="h-16 w-16 rounded-full" />
        <div className="space-y-2">
          <Skeleton className="h-7 w-56" />
          <Skeleton className="h-4 w-36" />
        </div>
      </div>
      <Separator />
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="space-y-3">
          <Skeleton className="h-9 w-72" />
          <Skeleton className="h-64 w-full" />
        </div>
        <div className="space-y-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Skeleton key={i} className="h-8 w-full" />
          ))}
        </div>
      </div>
    </div>
  );
}
