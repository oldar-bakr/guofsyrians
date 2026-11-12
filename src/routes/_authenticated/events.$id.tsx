import { createFileRoute, Link } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import {
  ArrowRight,
  CalendarCheck,
  CalendarDays,
  CalendarPlus,
  Check,
  Clock,
  MapPin,
  Share2,
  Users,
} from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContactLinks } from "@/components/ContactLinks";
import { useContent, useItem } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";
import {
  buildEventIcs,
  downloadEventIcs,
  eventCountdown,
  eventDayBadge,
  icsFileName,
  parseEventDate,
} from "@/lib/event-times";

export const Route = createFileRoute("/_authenticated/events/$id")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "تفاصيل الفعالية | تطبيق خدمات الطلاب" },
      { name: "description", content: "موعد الفعالية ومكانها وبرنامجها والتسجيل فيها." },
      { property: "og:title", content: "تفاصيل الفعالية" },
      { property: "og:description", content: "موعد الفعالية ومكانها والتسجيل فيها." },
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

  const [now, setNow] = useState(() => new Date());
  const [copied, setCopied] = useState(false);
  useEffect(() => {
    const t = setInterval(() => setNow(new Date()), 30000);
    return () => clearInterval(t);
  }, []);

  if (isLoading)
    return (
      <AppShell title="الفعالية">
        <p className="text-center text-sm text-muted-foreground">جارٍ التحميل…</p>
      </AppShell>
    );
  if (!ev)
    return (
      <AppShell title="الفعالية">
        <p className="text-center">الفعالية غير موجودة</p>
        <Link to="/events" className="mt-4 block text-center text-primary">
          العودة للفعاليات
        </Link>
      </AppShell>
    );

  const parsed = parseEventDate(ev.date, ev.time);
  const badge = parsed ? eventDayBadge(parsed.start) : null;
  const countdown = parsed ? eventCountdown(parsed.start, now) : null;
  const mapsHref = ev.place ? `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ev.place)}` : null;

  const share = async () => {
    const url = window.location.href;
    if (navigator.share) {
      try {
        await navigator.share({ title: ev.title, text: `${ev.title} — ${ev.date} ${ev.time || ""}`, url });
        return;
      } catch {
        /* the student closed the share sheet */
      }
    }
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch {
      /* clipboard blocked: nothing else to do */
    }
  };

  const addToCalendar = () => downloadEventIcs(buildEventIcs(ev), icsFileName(ev.title));

  return (
    <AppShell title="الفعالية">
      <Link to="/events" className="mb-3 inline-flex items-center gap-1 text-sm text-primary">
        <ArrowRight className="h-4 w-4" />
        كل الفعاليات
      </Link>

      <header className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft md:p-7">
        <div className="flex items-start gap-4">
          {badge && (
            <div className="grid w-16 shrink-0 place-items-center rounded-xl bg-primary-foreground/10 px-2 py-3 text-center">
              <span className="font-display text-2xl font-bold leading-none">{badge.day}</span>
              <span className="mt-1 text-[11px] opacity-90">{badge.month}</span>
            </div>
          )}
          <div className="min-w-0 flex-1">
            <p className="text-xs opacity-80">{badge ? badge.weekday : "فعالية"}</p>
            <h2 className="mt-1 font-display text-2xl font-bold leading-snug md:text-3xl">{ev.title}</h2>
            {ev.org && (
              <p className="mt-2 inline-flex items-center gap-1.5 rounded-full bg-primary-foreground/10 px-3 py-1 text-xs">
                <Users className="h-3.5 w-3.5" />
                تنظيم: {ev.org}
              </p>
            )}
            {reg && (
              <span className="mt-2 inline-block rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">
                أنت مسجّل
              </span>
            )}
          </div>
        </div>

        {countdown && !countdown.done && (
          <div className="mt-4 flex flex-wrap items-center gap-2 border-t border-primary-foreground/20 pt-4">
            <span className="text-xs opacity-80">تبدأ بعد:</span>
            {countdown.parts.map((p) => (
              <span key={p.label} className="rounded-lg bg-primary-foreground/10 px-3 py-1 text-sm font-bold">
                {p.value} {p.label}
              </span>
            ))}
          </div>
        )}
        {countdown?.done && <p className="mt-4 text-xs opacity-80">انتهت هذه الفعالية.</p>}
      </header>

      <div className="mt-4 grid gap-4 md:grid-cols-[1fr_320px]">
        <div className="space-y-4">
          <ul className="grid gap-2 rounded-2xl bg-card p-4 text-sm sm:grid-cols-2">
            <li className="flex items-center gap-2">
              <CalendarDays className="h-4 w-4 shrink-0 text-primary" />
              {ev.date || "—"}
            </li>
            <li className="flex items-center gap-2">
              <Clock className="h-4 w-4 shrink-0 text-primary" />
              {ev.time || "—"}
            </li>
            <li className="flex items-center gap-2 sm:col-span-2">
              <MapPin className="h-4 w-4 shrink-0 text-primary" />
              {mapsHref ? (
                <a href={mapsHref} target="_blank" rel="noreferrer" className="text-primary hover:underline">
                  {ev.place}
                </a>
              ) : (
                ev.place || "—"
              )}
            </li>
          </ul>

          {ev.description && (
            <section className="rounded-2xl bg-card p-4">
              <h3 className="mb-2 font-bold">عن الفعالية</h3>
              <p className="whitespace-pre-wrap text-sm leading-relaxed text-muted-foreground">{ev.description}</p>
            </section>
          )}

          <section className="rounded-2xl bg-card p-4">
            <h3 className="mb-3 font-bold">أسئلة أو اعتذار؟</h3>
            <p className="mb-3 text-sm text-muted-foreground">تواصل مع الاتحاد مباشرةً عن هذه الفعالية.</p>
            <ContactLinks showAddress={false} />
          </section>
        </div>

        <aside className="space-y-4">
          <div className="rounded-2xl bg-card p-4">
            {reg ? (
              <button
                onClick={() => confirm("إلغاء التسجيل؟") && actions.remove(reg.id)}
                className="w-full rounded-xl border py-2 text-sm"
              >
                إلغاء التسجيل
              </button>
            ) : (
              <button
                onClick={() => actions.add({ event_id: id })}
                className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground"
              >
                <CalendarCheck className="h-5 w-5" />
                سجّل حضورك
              </button>
            )}
            <button
              onClick={addToCalendar}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl bg-secondary py-2 text-sm font-bold text-primary"
            >
              <CalendarPlus className="h-4 w-4" />
              أضفها إلى تقويمي
            </button>
            <button
              onClick={share}
              className="mt-2 flex w-full items-center justify-center gap-2 rounded-xl border py-2 text-sm"
            >
              {copied ? <Check className="h-4 w-4 text-primary" /> : <Share2 className="h-4 w-4" />}
              {copied ? "تم نسخ الرابط" : "مشاركة الفعالية"}
            </button>
          </div>

          <OtherEvents currentId={id} />
        </aside>
      </div>
    </AppShell>
  );
}

function OtherEvents({ currentId }: { currentId: string }) {
  const { data: events = [] } = useContent<any>("events");
  const others = events.filter((e: any) => e.id !== currentId).slice(0, 4);
  if (!others.length) return null;
  return (
    <section className="rounded-2xl bg-card p-4">
      <h3 className="mb-3 font-bold">فعاليات أخرى</h3>
      <ul className="space-y-2">
        {others.map((e: any) => (
          <li key={e.id}>
            <Link
              to="/events/$id"
              params={{ id: e.id }}
              className="block rounded-xl bg-muted/50 p-3 text-sm transition-colors hover:bg-secondary"
            >
              <span className="block font-medium">{e.title}</span>
              <span className="mt-1 block text-xs text-muted-foreground">
                {e.date}
                {e.time ? ` · ${e.time}` : ""}
              </span>
            </Link>
          </li>
        ))}
      </ul>
      <Link to="/events" className="mt-3 block text-center text-sm text-primary">
        كل الفعاليات
      </Link>
    </section>
  );
}
