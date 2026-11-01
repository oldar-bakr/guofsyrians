import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/events")({
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
  const [joined, setJoined] = useState<string[]>([]);
  return (
    <AppShell title="الفعاليات">
      <div className="space-y-4">
        {events.map((e) => {
          const on = joined.includes(e.title);
          return (
            <article key={e.title} className="flex gap-4 rounded-2xl bg-card p-4 shadow-soft">
              <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-hero p-2 text-center text-xs text-primary-foreground">{e.date}</div>
              <div className="flex-1">
                <h3 className="font-bold">{e.title}</h3>
                <p className="text-xs text-muted-foreground">{e.time} · {e.place}</p>
                <p className="text-xs text-muted-foreground">تنظيم: {e.org}</p>
                <button onClick={() => setJoined(on ? joined.filter((t) => t !== e.title) : [...joined, e.title])} className={`mt-2 rounded-full px-4 py-1 text-xs font-bold ${on ? "bg-secondary text-primary" : "bg-primary text-primary-foreground"}`}>
                  {on ? "✓ مسجّل" : "سجّل حضورك"}
                </button>
              </div>
            </article>
          );
        })}
      </div>
    </AppShell>
  );
}
