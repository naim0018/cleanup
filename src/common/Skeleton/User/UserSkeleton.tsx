import Skeleton from "@/common/Skeleton";

// User-specific layout placeholder (Profile-ish)
export const UserSkeleton = () => (
  <div className="p-8 max-w-4xl mx-auto space-y-8 animate-pulse">
    <div className="flex items-center space-x-6">
      <Skeleton className="h-24 w-24 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-4 w-32" />
      </div>
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
      <Skeleton className="h-20 w-full" />
    </div>
    <Skeleton className="h-64 w-full" />
  </div>
);