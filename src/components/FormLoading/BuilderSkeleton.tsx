import { Skeleton } from "@/components/ui/skeleton";

export const BuilderSkeleton = () => {
    return (
        <div className="max-w-full mx-auto w-full flex overflow-hidden bg-white border-t border-slate-200 h-full">
            {/* LEFT: Sidebar Skeleton */}
            <div className="flex-1 flex flex-col min-w-0 bg-white border-r">
                {/* Navigation Header Skeleton */}
                <div className="h-16 border-b px-4 flex items-center justify-between">
                    <Skeleton className="h-8 w-32" />
                </div>

                {/* Content Skeleton */}
                <div className="flex-1 p-6 space-y-6">
                    <Skeleton className="h-12 w-full rounded-lg" />
                    <div className="space-y-4">
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                        <Skeleton className="h-24 w-full rounded-lg" />
                    </div>
                </div>
            </div>

            {/* RIGHT: Preview Skeleton */}
            <div className="shrink-0 bg-slate-50 flex items-center justify-center p-8 overflow-hidden w-[480px]">
                <div className="w-full h-full bg-white rounded-[2.5rem] shadow-sm border-[8px] border-slate-200 overflow-hidden relative flex flex-col">
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-32 h-6 bg-slate-200 rounded-b-2xl z-50"></div>
                    <div className="flex-1 p-4 space-y-4 mt-8">
                        <Skeleton className="h-12 w-full" />
                        <Skeleton className="h-40 w-full" />
                        <Skeleton className="h-20 w-full" />
                        <Skeleton className="h-12 w-full" />
                    </div>
                </div>
            </div>
        </div>
    );
};
