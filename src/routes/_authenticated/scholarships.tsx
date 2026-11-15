import { createFileRoute } from "@tanstack/react-router";
import { Award, ExternalLink } from "lucide-react";
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
  const { data = [], isLoading, isError } = useContent<Database["public"]["Tables"]["scholarships"]["Row"]>("scholarships");
  return <AppShell title="المنح الدراسية">
    {isLoading ? <p className="text-muted-foreground">جارٍ التحميل…</p> : isError ? <p className="text-destructive">تعذّر تحميل المنح</p> : !data.length ? <div className="py-12 text-center"><Award className="mx-auto mb-3 h-10 w-10 text-primary" /><h2 className="font-display text-xl font-bold">لا توجد منح معلنة حالياً</h2></div> : <div className="grid items-start gap-4 md:grid-cols-2">
      {data.map((s) => {
        const url = /^https?:\/\//i.test(s.application_url ?? "") ? s.application_url : null;
        return <article key={s.id} className="space-y-3 rounded-lg border bg-card p-5">
          <div className="flex items-start gap-3"><Award className="mt-1 h-5 w-5 shrink-0 text-primary" /><div className="min-w-0"><h2 className="font-display text-xl font-bold break-words">{s.title}</h2><p className="text-sm text-muted-foreground">{[s.provider, s.country].filter(Boolean).join(" · ")}</p></div></div>
          {s.deadline && <p className="text-sm font-medium text-primary">آخر موعد للتقديم: {s.deadline}</p>}
          {s.description && <p className="whitespace-pre-wrap break-words text-sm leading-7">{s.description}</p>}
          {s.eligibility && <div><h3 className="text-sm font-bold">شروط التقديم</h3><p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{s.eligibility}</p></div>}
          {url && <Button asChild><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />التقديم للمنحة</a></Button>}
        </article>;
      })}
    </div>}
  </AppShell>;
}