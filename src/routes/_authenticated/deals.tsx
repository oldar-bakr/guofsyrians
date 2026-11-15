import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, ArrowLeft, TicketPercent, Loader2, Search, SlidersHorizontal, RotateCcw, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessLogo } from "@/lib/business";
import { useStudent } from "@/lib/profile";
import { cityKey, sameCity } from "@/lib/city-match";
import { dealCompanyKey, dealStoreType, filterDeals } from "@/lib/deal-filters";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DealRedemptionDialog } from "@/components/DealRedemptionDialog";
import type { Database } from "@/integrations/supabase/types";
type Deal = Database["public"]["Tables"]["deals"]["Row"];

export const Route = createFileRoute("/_authenticated/deals")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "دليل التخفيضات | تطبيق خدمات الطلاب" },
      { name: "description", content: "ابحث عن تخفيضات الطلاب وصفّ العروض حسب المدينة والشركة." },
      { property: "og:title", content: "دليل التخفيضات" },
      { property: "og:description", content: "عروض الشركاء للطلاب." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Deals,
});

function Deals() {
  const { data: all = [], isLoading, isError } = useContent<Deal>("deals");
  const deals = all.filter((d) => d.active !== false);
  const { data: shops = [] } = useQuery({ queryKey: ["shops", "store-types"], queryFn: async () => (await supabase.from("businesses").select("id, name, category, logo_url, address, phone").eq("status", "approved").eq("active", true)).data ?? [] });
  const shop = (d: Deal) => shops.find((b) => b.id === d.business_id);
  const student = useStudent();
  const [picked, setPicked] = useState<string | null>(null);
  const [active, setActive] = useState<Deal | null>(null);
  const [query, setQuery] = useState("");
  const [company, setCompany] = useState("");
  const [storeType, setStoreType] = useState("");
  const [filtersOpen, setFiltersOpen] = useState(false);
  const cities = Array.from(new Map(deals.filter((d) => d.city).map((d) => [cityKey(d.city), d.city])).values()).sort((a, b) => a.localeCompare(b, "ar"));
  // Default to the student's own city when deals exist there.
  const mine = cities.find((c) => sameCity(c, student.city));
  const city = picked ?? mine ?? "";
  const cityDeals = filterDeals(deals, shops, { city, company: "", query: "" });
  const storeTypes = Array.from(new Set(cityDeals.map((d) => dealStoreType(d, shops)).filter(Boolean))).sort((a, b) => a.localeCompare(b, "ar"));
  const typeDeals = filterDeals(cityDeals, shops, { city: "", company: "", query: "", storeType });
  const companies = Array.from(new Map(typeDeals.map((d) => [dealCompanyKey(d), shop(d)?.name ?? d.partner])).entries()).sort((a, b) => a[1].localeCompare(b[1], "ar"));
  const companyName = companies.find(([key]) => key === company)?.[1];
  const setCity = (next: string) => { setPicked(next); setCompany(""); setStoreType(""); };
  const setType = (next: string) => { setStoreType(next); setCompany(""); };
  const resetFilters = () => { setPicked(""); setCompany(""); setStoreType(""); };
  const clearAll = () => { resetFilters(); setQuery(""); };
  const activeFilters = Number(Boolean(city)) + Number(Boolean(company)) + Number(Boolean(storeType));
  const list = filterDeals(deals, shops, { city, company, query, storeType });

  const use = (d: Deal) => setActive(d);

  return (
    <AppShell title="التخفيضات">
      <div className="mb-5 space-y-3 border-b pb-4">
        <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <div className="relative min-w-0"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="البحث في التخفيضات" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن شركة أو عرض…" className="h-10 bg-card pr-9 pl-10" />{query && <Button variant="ghost" size="icon" className="absolute left-1 top-1 h-8 w-8" aria-label="مسح البحث" onClick={() => setQuery("")}><X className="h-4 w-4" /></Button>}</div>
          <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
            <PopoverTrigger asChild><Button variant={activeFilters ? "secondary" : "outline"} size="icon" className="relative h-10 w-10" aria-label="فلاتر التخفيضات" title="فلاتر التخفيضات"><SlidersHorizontal />{activeFilters > 0 && <span aria-hidden="true" className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground">{activeFilters}</span>}</Button></PopoverTrigger>
            <PopoverContent align="end" dir="rtl" className="w-80 max-w-[calc(100vw-2rem)] space-y-4" aria-label="تصفية التخفيضات">
              <div className="flex items-center justify-between"><h3 className="text-sm font-bold">تصفية التخفيضات</h3><Button variant="ghost" size="icon" className="h-8 w-8" disabled={!activeFilters} onClick={resetFilters} aria-label="إعادة ضبط الفلاتر" title="إعادة ضبط الفلاتر"><RotateCcw /></Button></div>
              <div className="space-y-1.5"><label htmlFor="deal-city" className="text-xs text-muted-foreground">المدينة</label><Select dir="rtl" value={city || "all"} onValueChange={(v) => setCity(v === "all" ? "" : v)}><SelectTrigger id="deal-city" className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل المدن</SelectItem>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><label htmlFor="deal-type" className="text-xs text-muted-foreground">نوع المتجر</label><Select dir="rtl" value={storeType || "all"} onValueChange={(v) => setType(v === "all" ? "" : v)}><SelectTrigger id="deal-type" className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل أنواع المتاجر</SelectItem>{storeTypes.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></div>
              <div className="space-y-1.5"><label htmlFor="deal-company" className="text-xs text-muted-foreground">الشركة</label><Select dir="rtl" value={company || "all"} onValueChange={(v) => setCompany(v === "all" ? "" : v)}><SelectTrigger id="deal-company" className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الشركات</SelectItem>{companies.map(([key, name]) => <SelectItem key={key} value={key}>{name}</SelectItem>)}</SelectContent></Select></div>
              <Button className="w-full" onClick={() => setFiltersOpen(false)}>عرض النتائج ({list.length})<ArrowLeft /></Button>
            </PopoverContent>
          </Popover>
        </div>
        <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground"><span role="status" aria-live="polite">{list.length} عرض متاح</span>{city && <Button variant="secondary" size="sm" className="h-auto min-h-7 max-w-full py-1 text-xs" aria-label="إزالة فلتر المدينة" onClick={() => setCity("")}><MapPin className="h-3 w-3 shrink-0" /><span className="min-w-0 break-words whitespace-normal">{city}</span><X className="h-3 w-3 shrink-0" /></Button>}{companyName && <Button variant="secondary" size="sm" className="h-auto min-h-7 max-w-full py-1 text-xs" aria-label="إزالة فلتر الشركة" onClick={() => setCompany("")}><span className="min-w-0 break-words whitespace-normal">{companyName}</span><X className="h-3 w-3 shrink-0" /></Button>}{(query || activeFilters > 0) && <Button variant="ghost" size="sm" className="mr-auto h-7 text-xs" onClick={clearAll}><RotateCcw className="h-3 w-3" />مسح الكل</Button>}</div>
      </div>
      {storeType && <div className="mb-4"><Button variant="secondary" size="sm" className="h-auto min-h-7 max-w-full py-1 text-xs" aria-label="إزالة فلتر نوع المتجر" onClick={() => setType("")}><span className="min-w-0 whitespace-normal break-words">{storeType}</span><X className="h-3 w-3 shrink-0" /></Button></div>}
      <div className="grid items-stretch gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((d) => (
          <article key={d.id} className="relative flex min-w-0 flex-col gap-4 rounded-lg border bg-card p-4 transition-colors hover:border-primary/40 sm:p-5">
            <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3">
              <div className="min-w-0"><p className="mb-1 text-xs text-muted-foreground">{d.category}</p><h3 className="break-words text-lg font-bold leading-relaxed"><Link to="/partners/$id" params={{ id: d.business_id ?? d.id }} aria-label={`ملف شركة ${d.partner}`} className="after:absolute after:inset-0 after:rounded-lg focus-visible:outline-none focus-visible:after:ring-2 focus-visible:after:ring-ring">{d.partner}</Link></h3></div>
              {shop(d) ? <BusinessLogo path={shop(d)?.logo_url} name={d.partner} className="h-14 w-14" /> : <span className="grid h-14 w-14 shrink-0 place-items-center rounded-lg bg-muted text-primary"><TicketPercent className="h-6 w-6" /></span>}
            </div>
            <div className="min-w-0"><p className="break-words font-display text-2xl font-bold text-primary">{d.discount}</p><p className="mt-2 whitespace-pre-line break-words text-sm leading-relaxed text-muted-foreground">{d.terms}</p></div>
            <div className="mt-auto space-y-3 border-t pt-3"><p className="flex items-start gap-1.5 text-xs leading-relaxed text-muted-foreground"><MapPin className="mt-0.5 h-3.5 w-3.5 shrink-0" /><span className="min-w-0 break-words">{d.city}{shop(d)?.address && ` · ${shop(d)?.address}`}</span></p><Button variant="outline" className="relative z-10 w-full justify-between" onClick={() => use(d)}>استخدم العرض<ArrowLeft className="h-4 w-4" /></Button></div>
          </article>
        ))}
      </div>
      {isLoading && <LoadingSkeleton />}
      {!isLoading && !list.length && <div className="py-12 text-center"><TicketPercent className="mx-auto mb-3 h-8 w-8 text-muted-foreground" /><p className="text-sm text-muted-foreground">{isError ? "تعذّر تحميل التخفيضات" : "لا توجد عروض مطابقة للبحث والفلاتر"}</p>{!isError && (query || activeFilters > 0) && <Button variant="outline" className="mt-4" onClick={clearAll}><RotateCcw />عرض كل التخفيضات</Button>}</div>}
      <DealRedemptionDialog deal={active} logoPath={active ? shop(active)?.logo_url : null} onClose={() => setActive(null)} />
    </AppShell>
  );
}
