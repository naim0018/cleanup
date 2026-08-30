
const Skeleton = ({ className = "" }: { className?: string }) => {
  return (
    <div
      className={`animate-pulse bg-gray-200 dark:bg-gray-700 rounded-md ${className}`}
    />
  );
};

export const PageSkeleton = () => {
  return (
    <div className="p-6 space-y-6 w-full h-full">
      {/* Header Skeleton */}
      <div className="flex justify-between items-center">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-10 w-32" />
      </div>

      {/* Stats Cards Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-32 w-full" />
        ))}
      </div>

      {/* Main Content Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <Skeleton className="lg:col-span-2 h-[400px] w-full" />
        <Skeleton className="h-[400px] w-full" />
      </div>

      {/* Table/List Skeleton */}
      <div className="space-y-4">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 w-full" />
        ))}
      </div>
    </div>
  );
};







export const LoginSkeleton = () => {
  return (
    <div className="min-h-screen flex items-center justify-center bg-layout-bg p-4">
      <div className="w-full max-w-xl surface shadow-all rounded-3xl p-8 space-y-6 animate-pulse">
        <div className="flex justify-center mb-6">
          <div className="w-16 h-16 rounded-2xl bg-slate-200 dark:bg-slate-800 animate-pulse"></div>
        </div>
        <div className="space-y-3">
          <div className="h-7 bg-slate-200 dark:bg-slate-800 rounded-lg w-2/3 mx-auto"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-5/6 mx-auto"></div>
          <div className="h-4 bg-slate-200 dark:bg-slate-800 rounded-lg w-4/5 mx-auto"></div>
        </div>
        <div className="grid grid-cols-2 gap-4 pt-4">
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
          <div className="h-28 bg-slate-200 dark:bg-slate-800 rounded-2xl"></div>
        </div>
        <div className="h-12 bg-slate-200 dark:bg-slate-800 rounded-xl w-full pt-4"></div>
      </div>
    </div>
  );
};

export default Skeleton;
