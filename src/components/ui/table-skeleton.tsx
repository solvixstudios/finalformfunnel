import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";

interface TableSkeletonProps {
    columns?: number;
    rows?: number;
    className?: string;
}

export function TableSkeleton({ columns = 5, rows = 5, className }: TableSkeletonProps) {
    return (
        <div className={cn("w-full bg-white rounded-2xl border border-slate-200/60 overflow-hidden shadow-sm", className)}>
            {/* Table Header Wrapper */}
            <div className="bg-slate-50/50 border-b border-slate-100 flex items-center h-12 px-6 gap-4">
                {Array.from({ length: columns }).map((_, i) => (
                    <div key={`header-${i}`} className={cn("flex-1", i === 0 && "flex-[2]")}>
                        <Skeleton className="h-4 w-24 rounded-md" />
                    </div>
                ))}
            </div>

            {/* Table Body */}
            <div className="flex flex-col">
                {Array.from({ length: rows }).map((_, rowIndex) => (
                    <div
                        key={`row-${rowIndex}`}
                        className="flex items-center h-[72px] px-6 gap-4 border-b border-slate-50 last:border-0"
                    >
                        {Array.from({ length: columns }).map((_, colIndex) => (
                            <div key={`cell-${rowIndex}-${colIndex}`} className={cn("flex-1", colIndex === 0 && "flex-[2]")}>
                                {colIndex === 0 ? (
                                    // Simulate the main column (e.g. bold text + subtitle)
                                    <div className="space-y-2">
                                        <Skeleton className="h-4 w-3/4 rounded-md bg-slate-200" />
                                        <Skeleton className="h-3 w-1/2 rounded-md bg-slate-100" />
                                    </div>
                                ) : colIndex === columns - 1 ? (
                                    // Simulate an action button or small badge
                                    <Skeleton className="h-8 w-16 rounded-full ml-auto" />
                                ) : (
                                    // Simulate regular cell data
                                    <Skeleton className="h-4 w-1/2 rounded-md" />
                                )}
                            </div>
                        ))}
                    </div>
                ))}
            </div>
        </div>
    );
}
