import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin, X } from "lucide-react";
import QRCode from "react-qr-code";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { BusinessLogo } from "@/lib/business";
import { useStudent } from "@/lib/profile";
import { sameCity } from "@/lib/city-match";

export const Route = createFileRoute("/_authenticated/deals")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "دليل التخفيضات | تطبيق خدمات الطلاب" },
      { name: "description", content: "عروض حصرية للطلاب حسب المدينة والتصنيف." },
      { property: "og:title", content: "دليل التخفيضات" },
      { property: "og:description", content: "عروض الشركاء للطلاب." },
    ],
  }),
  component: Deals,
});

function Deals() {
  const { data: all = [] } = useContent<any>("deals");
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
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {cities.map((c) => (
          <button key={c} onClick={() => setCity(c)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${c === city ? "bg-primary text-primary-foreground" : "bg-card"}`}>{c}</button>
        ))}
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        {list.map((d: any) => (
          <article key={d.id} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
            {shop(d) ? <BusinessLogo path={shop(d)?.logo_url} name={d.partner} className="h-16 w-16" /> : <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent font-display text-xl font-bold text-accent-foreground">{d.discount}</span>}
            <div className="flex-1">
              <h3 className="font-bold">{d.partner}{shop(d) && <span className="mr-2 rounded-full bg-accent px-2 py-0.5 text-xs text-accent-foreground">{d.discount}</span>}</h3>
              <p className="text-xs text-muted-foreground">{d.category} · {d.terms}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-primary"><MapPin className="h-3 w-3" />{d.city}{shop(d)?.address && ` · ${shop(d)?.address}`}</p>
            </div>
            <button onClick={() => use(d)} className="rounded-full bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground">استخدم العرض</button>
          </article>
        ))}
      </div>
      {active && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <div className="w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-soft">
            <button onClick={() => setActive(null)} aria-label="إغلاق" className="float-left"><X className="h-5 w-5" /></button>
            <p className="font-display text-xl font-bold">{active.partner}</p>
            <p className="text-sm text-muted-foreground">خصم {active.discount} · {active.terms}</p>
            <div className="mx-auto my-4 w-fit rounded-2xl bg-card p-3">
              <QRCode value={`guss:${student.id}:deal:${active.id}`} size={170} fgColor="var(--primary)" />
            </div>
            <p className="text-sm">{student.name} · {student.id}</p>
            <p className="mt-2 text-xs text-muted-foreground">اعرض هذا الرمز على الشريك قبل الدفع</p>
          </div>
        </div>
      )}
    </AppShell>
  );
}
