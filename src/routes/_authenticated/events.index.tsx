import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/events/")({
  head: () => ({
    meta: [
      { title: "الفعاليات | تطبيق خدمات الطلاب" },
      { name: "description", content: "فعاليات وأنشطة الطلاب في مدينتك مع التسجيل." },
      { property: "og:title", content: "الفعاليات والأنشطة" },
      { property: "og:description", content: "فعاليات الاتحاد في مدينتك." },
    ],
  }),
  component: Events,
});

function Events() {
  const { data: events = [] } = useContent<any>("events");
  const { data: mine = [] } = useMine<any>("event_registrations");
  const actions = useActivityActions("event_registrations");
  return (
    <AppShell title="الفعاليات">
      <div className="grid gap-4 md:grid-cols-2">
        {events.map((e: any) => {
          const reg = mine.find((m: any) => m.event_id === e.id);
          return (
            <article key={e.id} className="flex flex-col gap-3 rounded-2xl bg-card p-4 shadow-soft">
              <Link to="/events/$id" params={{ id: e.id }} className="group flex gap-4 text-right">
                <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-hero p-2 text-center text-xs text-primary-foreground">{e.date}</div>
                <div className="flex-1">
                  <h3 className="font-bold transition-colors group-hover:text-primary">{e.title}</h3>
                  <p className="text-xs text-muted-foreground">{e.time} · {e.place}</p>
                  <p className="text-xs text-muted-foreground">تنظيم: {e.org}</p>
                  {e.description && <p className="mt-2 line-clamp-2 text-sm">{e.description}</p>}
                  <span className="mt-2 inline-block text-xs text-primary">التفاصيل والتسجيل</span>
                </div>
              </Link>
              <button
                onClick={() => (reg ? actions.remove(reg.id) : actions.add({ event_id: e.id }))}
                className={`self-start rounded-full px-4 py-1 text-xs font-bold ${reg ? "bg-secondary text-primary" : "bg-primary text-primary-foreground"}`}
              >
                {reg ? "✓ مسجّل — إلغاء" : "سجّل حضورك"}
              </button>
            </article>
          );
        })}
        {events.length === 0 && <p className="text-center text-sm text-muted-foreground">لا توجد فعاليات حالياً</p>}
      </div>
    </AppShell>
  );
}
