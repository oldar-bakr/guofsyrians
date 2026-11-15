import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, Clock, Loader2, MapPin, Search, Users, X } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContentImages } from "@/components/ContentImages";
import { useContent } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";
import { eventDayBadge, parseEventDate } from "@/lib/event-times";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { Database } from "@/integrations/supabase/types";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/events/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "الفعاليات | تطبيق خدمات الطلاب" },
      { name: "description", content: "فعاليات وأنشطة الطلاب في مدينتك مع التسجيل." },
      { property: "og:title", content: "الفعاليات والأنشطة" },
      { property: "og:description", content: "فعاليات الاتحاد في مدينتك." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Events,
});

function Events() {
  const { data: events = [], isLoading, isError, refetch } = useContent<Database["public"]["Tables"]["events"]["Row"]>("events");
  const { data: mine = [], isPending: registrationsLoading } = useMine<Database["public"]["Tables"]["event_registrations"]["Row"]>("event_registrations");
  const actions = useActivityActions("event_registrations");
  const [search, setSearch] = useState("");
  const [scope, setScope] = useState("all");
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState("");
  const visible = events.filter((event) => {
    const matches = `${event.title} ${event.place} ${event.org} ${event.description}`.toLocaleLowerCase().includes(search.trim().toLocaleLowerCase());
    return matches && (scope === "all" || mine.some((registration) => registration.event_id === event.id));
  });
  const toggleRegistration = async (eventId: string, registrationId?: string) => {
    if (busy) return;
    setBusy(eventId); setError("");
    try {
      if (registrationId) await actions.remove(registrationId);
      else await actions.add({ event_id: eventId });
    } catch { setError("تعذّر تحديث التسجيل، حاول مجدداً."); }
    finally { setBusy(null); }
  };
  return (
    <AppShell title="الفعاليات">
      <header className="mb-5 flex items-center justify-between gap-3 border-b pb-4">
        <h1 className="font-display text-2xl font-bold text-primary">الفعاليات</h1>
        <span className="inline-flex items-center gap-2 text-xs text-muted-foreground"><CalendarDays className="h-4 w-4" />{events.length} فعالية</span>
      </header>
      <div className="mb-3 flex items-center gap-2">
        <div className="relative min-w-0 flex-1"><Search className="pointer-events-none absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><Input aria-label="البحث عن فعالية" placeholder="ابحث عن فعالية أو مكان…" value={search} onChange={(e) => setSearch(e.target.value)} className="h-10 bg-card pr-9 pl-9" />{search && <Button variant="ghost" size="icon" className="absolute left-1 top-1 h-8 w-8" aria-label="مسح البحث" onClick={() => setSearch("")}><X className="h-4 w-4" /></Button>}</div>
        <Select value={scope} onValueChange={setScope} dir="rtl"><SelectTrigger aria-label="تصفية الفعاليات" className="h-10 w-32 shrink-0 bg-card"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الفعاليات</SelectItem><SelectItem value="registered">مسجّل بها</SelectItem></SelectContent></Select>
      </div>
      <p className="mb-5 text-xs text-muted-foreground" aria-live="polite">{visible.length} نتيجة{scope === "registered" ? " · فعالياتي" : ""}</p>
      {error && <p role="alert" className="mb-4 text-sm text-destructive">{error}</p>}
      {isLoading ? <LoadingSkeleton /> : isError ? <div className="py-12 text-center"><p className="mb-3 text-sm text-destructive" role="alert">تعذّر تحميل الفعاليات</p><Button variant="outline" onClick={() => refetch()}>إعادة المحاولة</Button></div> : <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
        {visible.map((e) => {
          const reg = mine.find((m) => m.event_id === e.id);
          const parsed = parseEventDate(e.date, e.time);
          const badge = parsed ? eventDayBadge(parsed.start) : null;
          return (
            <article key={e.id} className="flex min-w-0 flex-col overflow-hidden rounded-lg border bg-card">
              <Link to="/events/$id" params={{ id: e.id }} className="group flex flex-1 flex-col focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" aria-label={`تفاصيل ${e.title}`}>
                <div className="relative aspect-[16/9] overflow-hidden bg-secondary">
                  {e.images.length > 0 ? <ContentImages paths={e.images} title={e.title} cover coverFit="cover" className="h-full [&>div]:h-full [&>div>div]:h-full [&>div>div]:aspect-auto" /> : <div className="grid h-full place-items-center"><img src={logo.url} alt="الاتحاد العام لطلبة سوريا" className="h-20 w-20 object-contain" /></div>}
                  {reg && <span className="absolute left-3 top-3 inline-flex items-center gap-1.5 rounded-md bg-card px-2 py-1 text-xs font-bold text-primary"><CheckCircle2 className="h-3.5 w-3.5" />مسجّل</span>}
                </div>
                <div className="flex flex-1 gap-3 p-4">
                  <div className="flex h-20 w-16 shrink-0 flex-col items-center justify-center gap-1 rounded-md border border-primary/15 bg-secondary text-center text-primary">{badge ? <><span className="font-display text-2xl font-bold leading-none">{badge.day}</span><span className="text-[10px] leading-4">{badge.month}</span></> : <CalendarDays className="h-6 w-6" />}</div>
                  <div className="min-w-0 flex-1"><h2 className="line-clamp-2 break-words font-display text-lg font-bold leading-7 transition-colors group-hover:text-primary">{e.title}</h2>
                    <div className="mt-2 space-y-1.5 text-xs text-muted-foreground">
                      <p className="flex items-start gap-2"><Clock className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{e.date}{e.time ? ` · ${e.time}` : ""}</span></p>
                      {e.place && <p className="flex items-start gap-2"><MapPin className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{e.place}</span></p>}
                      {e.org && <p className="flex items-start gap-2"><Users className="h-3.5 w-3.5 shrink-0" /><span className="break-words">{e.org}</span></p>}
                    </div>
                    {e.description && <p className="mt-3 line-clamp-2 text-sm leading-6 text-muted-foreground">{e.description}</p>}
                  </div>
                </div>
              </Link>
              <footer className="flex items-center justify-between gap-2 border-t p-3">
                <Button asChild variant="ghost" size="sm"><Link to="/events/$id" params={{ id: e.id }}>التفاصيل<ArrowLeft className="h-4 w-4" /></Link></Button>
                <Button variant={reg ? "outline" : "default"} size="sm" disabled={busy !== null || registrationsLoading} onClick={() => toggleRegistration(e.id, reg?.id)}>{busy === e.id ? <Loader2 className="h-4 w-4 animate-spin" /> : reg ? <X className="h-4 w-4" /> : <CalendarDays className="h-4 w-4" />}{reg ? "إلغاء التسجيل" : "سجّل حضورك"}</Button>
              </footer>
            </article>
          );
        })}
        {visible.length === 0 && <div className="col-span-full flex flex-col items-center gap-3 py-12 text-center"><CalendarDays className="h-9 w-9 text-muted-foreground" /><h2 className="font-display text-lg font-bold">{events.length === 0 ? "لا توجد فعاليات حالياً" : "لا توجد فعاليات مطابقة"}</h2>{(search || scope !== "all") && <Button variant="outline" onClick={() => { setSearch(""); setScope("all"); }}>مسح التصفية</Button>}</div>}
      </div>}
    </AppShell>
  );
}
