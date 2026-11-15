import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal, PlayCircle, ArrowLeft } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { ContentImages } from "@/components/ContentImages";
import { useContent, approvedOnly } from "@/lib/content";
import { useMine } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/courses/")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "الدورات التعليمية | الاتحاد العام لطلبة سوريا" },
    { name: "description", content: "تصفح الدورات حسب التصنيف وابحث عن دورة وابدأ التعلم." },
    { property: "og:title", content: "الدورات التعليمية | الاتحاد العام لطلبة سوريا" },
    { property: "og:description", content: "دورات ودروس بالفيديو للطلاب مع البحث والتصنيفات." },
    { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" },
  ] }), component: Courses,
});
function Courses() {
  const { data: all = [], isLoading } = useContent<any>("courses");
  const courses = approvedOnly(all);
  const { data: mine = [] } = useMine<any>("course_enrollments");
  const [query, setQuery] = useState("");
  const [category, setCategory] = useState("");
  const [scope, setScope] = useState("all");
  const [sort, setSort] = useState("newest");
  const categories = [...new Set(courses.map((c) => String(c.category || "بدون تصنيف")))].sort();
  const list = courses.filter((c) => (!category || (c.category || "بدون تصنيف") === category) && (scope !== "mine" || mine.some((e) => e.course_id === c.id)) && `${c.title} ${c.description} ${c.instructor} ${c.category}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "ar") : sort === "lessons" ? a.lessons - b.lessons : Date.parse(b.created_at) - Date.parse(a.created_at));
  return <AppShell title="الدورات">
    <div className="mb-5 space-y-3 border-b pb-5">
      <h2 className="font-display text-2xl font-bold">الدورات التعليمية</h2>
      <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <label className="relative sm:col-span-2 lg:col-span-1"><span className="sr-only">البحث عن دورة</span><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن دورة أو مدرّب…" className="h-10 w-full rounded-lg border bg-card pr-9 pl-3 text-sm" /></label>
        <label className="text-sm"><span className="sr-only">التصنيف</span><select aria-label="التصنيف" value={category} onChange={(e) => setCategory(e.target.value)} className="h-10 w-full rounded-lg border bg-card px-3"><option value="">كل التصنيفات</option>{categories.map((c) => <option key={c}>{c}</option>)}</select></label>
        <select aria-label="عرض الدورات" value={scope} onChange={(e) => setScope(e.target.value)} className="h-10 rounded-lg border bg-card px-3 text-sm"><option value="all">كل الدورات</option><option value="mine">دوراتي المسجّلة</option></select>
        <select aria-label="ترتيب الدورات" value={sort} onChange={(e) => setSort(e.target.value)} className="h-10 rounded-lg border bg-card px-3 text-sm"><option value="newest">الأحدث أولاً</option><option value="title">حسب الاسم</option><option value="lessons">الأقل دروساً</option></select>
      </div>
      <div className="flex items-center justify-between"><p className="text-sm text-muted-foreground">{list.length} دورة</p>{(query || category || scope !== "all" || sort !== "newest") && <Button variant="ghost" size="sm" onClick={() => { setQuery(""); setCategory(""); setScope("all"); setSort("newest"); }}><SlidersHorizontal />مسح الفلاتر</Button>}</div>
    </div>
    <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
      {list.map((c) => <Link key={c.id} to="/courses/$id" params={{ id: c.id }} className="group flex flex-col overflow-hidden rounded-lg border bg-card transition-shadow hover:shadow-soft">
        {c.images?.length ? <ContentImages paths={c.images} title={c.title} cover /> : <div className="grid aspect-[16/7] place-items-center bg-secondary text-primary"><PlayCircle className="h-12 w-12" /></div>}
        <div className="flex flex-1 flex-col gap-2 p-4"><p className="text-xs font-bold text-primary">{c.category || "بدون تصنيف"} · {c.lessons} دروس</p><h3 className="font-display text-lg font-bold group-hover:text-primary">{c.title}</h3>{c.instructor && <p className="text-xs text-muted-foreground">{c.instructor}</p>}{c.description && <p className="line-clamp-2 text-sm text-muted-foreground">{c.description}</p>}<span className="mt-auto flex items-center justify-between pt-2 text-sm font-bold text-primary">{mine.some((e) => e.course_id === c.id) ? "متابعة التعلم" : "تفاصيل الدورة"}<ArrowLeft className="h-4 w-4" /></span></div>
      </Link>)}
    </div>
    {isLoading && <p>جارٍ تحميل الدورات…</p>}{!isLoading && !list.length && <p className="py-12 text-center text-muted-foreground">لا توجد دورات مطابقة للفلاتر</p>}
  </AppShell>;
}
