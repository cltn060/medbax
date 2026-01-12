import { cn } from "@/lib/utils";

interface SkeletonProps {
    className?: string;
}

export function Skeleton({ className }: SkeletonProps) {
    return (
        <div
            className={cn(
                "animate-pulse rounded-md bg-slate-200 dark:bg-zinc-800",
                className
            )}
        />
    );
}

// Pre-built skeleton layouts for common use cases
export function ContentSkeleton() {
    return (
        <div className="flex flex-col items-center justify-center h-full">
            <div className="w-full max-w-md space-y-6 px-6">
                {/* Badge skeleton */}
                <div className="flex justify-center">
                    <Skeleton className="h-8 w-40 rounded-full" />
                </div>
                {/* Heading skeleton */}
                <Skeleton className="h-10 w-64 mx-auto" />
                {/* Description skeleton */}
                <Skeleton className="h-5 w-48 mx-auto" />
                {/* Card skeleton */}
                <Skeleton className="h-24 w-full rounded-2xl mt-4" />
            </div>
        </div>
    );
}

export function ChatListSkeleton() {
    return (
        <div className="max-w-2xl mx-auto py-6 px-4">
            {/* Header */}
            <div className="flex items-center justify-between mb-6">
                <div>
                    <Skeleton className="h-7 w-36" />
                    <Skeleton className="h-4 w-48 mt-2" />
                </div>
                <Skeleton className="h-9 w-24 rounded-lg" />
            </div>
            {/* Chat items */}
            <div className="space-y-3">
                {[...Array(4)].map((_, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl border border-slate-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50">
                        <Skeleton className="h-10 w-10 rounded-lg" />
                        <div className="flex-1">
                            <Skeleton className="h-5 w-40" />
                            <Skeleton className="h-3 w-24 mt-2" />
                        </div>
                    </div>
                ))}
            </div>
        </div>
    );
}

export function ChatSkeleton() {
    return (
        <div className="h-full flex flex-col">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b border-slate-200 dark:border-zinc-800">
                <Skeleton className="h-7 w-7 rounded-md" />
                <div className="flex-1">
                    <Skeleton className="h-5 w-32" />
                    <Skeleton className="h-3 w-24 mt-1" />
                </div>
            </div>
            {/* Messages */}
            <div className="flex-1 p-4 space-y-4">
                <div className="flex justify-start">
                    <Skeleton className="h-20 w-2/3 rounded-2xl" />
                </div>
                <div className="flex justify-end">
                    <Skeleton className="h-12 w-1/2 rounded-2xl" />
                </div>
                <div className="flex justify-start">
                    <Skeleton className="h-24 w-3/4 rounded-2xl" />
                </div>
            </div>
            {/* Input */}
            <div className="px-4 py-3 border-t border-slate-200 dark:border-zinc-800">
                <Skeleton className="h-11 w-full rounded-xl" />
            </div>
        </div>
    );
}
