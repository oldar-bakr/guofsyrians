import { createFileRoute, Link } from "@tanstack/react-router";
import { CalendarDays, ShoppingBag, Building2, GraduationCap, Tag, Award } from "lucide-react";
import { NewsSlider } from "@/components/NewsSlider";
import { AppShell } from "@/components/AppShell";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/home")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "الرئيسية | تطبيق خدمات الطلاب" },
      { name: "description", content: "منصة واحدة لخدمات الطالب: تعليم، تسوق، مساعد ذكي، تخفيضات وفعاليات." },
      { property: "og:title", content: "تطبيق خدمات الطلاب" },
      { property: "og:description", content: "منصة واحدة لخدمات الطالب من الاتحاد العام لطلبة سوريا." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

const services = [
  { to: "/scholarships", label: "المنح", icon: Award },
  { to: "/courses", label: "الدورات", icon: GraduationCap },
  { to: "/market", label: "السوق", icon: ShoppingBag },
  { to: "/assistant", label: "المساعد الذكي", icon: Building2 },
  { to: "/deals", label: "التخفيضات", icon: Tag },
  { to: "/events", label: "الفعاليات", icon: CalendarDays },
  { to: "/union", label: "دليل الاتحاد", icon: Building2 },
] as const;

function Index() {
  return (
    <AppShell>
      <NewsSlider />

      <h3 className="mb-3 mt-7 font-display text-lg font-bold">الخدمات</h3>
      <div className="grid grid-cols-3 gap-3 sm:grid-cols-4 lg:grid-cols-7">
        {services.map(({ to, label, icon: Icon }) => (
          <Link key={to} to={to} className="flex flex-col items-center gap-2 rounded-2xl bg-card p-4 text-center text-sm shadow-soft">
            <span className="grid h-11 w-11 place-items-center rounded-full bg-secondary text-primary">{to === "/assistant" ? <img src={logo.url} alt="" className="h-8 w-8 object-contain" /> : <Icon className="h-5 w-5" />}</span>
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

    </AppShell>
  );
}
