import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { MapPin } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { deals } from "@/lib/data";

export const Route = createFileRoute("/deals")({
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

const cities = ["الكل", "إسطنبول", "أنقرة", "غازي عنتاب"];

function Deals() {
  const [city, setCity] = useState("الكل");
  const list = deals.filter((d) => city === "الكل" || d.city === city);
  return (
    <AppShell title="التخفيضات">
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {cities.map((c) => (
          <button key={c} onClick={() => setCity(c)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${c === city ? "bg-primary text-primary-foreground" : "bg-card"}`}>{c}</button>
        ))}
      </div>
      <div className="space-y-3">
        {list.map((d) => (
          <article key={d.partner} className="flex items-center gap-4 rounded-2xl bg-card p-4 shadow-soft">
            <span className="grid h-16 w-16 shrink-0 place-items-center rounded-2xl bg-accent font-display text-xl font-bold text-accent-foreground">{d.discount}</span>
            <div>
              <h3 className="font-bold">{d.partner}</h3>
              <p className="text-xs text-muted-foreground">{d.category} · {d.terms}</p>
              <p className="mt-1 flex items-center gap-1 text-xs text-primary"><MapPin className="h-3 w-3" />{d.city}</p>
            </div>
          </article>
        ))}
      </div>
      <p className="mt-5 rounded-2xl bg-secondary p-4 text-center text-sm">استخدم رمز QR في بطاقتك لدى الشريك للتحقق من الاستحقاق</p>
    </AppShell>
  );
}
