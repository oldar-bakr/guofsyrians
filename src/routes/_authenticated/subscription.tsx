import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Check, CircleCheck, CreditCard, FlaskConical, RotateCcw, ShieldCheck, XCircle } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogTitle } from "@/components/ui/dialog";
import { useMyProfile } from "@/lib/profile";
import { DEMO_PLAN, simulateSubscription, type DemoOutcome } from "@/lib/subscription-demo";

export const Route = createFileRoute("/_authenticated/subscription")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "الاشتراك الشهري التجريبي | اتحاد الطلبة" },
    { name: "description", content: "تجربة الاشتراك الشهري بقيمة 100 ليرة تركية دون دفع حقيقي." },
    { property: "og:title", content: "الاشتراك التجريبي | اتحاد الطلبة" },
    { property: "og:description", content: "محاكاة الاشتراك الشهري للطلاب دون تفعيل عضوية حقيقية." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: SubscriptionPage,
});

function SubscriptionPage() {
  const { data: profile } = useMyProfile();
  const [open, setOpen] = useState(false);
  const [result, setResult] = useState<ReturnType<typeof simulateSubscription> | null>(null);
  const complete = (outcome: DemoOutcome) => {
    setResult(simulateSubscription(outcome));
    setOpen(false);
  };

  return <AppShell title="الاشتراك">
    <div className="mx-auto max-w-2xl">
      <Button asChild variant="link" className="mb-4 px-0"><Link to="/profile">العودة إلى ملفي</Link></Button>
      <div className="flex items-center gap-2 text-sm font-bold text-primary"><FlaskConical className="size-4" /> تجربة فقط — دون أموال حقيقية</div>
      <h2 className="mt-3 font-display text-3xl font-bold">اشتراك الطالب</h2>
      <p className="mt-2 text-muted-foreground">عضويتك الشهرية في الاتحاد العام لطلبة سوريا</p>

      <section className="mt-6 border-y py-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div><h3 className="text-lg font-bold">الباقة الشهرية</h3><p className="mt-1 text-sm text-muted-foreground">للطلاب المسجّلين</p></div>
          <div className="flex items-baseline gap-2"><strong className="font-display text-5xl text-primary">{DEMO_PLAN.amount}</strong><span className="text-sm text-muted-foreground">ليرة تركية / شهر</span></div>
        </div>
        <ul className="mt-6 grid gap-3 text-sm sm:grid-cols-2">
          {["الدورات التعليمية", "تخفيضات الشركاء", "الفعاليات الطلابية", "خدمات المنصة"].map(item => <li key={item} className="flex items-center gap-2"><Check className="size-4 text-primary" />{item}</li>)}
        </ul>
      </section>

      {result ? <section role="status" className="mt-6 space-y-4" aria-live="polite">
        <div className="flex items-start gap-3">
          {result.outcome === "success" ? <CircleCheck className="size-7 shrink-0 text-primary" /> : <XCircle className="size-7 shrink-0 text-destructive" />}
          <div><h3 className="text-lg font-bold">{result.outcome === "success" ? "نجحت تجربة الاشتراك" : "لم تنجح تجربة الدفع"}</h3>
            <p className="mt-1 text-sm text-muted-foreground">{result.outcome === "success" ? "تم تأكيد النتيجة التجريبية فقط؛ لم يُخصم أي مبلغ ولم تُفعّل عضويتك الفعلية." : "لم يُخصم أي مبلغ ولم تتغير عضويتك. يمكنك إعادة المحاولة."}</p>
          </div>
        </div>
        <Button variant="outline" onClick={() => { setResult(null); setOpen(true); }}><RotateCcw />إعادة التجربة</Button>
      </section> : <Button size="lg" className="mt-6 w-full" onClick={() => setOpen(true)}><CreditCard />تجربة الاشتراك — 100 ليرة</Button>}

      <p className="mt-4 flex items-start gap-2 text-sm text-muted-foreground"><ShieldCheck className="size-4 shrink-0" />محاكاة محلية باسم iyzico، وليست عملية دفع عبر iyzico أو بيئة اختبار متصلة. فتح الخدمات بعد دفع موثّق سيُتاح عند إكمال الربط الحقيقي.</p>
    </div>

    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent dir="rtl" className="max-h-[90dvh] w-[calc(100%-2rem)] overflow-y-auto rounded-lg">
        <DialogTitle className="mt-3 text-right">iyzico — محاكاة الاشتراك</DialogTitle>
        <DialogDescription className="text-right">لا تدخل أي بيانات بطاقة؛ هذه تجربة دون اتصال بخدمة الدفع.</DialogDescription>
        <dl className="space-y-3 border-y py-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2"><dt className="text-muted-foreground">المشترك</dt><dd className="break-words font-bold">{profile?.full_name}</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">الباقة</dt><dd>100 ليرة تركية / شهر</dd></div>
          <div className="flex justify-between gap-2"><dt className="text-muted-foreground">المبلغ الفعلي المستحق</dt><dd className="font-bold text-primary">0 ليرة — تجريبي</dd></div>
        </dl>
        <Button onClick={() => complete("success")}><CircleCheck />محاكاة دفع ناجح</Button>
        <Button variant="outline" onClick={() => complete("failure")}><XCircle />محاكاة دفع مرفوض</Button>
        <Button variant="ghost" onClick={() => setOpen(false)}>إلغاء</Button>
      </DialogContent>
    </Dialog>
  </AppShell>;
}