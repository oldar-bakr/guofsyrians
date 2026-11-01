import { createFileRoute, Link } from "@tanstack/react-router";
import { PlayCircle, CheckCircle2, Circle, ArrowRight, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useItem, toEmbedUrl } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/courses/$id")({
  head: () => ({
    meta: [
      { title: "تفاصيل الدورة | تطبيق خدمات الطلاب" },
      { name: "description", content: "محتوى الدورة والدروس ومتابعة تقدمك." },
      { property: "og:title", content: "تفاصيل الدورة" },
      { property: "og:description", content: "محتوى الدورة والدروس ومتابعة تقدمك." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: CourseDetail,
});

function CourseDetail() {
  const { id } = Route.useParams();
  const { data: c, isLoading } = useItem<any>("courses", id);
  const { data: mine = [] } = useMine<any>("course_enrollments");
  const actions = useActivityActions("course_enrollments");
  const e = mine.find((m: any) => m.course_id === id);

  if (isLoading) return <AppShell title="الدورة"><p className="text-center text-sm text-muted-foreground">جارٍ التحميل…</p></AppShell>;
  if (!c) return <AppShell title="الدورة"><p className="text-center">الدورة غير موجودة</p><Link to="/courses" className="mt-4 block text-center text-primary">العودة للدورات</Link></AppShell>;

  const lessons = Number(c.lessons) || 0;
  const done = e?.completed_lessons ?? 0;
  const pct = lessons ? Math.round((done / lessons) * 100) : 0;
  const embed = c.video_url ? toEmbedUrl(c.video_url) : null;

  return (
    <AppShell title="الدورة">
      <Link to="/courses" className="mb-3 inline-flex items-center gap-1 text-sm text-primary"><ArrowRight className="h-4 w-4" />كل الدورات</Link>
      <div className="rounded-2xl bg-hero p-5 text-primary-foreground shadow-soft">
        <span className="text-xs opacity-80">{c.category} · {lessons} درساً</span>
        <h2 className="mt-1 font-display text-2xl font-bold">{c.title}</h2>
        {e && (
          <div className="mt-4">
            <div className="h-2 rounded-full bg-primary-foreground/20"><div className="h-2 rounded-full bg-accent" style={{ width: `${pct}%` }} /></div>
            <p className="mt-1 text-xs">تقدمك: {pct}%</p>
          </div>
        )}
      </div>

      {c.description && (
        <section className="mt-4 rounded-2xl bg-card p-4">
          <h3 className="mb-2 font-bold">عن الدورة</h3>
          <p className="whitespace-pre-wrap text-sm text-muted-foreground">{c.description}</p>
        </section>
      )}

      {c.video_url && (
        <section className="mt-4 rounded-2xl bg-card p-4">
          <h3 className="mb-2 font-bold">الفيديو</h3>
          {!e ? (
            <p className="text-sm text-muted-foreground">سجّل في الدورة لمشاهدة الفيديو.</p>
          ) : embed ? (
            <iframe src={embed} title={c.title} className="aspect-video w-full rounded-xl" allowFullScreen />
          ) : (
            <a href={c.video_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-2 font-bold text-primary"><ExternalLink className="h-4 w-4" />فتح الفيديو</a>
          )}
        </section>
      )}

      {lessons > 0 && (
        <section className="mt-4 rounded-2xl bg-card p-4">
          <h3 className="mb-2 font-bold">الدروس</h3>
          <ul className="space-y-2">
            {Array.from({ length: lessons }, (_, i) => {
              const isDone = i < done;
              return (
                <li key={i}>
                  <button
                    disabled={!e}
                    onClick={() => e && actions.update(e.id, { completed_lessons: isDone ? i : i + 1 })}
                    className="flex w-full items-center gap-2 rounded-xl bg-muted/50 p-3 text-right text-sm disabled:opacity-60"
                  >
                    {isDone ? <CheckCircle2 className="h-5 w-5 text-primary" /> : <Circle className="h-5 w-5 text-muted-foreground" />}
                    الدرس {i + 1}
                  </button>
                </li>
              );
            })}
          </ul>
          {e && <p className="mt-2 text-xs text-muted-foreground">اضغط على الدرس لتحديده كمنجز.</p>}
        </section>
      )}

      <div className="mt-4">
        {e ? (
          <button onClick={() => confirm("إلغاء التسجيل؟") && actions.remove(e.id)} className="w-full rounded-xl border py-2 text-sm">إلغاء التسجيل</button>
        ) : (
          <button onClick={() => actions.add({ course_id: id })} className="flex w-full items-center justify-center gap-2 rounded-xl bg-primary py-3 font-bold text-primary-foreground"><PlayCircle className="h-5 w-5" />سجّل في الدورة</button>
        )}
      </div>
    </AppShell>
  );
}
