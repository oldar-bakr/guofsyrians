import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PlayCircle, ChevronDown } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useContent, approvedOnly } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/courses/")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "الدورات التعليمية | تطبيق خدمات الطلاب" },
      { name: "description", content: "دورات مصنفة بالفيديو مع التسجيل ومتابعة التقدم." },
      { property: "og:title", content: "بوابة الدورات التعليمية" },
      { property: "og:description", content: "دورات بالفيديو للطلاب." },
    ],
  }),
  component: Courses,
});

function Courses() {
  const { data: allcourses = [] } = useContent<any>("courses");
  const courses = approvedOnly(allcourses);
  const { data: mine = [] } = useMine<any>("course_enrollments");
  const actions = useActivityActions("course_enrollments");
  const [open, setOpen] = useState<string | null>(null);
  const [filter, setFilter] = useState<"all" | "mine">("all");

  const list = filter === "mine" ? courses.filter((c: any) => mine.some((m: any) => m.course_id === c.id)) : courses;

  return (
    <AppShell title="الدورات">
      <div className="mb-4 flex gap-2">
        {(["all", "mine"] as const).map((f) => (
          <button key={f} onClick={() => setFilter(f)} className={`rounded-full px-4 py-1.5 text-sm ${filter === f ? "bg-primary text-primary-foreground" : "bg-card"}`}>
            {f === "all" ? "كل الدورات" : `دوراتي (${mine.length})`}
          </button>
        ))}
      </div>
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {list.map((c: any) => {
          const e = mine.find((m: any) => m.course_id === c.id);
          const pct = e && c.lessons ? Math.round((e.completed_lessons / c.lessons) * 100) : 0;
          const isOpen = open === c.id;
          return (
            <article key={c.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <button onClick={() => setOpen(isOpen ? null : c.id)} className="flex w-full items-start gap-3 text-right">
                <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-hero text-primary-foreground"><PlayCircle /></span>
                <div className="flex-1">
                  <span className="text-xs font-bold text-accent-foreground">{c.category} · {c.lessons} درساً</span>
                  <h3 className="font-bold">{c.title}</h3>
                </div>
                <ChevronDown className={`h-5 w-5 transition ${isOpen ? "rotate-180" : ""}`} />
              </button>
              {isOpen && (
                <div className="mt-3 space-y-3 text-sm">
                  <Link to="/courses/$id" params={{ id: c.id }} className="block rounded-xl bg-secondary py-2 text-center font-bold text-primary">صفحة الدورة والدروس</Link>
                  {c.description && <p className="text-muted-foreground">{c.description}</p>}
                  {e && c.video_url && (
                    <a href={c.video_url} target="_blank" rel="noreferrer" className="flex items-center justify-center gap-2 rounded-xl bg-secondary py-2 font-bold text-primary">
                      <PlayCircle className="h-4 w-4" />مشاهدة الفيديو
                    </a>
                  )}
                </div>
              )}
              {e ? (
                <div className="mt-3">
                  <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${pct}%` }} /></div>
                  <div className="mt-2 flex items-center justify-between text-xs">
                    <span className="text-muted-foreground">أنجزت {e.completed_lessons} من {c.lessons} ({pct}%)</span>
                    <div className="flex gap-2">
                      {e.completed_lessons < c.lessons && (
                        <button onClick={() => actions.update(e.id, { completed_lessons: e.completed_lessons + 1 })} className="rounded-full bg-primary px-3 py-1 font-bold text-primary-foreground">أنهيت درساً</button>
                      )}
                      <button onClick={() => confirm("إلغاء التسجيل؟") && actions.remove(e.id)} className="rounded-full border px-3 py-1">إلغاء</button>
                    </div>
                  </div>
                </div>
              ) : (
                <button onClick={() => actions.add({ course_id: c.id })} className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground">سجّل في الدورة</button>
              )}
            </article>
          );
        })}
        {list.length === 0 && <p className="text-center text-sm text-muted-foreground">لا توجد دورات بعد</p>}
      </div>
    </AppShell>
  );
}
