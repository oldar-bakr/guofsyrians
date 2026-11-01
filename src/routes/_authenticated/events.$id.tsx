import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, CalendarDays, Clock, MapPin, Users } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useItem } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/events/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الفعالية | تطبيق خدمات الطلاب" },
      { name: "description", content: "موعد ومكان الفعالية والتسجيل فيها." },
      { property: "og:title", content: "تفاصيل الفعالية" },
      { property: "og:description", content: "موعد ومكان الفعالية والتسجيل فيها." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: EventDetail,
});

function EventDetail() {
  const { id } = Route.useParams();
  const { data: ev, isLoading } = useItem<any>("events", id);
  const { data: mine = [] } = useMine<any>("event_registrations");
  const actions = useActivityActions("event_registrations");
  const reg = mine.find((m: any) => m.event_id === id);

  if (isLoading) return <AppShell title="الفعالية"><p className="text-center text-sm text-muted-foreground">جارٍ التحميل…</p></AppShell>;
  if (!ev) return <AppShell title="الفعالية"><p className="text-center">الفعالية غير موجودة</p><Link to="/events" className="mt-4 block text-center text-primary">العودة للفعاليات</Link></AppShell>;

  const rows = [
    { icon: CalendarDays, text: ev.date },
    { icon: Clock, text: ev.time },
    { icon: MapPin, text: ev.place },
    { icon: Users, text: ev.org && `تنظيم: ${ev.org}` },
  ].filter((r) => r.text);

  return (
    <AppShell title="الفعالية">
      <Link to="/events" className="mb-3 inline-flex items-center gap-1 text-sm text-primary"><ArrowRight className="h-4 w-4" />كل الفعاليات</Link>
      <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft">
        <h2 className="font-display text-2xl font-bold">{ev.title}</h2>
        {reg && <span className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">أنت مسجّل</span>}
      </div>
      <ul className="mt-4 space-y-2 rounded-2xl bg-card p-4 text-sm">
        {rows.map((r, i) => <li key={i} className="flex items-center gap-2"><r.icon className="h-4 w-4 text-primary" />{r.text}</li>)}
      </ul>
      {ev.description && (
        <section className="mt-4 rounded-2xl bg-card p-4">
          <h3 className="mb-2 font-bold">عن الفعالية</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{ev.description}</p>
        </section>
      )}
      <div className="mt-4">
        {reg ? (
          <button onClick={() => confirm("إلغاء التسجيل؟") && actions.remove(reg.id)} className="w-full rounded-xl border py-2 text-sm">إلغاء التسجيل</button>
        ) : (
          <button onClick={() => actions.add({ event_id: id })} className="w-full rounded-xl bg-primary py-3 font-bold text-primary-foreground">سجّل حضورك</button>
        )}
      </div>
    </AppShell>
  );
}
