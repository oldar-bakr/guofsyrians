import { createFileRoute } from "@tanstack/react-router";
import { PlayCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/courses")({
  head: () => ({
    meta: [
      { title: "الدورات التعليمية | تطبيق خدمات الطلاب" },
      { name: "description", content: "دورات مصنفة بالفيديو مع متابعة التقدم." },
      { property: "og:title", content: "بوابة الدورات التعليمية" },
      { property: "og:description", content: "دورات بالفيديو للطلاب." },
    ],
  }),
  component: Courses,
});

function Courses() {
  const { data: courses = [] } = useContent<any>("courses");
  return (
    <AppShell title="الدورات">
      <div className="space-y-4">
        {courses.map((c) => (
          <article key={c.title} className="rounded-2xl bg-card p-4 shadow-soft">
            <div className="flex items-start gap-3">
              <span className="grid h-12 w-12 shrink-0 place-items-center rounded-xl bg-hero text-primary-foreground"><PlayCircle /></span>
              <div className="flex-1">
                <span className="text-xs font-bold text-accent-foreground">{c.category} · {c.lessons} درساً</span>
                <h3 className="font-bold">{c.title}</h3>
              </div>
            </div>
            {(c.progress ?? 0) > 0 ? (
              <div className="mt-3">
                <div className="h-2 rounded-full bg-muted"><div className="h-2 rounded-full bg-primary" style={{ width: `${c.progress}%` }} /></div>
                <p className="mt-1 text-xs text-muted-foreground">أنجزت {c.progress}%</p>
              </div>
            ) : (
              <button className="mt-3 w-full rounded-xl bg-primary py-2 text-sm font-bold text-primary-foreground">سجّل في الدورة</button>
            )}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
