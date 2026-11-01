import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ShoppingBag, Building2, GraduationCap, Tag, Sparkles } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStudent } from "@/lib/profile";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/")({
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
        <p className="text-sm opacity-80">مرحباً،</p>
        <h2 className="font-display text-2xl font-bold">{student.name}</h2>
        <p className="mt-1 text-sm opacity-80">{student.university} · {student.city}</p>
        <Link to="/card" className="mt-4 inline-block rounded-full bg-accent px-4 py-2 text-sm font-bold text-accent-foreground">
          عرض بطاقتي الرقمية
        </Link>
      </section>

      <h3 className="mb-3 mt-7 font-display text-lg font-bold">الخدمات</h3>
      <div className="grid grid-cols-3 gap-3">
        {services.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center text-sm shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary"><Icon className="h-5 w-5" /></span>
            {label}
          </Link>
        ))}
      </div>

      <h3 className="mb-3 mt-7 font-display text-lg font-bold">آخر الأخبار</h3>
      <ul className="space-y-3">
        {news.map((n) => (
          <li key={n.title} className="rounded-2xl border-r-4 border-accent bg-card p-4">
            <p className="font-medium">{n.title}</p>
            <p className="mt-1 text-xs text-muted-foreground">{n.date}</p>
          </li>
        ))}
      </ul>
    </AppShell>
  );
}
