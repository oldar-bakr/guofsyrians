import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ShoppingBag, Building2, GraduationCap, Tag, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStudent } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/home")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "الرئيسية | تطبيق خدمات الطلاب" },
      { name: "description", content: "منصة واحدة لخدمات الطالب: تعليم، تسوق، مساعد ذكي، تخفيضات وفعاليات." },
      { property: "og:title", content: "تطبيق خدمات الطلاب" },
      { property: "og:description", content: "منصة واحدة لخدمات الطالب من الاتحاد العام لطلبة سوريا." },
    ],
  }),
  component: Index,
});

const services = [
  { to: "/courses", label: "الدورات", icon: GraduationCap },
  { to: "/market", label: "السوق", icon: ShoppingBag },
  { to: "/assistant", label: "المساعد الذكي", icon: Sparkles },
  { to: "/deals", label: "التخفيضات", icon: Tag },
  { to: "/events", label: "الفعاليات", icon: CalendarDays },
  { to: "/union", label: "دليل الاتحاد", icon: Building2 },
] as const;

function Index() {
  const student = useStudent();
  const { data: news = [] } = useContent<any>("news");
  return (
    <AppShell>
      <section className="bg-hero rounded-3xl p-6 text-primary-foreground shadow-soft">
        <div className="flex items-center gap-3">
          <Avatar path={student.avatar} name={student.name} university={student.university} className="h-12 w-12" />
          <div className="min-w-0">
            <p className="text-sm opacity-80">مرحباً،</p>
            <h2 className="font-display text-2xl font-bold">{student.name}</h2>
          </div>
        </div>
        <p className="mt-1 text-sm opacity-80">{student.university} · {student.city}</p>
        <Link to="/card" className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">
          عرض بطاقتي الرقمية
        </Link>
      </section>

      <h3 className="mb-3 mt-7 font-display text-lg font-bold">الخدمات</h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-6">
        {services.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center text-sm shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
            {label}
          </Link>
        ))}
      </div>

      <section className="mt-7 flex flex-col items-center gap-3 rounded-3xl border-2 border-accent bg-card p-5 text-center shadow-soft sm:flex-row sm:text-right">
        <GraduationCap className="h-10 w-10 shrink-0 text-primary" />
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold">قدّم دوراتك</h3>
          <p className="text-sm text-muted-foreground">علّم زملاءك مهارة — تُنشر دورتك بعد موافقة الإدارة.</p>
        </div>
        <Link to="/contribute/courses" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">قدّم دورة</Link>
      </section>

      <section className="mt-4 flex flex-col items-center gap-3 rounded-3xl border-2 border-accent bg-card p-5 text-center shadow-soft sm:flex-row sm:text-right">
        <ShoppingBag className="h-10 w-10 shrink-0 text-primary" />
        <div className="flex-1">
          <h3 className="font-display text-lg font-bold">قدّم منتجاتك</h3>
          <p className="text-sm text-muted-foreground">اعرض منتجك في سوق الطلاب — يُنشر بعد موافقة الإدارة.</p>
        </div>
        <Link to="/contribute/products" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground">انشر منتج</Link>
      </section>

      <div className="mb-3 mt-7 flex items-center justify-between"><h3 className="font-display text-lg font-bold">آخر الأخبار</h3><Link to="/news" className="text-sm text-primary">عرض الكل</Link></div>
      <ul className="grid gap-3 md:grid-cols-2">
        {news.map((n: any) => (
          <li key={n.id} className="rounded-2xl border-r-4 border-accent bg-card p-4">
            <Link to="/news/$id" params={{ id: n.id }} className="block w-full text-right">
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{n.date} · اقرأ المزيد</p>
            </Link>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
