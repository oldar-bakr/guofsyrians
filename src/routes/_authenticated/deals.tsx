import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, ArrowLeft, TicketPercent, Loader2 } from "lucide-react";
import QRCode from "react-qr-code";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessLogo } from "@/lib/business";
import { useStudent } from "@/lib/profile";
import { sameCity } from "@/lib/city-match";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export const Route = createFileRoute("/_authenticated/deals")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "دليل التخفيضات | تطبيق خدمات الطلاب" },
      { name: "description", content: "عروض حصرية للطلاب حسب المدينة والتصنيف." },
      { property: "og:title", content: "دليل التخفيضات" },
      { property: "og:description", content: "عروض الشركاء للطلاب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Deals,
});

function Deals() {
  const { data: all = [], isLoading, isError } = useContent<any>("deals");
  const deals = all.filter((d: any) => d.active !== false);
  const { data: shops = [] } = useQuery({ queryKey: ["shops"], queryFn: async () => (await supabase.from("businesses").select("id, name, logo_url, address, phone").eq("status", "approved")).data ?? [] });
  const shop = (d: any) => shops.find((b: any) => b.id === d.business_id);
  const student = useStudent();
  const [picked, setPicked] = useState<string | null>(null);
  const [active, setActive] = useState<any | null>(null);
  const cities = ["الكل", ...Array.from(new Set(deals.map((d: any) => d.city).filter(Boolean)))] as string[];
  // Default to the student's own city when deals exist there.
  const mine = cities.find((c) => c !== "الكل" && sameCity(c, student.city));
  const city = picked ?? mine ?? "الكل";
  const setCity = setPicked;
  const list = deals.filter((d: any) => city === "الكل" || d.city === city);

  const use = (d: any) => setActive(d);

  return (
    <AppShell title="التخفيضات">
      <div className="mb-5 space-y-4 border-b pb-4">
        <h2 className="font-display text-2xl font-bold">التخفيضات</h2>
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
          <div className="flex min-w-0 items-center gap-2 text-sm text-muted-foreground"><TicketPercent className="h-4 w-4 shrink-0" /><span>{list.length} عرض متاح</span></div>
          <div className="w-40 min-w-0 sm:w-52"><Select dir="rtl" value={city} onValueChange={setCity}><SelectTrigger aria-label="المدينة" className="h-10 bg-card"><MapPin className="h-4 w-4 shrink-0 text-muted-foreground" /><SelectValue /></SelectTrigger><SelectContent>{cities.map((c) => <SelectItem key={c} value={c}>{c === "الكل" ? "كل المدن" : c}</SelectItem>)}</SelectContent></Select></div>
        </div>
      </div>
      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((d: any) => (
          <article key={d.id} className="flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 sm:p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0"><p className="mb-1 text-xs text-muted-foreground">{d.category}</p><h3 className="break-words text-lg font-bold leading-relaxed">{d.partner}</h3></div>
              {shop(d) ? <BusinessLogo path={shop(d)?.logo_url} name={d.partner} className="h-14 w-14" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-muted text-primary"><TicketPercent className="h-6 w-6" /></span>}
            </div>
            <div className="min-w-0"><p className="break-words font-display text-2xl font-bold text-primary">{d.discount}</p><p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{d.terms}</p></div>
            <div className="mt-auto space-y-3 border-t pt-3"><p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words">{d.city}{shop(d)?.address && ` · ${shop(d)?.address}`}</span></p><Button variant="outline" className="w-full justify-between" onClick={() => use(d)}>استخدم العرض<ArrowLeft className="h-4 w-4" /></Button></div>
          </article>
        ))}
      </div>
      {isLoading && <div className="grid min-h-40 place-items-center" role="status" aria-label="تحميل التخفيضات"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>}
      {!isLoading && !list.length && <div className="py-12 text-center"><TicketPercent className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">{isError ? "تعذّر تحميل التخفيضات" : "لا توجد عروض متاحة في هذه المدينة"}</p></div>}
      <Dialog open={Boolean(active)} onOpenChange={(open) => { if (!open) setActive(null); }}>
        {active && <DialogContent dir="rtl" className="max-w-sm rounded-lg">
            <div className="mx-auto"><BusinessLogo path={shop(active)?.logo_url} name={active.partner} className="h-20 w-20" /></div>
            <DialogHeader><DialogTitle className="break-words font-display text-xl">{active.partner}</DialogTitle><DialogDescription className="break-words">خصم {active.discount} · {active.terms}</DialogDescription></DialogHeader>
            <div className="mx-auto my-2 w-fit rounded-lg bg-card p-3">
              <QRCode value={`guss:${student.id}:deal:${active.id}`} size={170} fgColor="var(--primary)" />
            </div>
            <p className="break-words text-center text-sm">{student.name} · {student.id}</p>
            <p className="text-center text-xs text-muted-foreground">اعرض هذا الرمز على الشريك قبل الدفع</p>
        </DialogContent>}
      </Dialog>
    </AppShell>
  );
}
