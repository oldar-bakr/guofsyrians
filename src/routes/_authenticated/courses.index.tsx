import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Search, SlidersHorizontal, PlayCircle, ArrowLeft, RotateCcw } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
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
  const [filtersOpen, setFiltersOpen] = useState(false);
  const activeFilters = Number(Boolean(category)) + Number(scope !== "all") + Number(sort !== "newest");
  const resetFilters = () => { setCategory(""); setScope("all"); setSort("newest"); };
  const categories = [...new Set(courses.map((c) => String(c.category || "بدون تصنيف")))].sort();
  const list = courses.filter((c) => (!category || (c.category || "بدون تصنيف") === category) && (scope !== "mine" || mine.some((e) => e.course_id === c.id)) && `${c.title} ${c.description} ${c.instructor} ${c.category}`.toLocaleLowerCase().includes(query.trim().toLocaleLowerCase())).sort((a, b) => sort === "title" ? a.title.localeCompare(b.title, "ar") : sort === "lessons" ? a.lessons - b.lessons : Date.parse(b.created_at) - Date.parse(a.created_at));
  return <AppShell title="الدورات">
    <div className="mb-5 space-y-3 border-b pb-5">
      <h2 className="font-display text-2xl font-bold">الدورات التعليمية</h2>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2">
        <label className="relative min-w-0"><span className="sr-only">البحث عن دورة</span><Search className="absolute right-3 top-3 h-4 w-4 text-muted-foreground" /><input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="ابحث عن دورة أو مدرّب…" className="h-10 w-full rounded-lg border bg-card pr-9 pl-3 text-sm" /></label>
        <Popover open={filtersOpen} onOpenChange={setFiltersOpen}>
          <PopoverTrigger asChild><Button variant={activeFilters ? "secondary" : "outline"} size="icon" className="relative h-10 w-10 shrink-0" aria-label={activeFilters ? `الفلاتر، ${activeFilters} مفعّلة` : "الفلاتر"} title="الفلاتر"><SlidersHorizontal />{activeFilters > 0 && <span className="absolute -left-1 -top-1 grid h-4 w-4 place-items-center rounded-full bg-primary text-[10px] text-primary-foreground" aria-hidden="true">{activeFilters}</span>}</Button></PopoverTrigger>
          <PopoverContent align="end" dir="rtl" className="w-80 max-w-[calc(100vw-2rem)] space-y-4" aria-label="فلاتر الدورات">
            <div className="flex items-center justify-between gap-3"><h3 className="text-sm font-bold">تصفية الدورات</h3><Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" disabled={!activeFilters} onClick={resetFilters} aria-label="إعادة ضبط الفلاتر" title="إعادة ضبط الفلاتر"><RotateCcw /></Button></div>
            <div className="space-y-1.5"><label htmlFor="course-category" className="text-xs text-muted-foreground">التصنيف</label><Select dir="rtl" value={category || "all"} onValueChange={(v) => setCategory(v === "all" ? "" : v)}><SelectTrigger id="course-category" className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل التصنيفات</SelectItem>{categories.map((c) => <SelectItem key={c} value={c}>{c}</SelectItem>)}</SelectContent></Select></div>
            <div className="space-y-1.5"><label htmlFor="course-scope" className="text-xs text-muted-foreground">عرض الدورات</label><Select dir="rtl" value={scope} onValueChange={setScope}><SelectTrigger id="course-scope" className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">كل الدورات</SelectItem><SelectItem value="mine">دوراتي المسجّلة</SelectItem></SelectContent></Select></div>
            <div className="space-y-1.5"><label htmlFor="course-sort" className="text-xs text-muted-foreground">الترتيب</label><Select dir="rtl" value={sort} onValueChange={setSort}><SelectTrigger id="course-sort" className="h-10"><SelectValue /></SelectTrigger><SelectContent><SelectItem value="newest">الأحدث أولاً</SelectItem><SelectItem value="title">حسب الاسم</SelectItem><SelectItem value="lessons">الأقل دروساً</SelectItem></SelectContent></Select></div>
            <Button className="w-full" onClick={() => setFiltersOpen(false)}>عرض النتائج ({list.length})<ArrowLeft /></Button>
          </PopoverContent>
        </Popover>
      </div>
      <div className="grid grid-cols-[minmax(0,1fr)_auto] items-center gap-2"><p className="min-w-0 truncate text-xs text-muted-foreground">{list.length} دورة{category && ` · ${category}`}{scope === "mine" && " · دوراتي المسجّلة"}</p>{(query || activeFilters > 0) && <Button variant="ghost" size="sm" className="h-7 shrink-0 text-xs" onClick={() => { setQuery(""); resetFilters(); }}><RotateCcw className="h-3 w-3" />مسح</Button>}</div>
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
