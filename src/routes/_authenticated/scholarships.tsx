import { createFileRoute } from "@tanstack/react-router";
import { Award, CalendarDays, ChevronDown, ExternalLink, Globe2, Loader2 } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { useContent } from "@/lib/content";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/scholarships")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "المنح الدراسية | الاتحاد العام لطلبة سوريا" },
    { name: "description", content: "المنح الدراسية وشروطها ومواعيد التقديم وروابط الجهات المانحة." },
    { property: "og:title", content: "المنح الدراسية | الاتحاد العام لطلبة سوريا" },
    { property: "og:description", content: "فرص المنح الدراسية المعتمدة من إدارة الاتحاد." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: Scholarships,
});

function Scholarships() {
  const { data = [], isLoading, isError, refetch } = useContent<Database["public"]["Tables"]["scholarships"]["Row"]>("scholarships");
  return <AppShell title="المنح الدراسية">
    <header className="mb-5 flex flex-wrap items-center justify-between gap-2 border-b pb-4"><h1 className="font-display text-2xl font-bold text-primary">المنح الدراسية</h1><span className="text-xs text-muted-foreground">{data.length} فرصة</span></header>
    {isLoading ? <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-sm text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />جارٍ تحميل المنح…</div> : isError ? <div className="py-12 text-center"><p role="alert" className="mb-3 text-sm text-destructive">تعذّر تحميل المنح</p><Button variant="outline" onClick={() => refetch()}>إعادة المحاولة</Button></div> : !data.length ? <div className="py-12 text-center"><Award className="mx-auto mb-3 h-10 w-10 text-primary" /><h2 className="font-display text-xl font-bold">لا توجد منح معلنة حالياً</h2></div> : <div className="grid items-start gap-4 md:grid-cols-2">
      {data.map((s) => {
        const url = /^https?:\/\//i.test(s.application_url ?? "") ? s.application_url : null;
        return <article key={s.id} className="min-w-0 overflow-hidden rounded-lg border bg-card">
          <div className="space-y-4 p-4 sm:p-5">
            <div className="flex items-start gap-3"><span className="grid h-10 w-10 shrink-0 place-items-center rounded-md bg-secondary text-primary"><Award className="h-5 w-5" /></span><div className="min-w-0"><h2 className="break-words font-display text-lg font-bold leading-7 sm:text-xl">{s.title}</h2>{s.provider && <p className="mt-1 break-words text-xs text-muted-foreground">{s.provider}</p>}</div></div>
            {s.country && <p className="flex items-start gap-2 text-xs text-muted-foreground"><Globe2 className="h-4 w-4 shrink-0" /><span className="min-w-0 break-words">{s.country}</span></p>}
            {s.deadline && <div className="flex items-start gap-2 border-s-2 border-accent ps-3"><CalendarDays className="mt-0.5 h-4 w-4 shrink-0 text-primary" /><div className="min-w-0"><p className="text-[11px] text-muted-foreground">موعد التقديم</p><p className="mt-1 break-words text-sm font-medium leading-6">{s.deadline}</p></div></div>}
            {(s.description || s.eligibility) && <details className="group border-t pt-3">
              <summary className="flex min-h-10 cursor-pointer list-none items-center justify-between gap-2 rounded-sm text-sm font-bold text-primary outline-none focus-visible:ring-2 focus-visible:ring-ring [&::-webkit-details-marker]:hidden">تفاصيل المنحة وشروط التقديم<ChevronDown className="h-4 w-4 shrink-0 transition-transform group-open:rotate-180 motion-reduce:transition-none" /></summary>
              <div className="space-y-4 pt-3">{s.description && <section><h3 className="mb-1 text-sm font-bold">عن المنحة</h3><p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{s.description}</p></section>}{s.eligibility && <section><h3 className="mb-1 text-sm font-bold">شروط التقديم</h3><p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{s.eligibility}</p></section>}</div>
            </details>}
          </div>
          {url && <footer className="border-t p-3 sm:px-5"><Button asChild className="h-11 w-full"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink className="h-4 w-4" />التقديم للمنحة</a></Button></footer>}
        </article>;
      })}
    </div>}
  </AppShell>;
}