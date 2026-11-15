import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { GraduationCap, IdCard, Tag, CalendarDays, ShoppingBag, Award, ArrowLeft, Store } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import { GoogleSignInButton } from "@/components/GoogleSignInButton";
import { ContactLinks } from "@/components/ContactLinks";
import logo from "@/assets/union-logo.png.asset.json";
import campus from "@/assets/union-students-campus.jpg";
import { Button } from "@/components/ui/button";

export const Route = createFileRoute("/")({
  staticData: { sitemap: true },
  head: () => ({
    meta: [
      { title: "تطبيق خدمات الطلاب | الاتحاد العام لطلبة سوريا" },
      { name: "description", content: "منصة واحدة لخدمات الطالب: بطاقة رقمية، دورات، تخفيضات، فعاليات، سوق ومساعد ذكي." },
      { property: "og:title", content: "تطبيق خدمات الطلاب | الاتحاد العام لطلبة سوريا" },
      { property: "og:description", content: "منصة واحدة لخدمات الطالب من الاتحاد العام لطلبة سوريا: بطاقة عضوية رقمية، دورات، تخفيضات، فعاليات، سوق ومساعد ذكي." },
      { property: "og:type", content: "website" },
      { property: "og:url", content: "https://guofsyrians.lovable.app/" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
    links: [{ rel: "canonical", href: "https://guofsyrians.lovable.app/" }],
  }),
  component: Landing,
});

const features = [
  { icon: CalendarDays, title: "فعاليات تجمعنا", desc: "لقاءات ونشاطات طلابية، ومساحة لتكوين علاقات جديدة." },
  { icon: Award, title: "فرص المنح", desc: "منح دراسية وشروط التقديم وروابط الجهات المانحة." },
  { icon: Tag, title: "تخفيضات للطلاب", desc: "عروض المتاجر والمقاهي والشركاء في مدينتك." },
  { icon: GraduationCap, title: "تعلّم وطوّر مهاراتك", desc: "دورات عربية ودروس قصيرة تناسب يومك الجامعي." },
  { icon: ShoppingBag, title: "من طالب إلى طالب", desc: "كتب وأجهزة ومستلزمات في سوق المجتمع الطلابي." },
  { icon: IdCard, title: "عضويتك معك", desc: "بطاقة رقمية ومعلومات عضويتك في مكان واحد." },
] as const;

function Landing() {
  const navigate = useNavigate();
  const [checking, setChecking] = useState(true);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const google = async () => {
    setBusy(true);
    setMsg("");
    const r = await lovable.auth.signInWithOAuth("google", { redirect_uri: window.location.origin });
    if (r.error) {
      setMsg("تعذّر الدخول عبر Google، جرّب مرة أخرى");
      setBusy(false);
      return;
    }
    if (r.redirected) return;
    navigate({ to: "/home" });
  };

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
      <header className="sticky top-0 z-30 border-b bg-background/95 backdrop-blur-md">
        <div className="mx-auto flex max-w-6xl items-center justify-between gap-3 px-4 py-3 sm:px-6">
          <Link to="/" className="flex min-w-0 items-center gap-2.5" aria-label="الاتحاد العام لطلبة سوريا — الرئيسية">
            <img src={logo.url} alt="شعار الاتحاد" width={44} height={44} className="h-11 w-11 shrink-0 object-contain" />
            <div className="min-w-0"><p className="font-display text-xs font-bold leading-5 text-primary sm:text-base">الاتحاد العام لطلبة سوريا</p><p className="text-[10px] text-muted-foreground sm:text-xs">مجتمع طلابي · فرص مشتركة</p></div>
          </Link>
          <nav aria-label="أقسام الصفحة" className="hidden items-center gap-6 text-sm text-muted-foreground lg:flex">
            <a href="#services" className="hover:text-primary">خدمات الطلاب</a><a href="#contribute" className="hover:text-primary">شارك بمهارتك</a><a href="#partners" className="hover:text-primary">شركاء الاتحاد</a><a href="#contact" className="hover:text-primary">تواصل معنا</a>
          </nav>
          <Button asChild className="shrink-0 rounded-full px-4 sm:px-5"><Link to="/auth">تسجيل الدخول<ArrowLeft /></Link></Button>
        </div>
      </header>

      <main>
        <section className="relative isolate overflow-hidden bg-primary text-primary-foreground">
          <img src={campus} alt="طلاب يتشاركون الحديث في حرم جامعي — صورة توضيحية" width={1536} height={1024} fetchPriority="high" className="absolute inset-0 -z-20 h-full w-full object-cover object-left" />
          <div className="absolute inset-0 -z-10 bg-primary/75 sm:bg-primary/65" />
          <div className="mx-auto flex min-h-[520px] max-w-6xl items-center px-5 py-10 sm:min-h-[540px] sm:px-6 sm:py-14">
            <div className="max-w-xl">
              <p className="mb-5 flex items-center gap-2 text-xs font-bold text-accent"><span className="h-px w-8 bg-accent" />معًا، لحياة جامعية أغنى</p>
              <h1 className="font-display text-3xl font-bold leading-[1.5] sm:text-5xl sm:leading-[1.45]">الاتحاد العام<br />لطلبة سوريا</h1>
              <p className="mt-4 max-w-md text-sm leading-7 text-primary-foreground/90 sm:text-base">مجتمعك الطلابي في تركيا. تعلّم، اكتشف الفرص، وابقَ قريبًا من زملائك واتحادك.</p>
              <div className="mt-7 flex max-w-sm flex-col gap-3">
                <Button asChild size="lg" className="h-12 justify-between bg-accent px-5 font-bold text-accent-foreground hover:bg-accent/90"><Link to="/auth">انضمّ إلى مجتمعك<ArrowLeft /></Link></Button>
                <GoogleSignInButton onClick={google} disabled={busy} />
                {msg && <p role="alert" className="text-sm">{msg}</p>}
              </div>
              <p className="mt-4 text-xs text-primary-foreground/80">لديك حساب؟ <Link to="/auth" className="font-bold underline underline-offset-4">أهلًا بعودتك</Link></p>
            </div>
          </div>
        </section>

        <section id="services" className="scroll-mt-24 bg-card">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
            <div className="mb-7 flex flex-wrap items-end justify-between gap-3"><div><p className="mb-2 text-xs font-bold text-primary">فرص أقرب إليك</p><h2 className="font-display text-2xl font-bold sm:text-3xl">كل ما يهمّ يومك الجامعي</h2></div><Button asChild variant="link" className="px-0"><Link to="/auth">اكتشف خدماتك<ArrowLeft /></Link></Button></div>
            <div className="grid gap-x-8 sm:grid-cols-2 lg:grid-cols-3">
              {features.map(({ icon: Icon, title, desc }) => <Link key={title} to="/auth" className="group flex gap-4 border-t py-6 outline-none focus-visible:ring-2 focus-visible:ring-ring"><span className="grid h-11 w-11 shrink-0 place-items-center rounded-lg bg-secondary text-primary transition-colors group-hover:bg-accent"><Icon className="h-5 w-5" /></span><div><h3 className="font-display text-base font-bold group-hover:text-primary">{title}</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">{desc}</p></div></Link>)}
            </div>
            <div className="flex items-center justify-between gap-4 border-t py-5"><div className="flex items-center gap-3"><img src={logo.url} alt="" width={32} height={32} className="h-8 w-8" /><p className="text-sm font-medium">لديك سؤال؟ مساعد الاتحاد معك</p></div><Button asChild variant="ghost" size="icon"><Link to="/auth" aria-label="تحدث مع مساعد الاتحاد"><ArrowLeft /></Link></Button></div>
          </div>
        </section>

        <section id="contribute" className="scroll-mt-24 border-b">
          <div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14">
            <p className="mb-2 text-xs font-bold text-primary">من المجتمع، للمجتمع</p><h2 className="font-display text-2xl font-bold sm:text-3xl">لديك شيء تشاركه؟</h2>
            <div className="mt-7 divide-y border-t">
              <section className="flex flex-col gap-4 py-7 sm:flex-row sm:items-center"><GraduationCap className="h-8 w-8 shrink-0 text-primary" /><div className="flex-1"><h3 className="font-display text-xl font-bold">قدّم دوراتك</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">شارك مهارتك بدورة لطلاب الاتحاد. تُنشر بعد مراجعة الإدارة.</p></div><Button asChild variant="outline" className="h-11 sm:w-auto"><Link to="/auth">سجّل وقدّم دورة<ArrowLeft /></Link></Button></section>
              <section className="flex flex-col gap-4 py-7 sm:flex-row sm:items-center"><ShoppingBag className="h-8 w-8 shrink-0 text-primary" /><div className="flex-1"><h3 className="font-display text-xl font-bold">قدّم منتجاتك</h3><p className="mt-2 text-sm leading-6 text-muted-foreground">امنح كتبك وأجهزتك فرصة جديدة في سوق الطلاب، بعد موافقة الإدارة.</p></div><Button asChild variant="outline" className="h-11 sm:w-auto"><Link to="/auth">سجّل وقدّم منتجًا<ArrowLeft /></Link></Button></section>
            </div>
          </div>
        </section>

        <section id="partners" className="scroll-mt-24 bg-primary text-primary-foreground">
          <div className="mx-auto flex max-w-6xl flex-col gap-6 px-5 py-10 sm:px-6 md:flex-row md:items-center md:py-14"><div className="flex-1"><Store className="mb-4 h-7 w-7 text-accent" /><p className="mb-2 text-xs text-accent">شركاء المجتمع الطلابي</p><h2 className="font-display text-2xl font-bold sm:text-3xl">متجرك أقرب إلى الطلاب</h2><p className="mt-3 max-w-xl text-sm leading-7 text-primary-foreground/85">لديك مطعم أو مقهى أو متجر؟ انضمّ إلى شركاء الاتحاد، وقدّم عروضك للطلاب بعد اعتماد نشاطك.</p></div><Button asChild size="lg" className="h-12 bg-accent text-accent-foreground hover:bg-accent/90"><Link to="/auth" search={{ as: "business" }}>دخول أصحاب الأعمال<ArrowLeft /></Link></Button></div>
        </section>

        <section id="contact" className="scroll-mt-24 bg-card"><div className="mx-auto max-w-6xl px-5 py-10 sm:px-6 sm:py-14"><h2 className="font-display text-2xl font-bold">لنَبقَ على تواصل</h2><p className="mb-6 mt-2 text-sm text-muted-foreground">للعضوية، الاستفسارات، والتعاون مع الاتحاد.</p><ContactLinks /></div></section>
      </main>
      <footer className="border-t"><div className="mx-auto flex max-w-6xl flex-wrap items-center justify-between gap-3 px-5 py-6 sm:px-6"><p className="font-display text-sm font-bold text-primary">الاتحاد العام لطلبة سوريا</p><p className="text-xs text-muted-foreground">معًا، نبني مجتمعنا الطلابي.</p></div></footer>
    </div>
  );
}
