import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, User, Search, ExternalLink } from "lucide-react";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { ContactLinks } from "@/components/ContactLinks";
import { useStudent } from "@/lib/profile";
import { useContent } from "@/lib/content";
import { UniversityLogo } from "@/components/UniversityLogo";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import directory from "@/data/university-directory.json";

export const Route = createFileRoute("/_authenticated/union")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "دليل الاتحاد | تطبيق خدمات الطلاب" },
      { name: "description", content: "التعريف بالاتحاد ودليل الفروع والجامعات وبيانات التواصل." },
      { property: "og:title", content: "دليل الاتحاد والفروع" },
      { property: "og:description", content: "الاتحادات الفرعية وبيانات التواصل." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Union,
});

function Union() {
  const student = useStudent();
  const { data: branches = [], isLoading } = useContent<any>("branches");
  const [query, setQuery] = useState("");
  const [city, setCity] = useState("all");
  const [limit, setLimit] = useState(24);
  const universities = directory.filter((u) => (city === "all" || u.city === city) && `${u.name} ${u.city}`.toLocaleLowerCase("tr").includes(query.trim().toLocaleLowerCase("tr")));
  const cities = [...new Set(directory.map((u) => u.city))].sort((a,b) => a.localeCompare(b,"tr"));
  return (
    <AppShell title="دليل الاتحاد">
      <section className="rounded-2xl bg-hero p-5 text-primary-foreground">
        <h2 className="font-display text-xl font-bold">الاتحاد العام لطلبة سوريا</h2>
        <p className="mt-2 text-sm opacity-90">مظلة تجمع الطلاب السوريين وتمثلهم، وتقدم لهم الخدمات والفرص التعليمية والاجتماعية.</p>
      </section>
      <h3 className="mb-3 mt-6 font-display text-lg font-bold">الفروع</h3>
      {isLoading && <LoadingSkeleton count={2} />}
      <div className="grid gap-3 md:grid-cols-2">
        {branches.map((b) => (
          <article key={b.city} className={`rounded-2xl bg-card p-4 shadow-soft ${b.university === student.university ? "ring-2 ring-accent" : ""}`}>
            {b.university === student.university && <span className="text-xs font-bold text-primary">فرع جامعتك</span>}
            <h4 className="font-bold">فرع {b.city}</h4>
            <p className="text-xs text-muted-foreground">{b.university}</p>
            <p className="mt-2 flex items-center gap-1 text-sm"><User className="h-4 w-4 text-primary" />{b.head}</p>
            {b.contact && <a href={`tel:${b.contact.replace(/\s/g, "")}`} dir="ltr" className="flex items-center gap-1 text-sm text-primary"><Phone className="h-4 w-4" />{b.contact}</a>}
            {b.email && <a href={`mailto:${b.email}`} dir="ltr" className="flex items-center gap-1 text-sm text-primary"><Mail className="h-4 w-4" />{b.email}</a>}
          </article>
        ))}
      </div>
      <section className="mt-8 border-t pt-6">
        <h3 className="font-display text-xl font-bold">الجامعات التركية</h3>
        <p className="mt-2 text-xs leading-relaxed text-muted-foreground">أسماء المسؤولين تجريبية وليست ممثلين معتمدين للاتحاد. البريد الرسمي يخص الجامعة أو أحد مكاتبها، وليس مسؤول الاتحاد.</p>
        <div className="my-4 grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
          <label className="relative min-w-0"><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><input aria-label="البحث عن جامعة" value={query} onChange={(e) => { setQuery(e.target.value); setLimit(24); }} placeholder="ابحث باسم الجامعة أو المدينة…" className="h-10 w-full rounded-lg border bg-card pr-9 pl-3 text-sm" /></label>
          <div className="w-32 sm:w-44"><Select dir="rtl" value={city} onValueChange={(v) => { setCity(v); setLimit(24); }}><SelectTrigger aria-label="مدينة الجامعة" className="h-10 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل المدن</SelectItem>{cities.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
        </div>
        <p className="mb-3 text-xs text-muted-foreground">{universities.length} جامعة</p>
        <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
          {universities.slice(0,limit).map((u) => {
            const branch = branches.find((b) => b.university === u.name);
            return <article key={`${u.city}-${u.name}`} className="flex min-w-0 flex-col gap-3 rounded-lg border bg-card p-4">
              <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-3"><div className="min-w-0"><h4 dir="ltr" className="break-words text-right text-sm font-bold leading-relaxed">{u.name}</h4><p className="mt-1 text-xs text-muted-foreground">{u.city}</p></div><UniversityLogo university={u.logoKey} className="h-14 w-14" /></div>
              <p className="flex items-start gap-2 text-xs"><User className="h-4 w-4 shrink-0 text-muted-foreground" /><span>{branch?.head || u.demoHead}</span></p>
              {branch?.email && <a href={`mailto:${branch.email}`} className="flex min-w-0 items-center gap-2 text-xs text-primary"><Mail className="h-4 w-4 shrink-0" /><span dir="ltr" className="break-all">{branch.email}</span></a>}
              <div className="mt-auto border-t pt-3">
                {u.email ? <><p className="mb-1 text-xs text-muted-foreground">بريد الجامعة الرسمي</p><a href={`mailto:${u.email}`} dir="ltr" className="block break-all text-xs text-primary">{u.email}</a><a href={u.emailSource} target="_blank" rel="noopener noreferrer" className="mt-2 inline-flex items-center gap-1 text-xs text-muted-foreground">مصدر البريد<ExternalLink className="h-3 w-3" /></a></> : <p className="text-xs text-muted-foreground">لم يُتحقق من بريد رسمي بعد</p>}
                {u.site && <Button asChild variant="link" size="sm" className="mt-1 h-7 px-0 text-xs"><a href={u.site} target="_blank" rel="noopener noreferrer">موقع الجامعة<ExternalLink className="h-3 w-3" /></a></Button>}
              </div>
            </article>;
          })}
        </div>
        {!universities.length && <p className="py-8 text-center text-sm text-muted-foreground">لا توجد جامعات مطابقة</p>}
        {universities.length > limit && <div className="mt-4 text-center"><Button variant="outline" onClick={() => setLimit((n) => n + 24)}>عرض المزيد</Button></div>}
      </section>
      <section className="mt-6 rounded-2xl bg-card p-5 shadow-soft">
        <h3 className="font-display text-lg font-bold">تواصل مع الإدارة</h3>
        <p className="mt-1 text-xs text-muted-foreground">لأي استفسار عام، يمكنك التواصل مع إدارة الاتحاد مباشرة.</p>
        <div className="mt-4">
          <ContactLinks />
        </div>
      </section>
    </AppShell>
  );
}
