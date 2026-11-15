import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { ArrowRight, ArrowLeft, Mail, Phone, MapPin, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useContent } from "@/lib/content";
import { BusinessLogo } from "@/lib/business";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { DealRedemptionDialog, type RedemptionDeal } from "@/components/DealRedemptionDialog";
import type { Database } from "@/integrations/supabase/types";
type Deal = Database["public"]["Tables"]["deals"]["Row"];

export const Route = createFileRoute("/_authenticated/partners/$id")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "ملف الشركة وعروضها | الاتحاد العام لطلبة سوريا" },
    { name: "description", content: "تعرّف على الشركة وبيانات التواصل وجميع تخفيضاتها المتاحة للطلاب." },
    { property: "og:title", content: "ملف الشركة وعروضها | الاتحاد العام لطلبة سوريا" },
    { property: "og:description", content: "معلومات الشريك وجميع عروضه وتخفيضاته للطلاب." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Partner,
});
function Partner() {
  const { id } = Route.useParams();
  const { data: deals = [], isLoading: dealsLoading } = useContent<Deal>("deals");
  const { data: business, isLoading, isError } = useQuery({ queryKey: ["partner", id], queryFn: async () => {
    const { data, error } = await supabase.from("businesses").select("id,name,category,city,address,phone,email,description,logo_url").eq("id", id).eq("status", "approved").eq("active", true).maybeSingle();
    if (error) throw error;
    return data;
  } });
  const [active, setActive] = useState<RedemptionDeal | null>(null);
  // Older staff-created deals have no business row; use the selected deal as their profile anchor.
  const legacy = deals.find((d) => d.id === id && !d.business_id && d.active);
  const offers = deals.filter((d) => d.active && (business ? d.business_id === business.id : legacy && !d.business_id && d.partner === legacy.partner));
  const name = business?.name ?? legacy?.partner;
  return <AppShell title="ملف الشركة">
    <Link to="/deals" className="mb-5 inline-flex items-center gap-2 text-sm text-primary"><ArrowRight className="h-4 w-4" />التخفيضات</Link>
    {isLoading || dealsLoading ? <div role="status" aria-label="تحميل الشركة" className="grid min-h-48 place-items-center"><Loader2 className="animate-spin" /></div> : !name ? <p className="py-10 text-center text-muted-foreground">{isError ? "تعذّر تحميل الشركة" : "الشركة غير متاحة"}</p> : <>
      <header className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-4 border-b pb-5"><div className="min-w-0"><p className="text-sm text-muted-foreground">{business?.category ?? legacy?.category}</p><h2 className="mt-1 break-words font-display text-2xl font-bold">{name}</h2><p className="mt-2 flex items-start gap-1 text-sm text-muted-foreground"><MapPin className="h-4 w-4 shrink-0" /><span>{business?.city ?? legacy?.city}{business?.address && ` · ${business.address}`}</span></p></div><BusinessLogo name={name} path={business?.logo_url} className="h-20 w-20" /></header>
      {business?.description && <p className="mt-5 whitespace-pre-line break-words text-sm leading-7">{business.description}</p>}
      <div className="my-5 flex flex-wrap gap-3">{business?.phone && <Button asChild variant="outline"><a href={`tel:${business.phone.replace(/\s/g, "")}`}><Phone /><span dir="ltr">{business.phone}</span></a></Button>}{business?.email && <Button asChild variant="outline" className="h-auto min-h-9 max-w-full py-2"><a href={`mailto:${business.email}`}><Mail className="shrink-0" /><span dir="ltr" className="min-w-0 break-all whitespace-normal">{business.email}</span></a></Button>}</div>
      <h3 className="mb-4 mt-7 font-display text-lg font-bold">عروض الشركة <span className="text-sm text-muted-foreground">({offers.length})</span></h3>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{offers.map((d) => <article key={d.id} className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4"><h4 className="break-words font-display text-2xl font-bold text-primary">{d.discount}</h4><p className="whitespace-pre-line break-words text-sm leading-7 text-muted-foreground">{d.terms}</p><p className="text-xs text-muted-foreground">{d.city} · {d.category}</p><Button variant="outline" className="mt-auto justify-between" onClick={() => setActive(d)}>استخدم العرض<ArrowLeft /></Button></article>)}</div>
      {!offers.length && <p className="py-8 text-muted-foreground">لا توجد عروض متاحة حاليًا</p>}
    </>}
    <DealRedemptionDialog deal={active} logoPath={business?.logo_url} onClose={() => setActive(null)} />
  </AppShell>;
}