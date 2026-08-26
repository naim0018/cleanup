import Skeleton from "@/common/Skeleton";

// Admin-specific layout placeholder
export const AdminSkeleton = () => (
  <div className="p-6 space-y-6 animate-pulse">
    <div className="flex justify-between items-center mb-8">
      <Skeleton className="h-10 w-64" />
      <Skeleton className="h-10 w-32" />
    </div>
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
      <Skeleton className="h-32 w-full" />
    </div>
    <div className="space-y-4">
      <Skeleton className="h-[400px] w-full" />
    </div>
  </div>
);