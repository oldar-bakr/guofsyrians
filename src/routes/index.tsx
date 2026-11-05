import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, IdCard, Tag, CalendarDays, ShoppingBag, Sparkles, Building2, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "تطبيق خدمات الطلاب | الاتحاد العام لطلبة سوريا" },
      { name: "description", content: "منصة واحدة لخدمات الطالب: بطاقة رقمية، دورات، تخفيضات، فعاليات، سوق ومساعد ذكي." },
      { property: "og:title", content: "تطبيق خدمات الطلاب" },
      { property: "og:description", content: "منصة واحدة لخدمات الطالب من الاتحاد العام لطلبة سوريا." },
    ],
  }),
  component: Landing,
});

const features = [
  { icon: IdCard, title: "بطاقة عضوية رقمية", desc: "بطاقتك الطلابية مع رمز تحقق، دائماً معك على هاتفك" },
  { icon: GraduationCap, title: "دورات تدريبية", desc: "سجّل في الدورات وتابع تقدمك درساً درساً" },
  { icon: Tag, title: "تخفيضات حصرية", desc: "عروض خاصة للطلاب في مدينتك مع رمز استخدام شخصي" },
  { icon: CalendarDays, title: "فعاليات ونشاطات", desc: "سجّل حضورك في فعاليات الاتحاد بضغطة واحدة" },
  { icon: ShoppingBag, title: "سوق الطلاب", desc: "اطلب منتجات ومستلزمات طلابية وتابع حالة طلبك" },
  { icon: Sparkles, title: "مساعد ذكي", desc: "اسأل عن خدمات الاتحاد وفعالياته واحصل على إجابة فورية" },
] as const;

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) return setChecking(false);
      // Business owners without a student profile go to their own dashboard.
      Promise.all([
        supabase.from("profiles").select("id").eq("id", data.user.id).maybeSingle(),
        supabase.from("businesses").select("id").eq("owner_id", data.user.id).maybeSingle(),
      ]).then(([p, b]) => navigate({ to: !p.data && b.data ? "/business" : "/home", replace: true }));
    });
  }, [navigate]);

  if (checking) {
    return <div className="grid min-h-screen place-items-center bg-muted"><img src={logo.url} alt="شعار الاتحاد" className="h-20 animate-pulse" /></div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="sticky top-0 z-10 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-5 py-3">
          <div className="flex items-center gap-2">
            <img src={logo.url} alt="شعار الاتحاد" className="h-10 w-10 object-contain" />
            <div>
              <p className="font-display text-sm font-bold text-primary">الاتحاد العام لطلبة سوريا</p>
              <p className="text-xs text-muted-foreground">تطبيق خدمات الطلاب</p>
            </div>
          </div>
          <Link to="/auth" className="rounded-full bg-primary px-5 py-2 text-sm font-bold text-primary-foreground shadow-soft">
            تسجيل الدخول
          </Link>
        </div>
      </header>

      <section className="bg-hero text-primary-foreground">
        <div className="mx-auto grid max-w-6xl items-center gap-8 px-5 py-16 md:grid-cols-2 md:py-24">
          <div>
            <h1 className="font-display text-3xl font-bold leading-snug md:text-5xl">
              كل خدماتك الطلابية<br />في تطبيق واحد
            </h1>
            <p className="mt-4 max-w-md text-sm leading-relaxed opacity-90 md:text-base">
              بطاقتك الرقمية، دوراتك، تخفيضاتك، فعالياتك وسوقك — منصة الاتحاد العام لطلبة سوريا تجمع كل ما يحتاجه الطالب في مكان واحد.
            </p>
            <div className="mt-6 flex flex-wrap gap-3">
              <Link to="/auth" className="rounded-full bg-accent px-6 py-3 font-bold text-accent-foreground shadow-soft">
                ابدأ الآن — إنشاء حساب
              </Link>
              <Link to="/auth" className="rounded-full border border-primary-foreground/40 px-6 py-3 font-bold">
                لدي حساب — دخول
              </Link>
            </div>
          </div>
          <div className="mx-auto w-full max-w-xs rounded-3xl bg-card/10 p-6 text-center backdrop-blur">
            <img src={logo.url} alt="شعار الاتحاد العام لطلبة سوريا" className="mx-auto h-40 object-contain md:h-52" />
          </div>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <h2 className="text-center font-display text-2xl font-bold md:text-3xl">ماذا يقدم لك التطبيق؟</h2>
        <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {features.map(({ icon: Icon, title, desc }) => (
            <div key={title} className="rounded-3xl bg-card p-6 shadow-soft">
              <span className="grid h-12 w-12 place-items-center rounded-2xl bg-secondary text-primary"><Icon className="h-6 w-6" /></span>
              <h3 className="mt-4 font-display text-lg font-bold">{title}</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      <section className="bg-member text-primary-foreground">
        <div className="mx-auto flex max-w-6xl flex-col items-center gap-4 px-5 py-14 text-center">
          <Building2 className="h-10 w-10" />
          <h2 className="font-display text-2xl font-bold md:text-3xl">انضم إلى اتحادك اليوم</h2>
          <p className="max-w-lg text-sm opacity-90">أنشئ حسابك، أكمل بياناتك الطلابية، واحصل على بطاقة عضويتك الرقمية فوراً.</p>
          <Link to="/auth" className="mt-2 rounded-full bg-accent px-8 py-3 font-bold text-accent-foreground shadow-soft">
            تسجيل الدخول / إنشاء حساب
          </Link>
        </div>
      </section>

      <section className="mx-auto max-w-6xl px-5 py-14">
        <div className="flex flex-col items-center gap-4 rounded-3xl border-2 border-accent bg-card p-8 text-center shadow-soft md:flex-row md:text-right">
          <Store className="h-12 w-12 shrink-0 text-primary" />
          <div className="flex-1">
            <h2 className="font-display text-2xl font-bold">هل لديك مطعم أو مقهى أو متجر؟</h2>
            <p className="mt-1 text-sm text-muted-foreground">سجّل نشاطك التجاري، انشر تخفيضاتك لطلاب الاتحاد، وامسح رموزهم للتحقق من عضويتهم.</p>
          </div>
          <Link to="/auth" search={{ as: "business" }} className="rounded-full bg-primary px-6 py-3 font-bold text-primary-foreground shadow-soft">دخول أصحاب الأعمال</Link>
        </div>
      </section>

      <footer className="border-t py-6 text-center text-xs text-muted-foreground">
        الاتحاد العام لطلبة سوريا — تطبيق خدمات الطلاب
      </footer>
    </div>
  );
}
