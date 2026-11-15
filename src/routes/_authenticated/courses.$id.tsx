import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { PlayCircle, CheckCircle2, ArrowRight, ExternalLink } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ContentImages } from "@/components/ContentImages";
import { CourseQuiz } from "@/components/CourseQuiz";
import { useItem, toEmbedUrl } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";
export const Route = createFileRoute("/_authenticated/courses/$id")({
 staticData: { sitemap: false },
 head: () => ({ meta: [
  { title: "تفاصيل الدورة والدروس | الاتحاد العام لطلبة سوريا" },
  { name: "description", content: "شاهد مقدمة الدورة وسجّل للدروس والاختبارات ومتابعة تقدمك." },
  { property: "og:title", content: "تفاصيل الدورة والدروس | الاتحاد العام لطلبة سوريا" },
  { property: "og:description", content: "مقدمة الدورة وفيديوهات الدروس والاختبارات." },
  { property: "og:type", content: "article" }, { name: "twitter:card", content: "summary" },
 ] }), component: CourseDetail,
});
function Video({ url, title }: { url: string; title: string }) {
 const embed = toEmbedUrl(url);
 if (embed) return <iframe src={embed} title={title} className="aspect-video w-full rounded-lg border-0 bg-muted" allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
 if (/^https?:\/\//i.test(url)) return <Button asChild variant="outline"><a href={url} target="_blank" rel="noopener noreferrer"><ExternalLink />فتح الفيديو</a></Button>;
 return <p className="text-muted-foreground">الفيديو غير متاح</p>;
}
function CourseDetail() {
 const { id } = Route.useParams();
 const { data: c, isLoading } = useItem<any>("courses", id);
 const { data: mine = [] } = useMine<any>("course_enrollments");
 const actions = useActivityActions("course_enrollments");
 const e = mine.find((m) => m.course_id === id);
 const [selected, setSelected] = useState<number | null>(null);
 const [busy, setBusy] = useState(false);
 const [error, setError] = useState("");
 const run = async (action: () => Promise<void>) => { setBusy(true); setError(""); try { await action(); } catch { setError("تعذّر الحفظ، حاول مجدداً"); } finally { setBusy(false); } };
 if (isLoading) return <AppShell title="الدورة"><LoadingSkeleton variant="detail" /></AppShell>;
 if (!c) return <AppShell title="الدورة"><p>الدورة غير موجودة</p><Link to="/courses">العودة للدورات</Link></AppShell>;
 const lessons = Math.max(0, Math.min(100, Number(c.lessons) || 0));
 const done = Math.min(lessons, e?.completed_lessons ?? 0);
 const lesson = e ? selected : null;
 const url = lesson !== null ? c.lesson_videos?.[lesson] : c.video_url;
 return <AppShell title="الدورة">
  <Link to="/courses" className="mb-4 inline-flex items-center gap-2 text-sm text-primary"><ArrowRight className="h-4 w-4" />كل الدورات</Link>
  <header className="mb-5"><p className="text-sm text-primary">{c.category} · {lessons} دروس</p><h2 className="mt-1 font-display text-2xl font-bold">{c.title}</h2>{c.instructor && <p className="mt-1 text-sm text-muted-foreground">المدرّب: {c.instructor}</p>}</header>
  <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_300px]">
   <div className="min-w-0">
    {url ? <Video key={url} url={url} title={lesson !== null ? `فيديو الدرس ${lesson + 1}` : `مقدمة ${c.title}`} /> : c.images?.length ? <ContentImages paths={c.images} title={c.title} /> : <div className="grid aspect-video place-items-center rounded-lg bg-secondary"><PlayCircle className="h-16 w-16 text-primary" /></div>}
    <div className="mt-3 flex flex-wrap items-center justify-between gap-2"><h3 className="font-bold">{lesson !== null ? `الدرس ${lesson + 1}` : "مقدمة الدورة"}</h3>{lesson !== null && <Button variant="ghost" size="sm" onClick={() => setSelected(null)}>عرض المقدمة</Button>}</div>
    {e && lesson !== null && <Button disabled={busy} variant="outline" className="mt-3" onClick={() => run(() => actions.update(e.id, { completed_lessons: lesson < done ? lesson : lesson + 1 }))}><CheckCircle2 />{lesson < done ? "إلغاء إنجاز الدرس" : "أنهيت هذا الدرس"}</Button>}
    {c.description && <section className="mt-6 border-t pt-5"><h3 className="mb-2 font-bold">عن الدورة</h3><p className="whitespace-pre-wrap text-sm leading-7 text-muted-foreground">{c.description}</p></section>}
    <CourseQuiz key={id} courseId={id} enrolled={Boolean(e)} />
   </div>
   <aside className="space-y-5 lg:sticky lg:top-24">
    <div className="space-y-3 border-b pb-5">{e ? <><p className="font-bold text-primary">أنت مسجّل في الدورة</p><progress aria-label="تقدم الدورة" value={done} max={lessons || 1} className="h-2 w-full accent-primary" /><p className="text-xs text-muted-foreground">أنجزت {done} من {lessons} دروس</p><Button disabled={busy} variant="outline" className="w-full" onClick={() => { if (confirm("إلغاء التسجيل؟")) void run(async () => { await actions.remove(e.id); setSelected(null); }); }}>إلغاء التسجيل</Button></> : <Button className="w-full" disabled={busy} onClick={() => run(() => actions.add({ course_id: id }))}><PlayCircle />سجّل في الدورة</Button>}{error && <p role="alert" className="text-sm text-destructive">{error}</p>}</div>
    <section><h3 className="mb-3 font-bold">الدروس</h3><ol className="space-y-2">{Array.from({ length: lessons }, (_, i) => <li key={i}><Button variant={lesson === i ? "secondary" : "outline"} className="h-auto w-full justify-start whitespace-normal py-3 text-right" disabled={!e || !c.lesson_videos?.[i]} onClick={() => setSelected(i)}>{i < done ? <CheckCircle2 /> : <PlayCircle />}<span>الدرس {i + 1}{!c.lesson_videos?.[i] && <span className="block text-xs font-normal">الفيديو غير متاح بعد</span>}</span></Button></li>)}</ol></section>
   </aside>
  </div>
 </AppShell>;
}
