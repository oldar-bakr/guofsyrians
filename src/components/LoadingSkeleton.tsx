import { Skeleton } from "@/components/ui/skeleton";

export function LoadingSkeleton({ variant = "cards", count = 3 }: { variant?: "cards" | "detail" | "form" | "profile" | "page" | "news"; count?: number }) {
  return <div role="status" aria-label="جارٍ التحميل" aria-busy="true" className="w-full min-w-0" dir="rtl">
    <span className="sr-only">جارٍ التحميل…</span>
    {variant === "news" ? <div className="relative h-[260px] overflow-hidden rounded-lg sm:h-[360px]"><Skeleton className="h-full w-full" /><div className="absolute inset-x-0 bottom-0 space-y-2 bg-card/60 p-4"><Skeleton className="h-3 w-24" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-16" /></div></div>
    : variant === "cards" ? <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">{Array.from({ length: count }, (_, i) => <div key={i} className="space-y-3 rounded-lg border bg-card p-4"><Skeleton className="aspect-[4/3] w-full" /><Skeleton className="h-5 w-3/4" /><Skeleton className="h-3 w-1/2" /><Skeleton className="h-3 w-full" /><Skeleton className="mt-4 h-9 w-28" /></div>)}</div>
    : <div className={`space-y-6 ${variant === "page" ? "mx-auto max-w-6xl px-4 py-8" : ""}`}>
      {variant === "profile" ? <div className="flex items-center gap-4"><Skeleton className="h-20 w-20 shrink-0 rounded-full" /><div className="flex-1 space-y-3"><Skeleton className="h-7 w-1/2" /><Skeleton className="h-4 w-3/4" /></div></div> : <><Skeleton className="h-6 w-1/3" />{variant !== "form" && <Skeleton className="h-56 w-full sm:h-80" />}</>}
      <div className="space-y-4">{Array.from({ length: variant === "form" ? 5 : 4 }, (_, i) => <Skeleton key={i} className={variant === "form" ? "h-11 w-full" : i === 3 ? "h-4 w-2/3" : "h-4 w-full"} />)}</div>
      {variant === "page" && <LoadingSkeleton count={3} />}
    </div>}
  </div>;
}

export function TableSkeleton({ columns = 5, rows = 4 }: { columns?: number; rows?: number }) {
  return <>{Array.from({ length: rows }, (_, row) => <tr key={row} aria-busy="true">{Array.from({ length: columns }, (_, col) => <td key={col} className="px-4 py-4">{row === 0 && col === 0 && <span role="status" className="sr-only">جارٍ التحميل…</span>}<Skeleton className="h-5 w-full min-w-12" /></td>)}</tr>)}</>;
}

export function PageSkeleton() { return <LoadingSkeleton variant="page" />; }