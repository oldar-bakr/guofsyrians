import { createFileRoute, useNavigate, Link } from "@tanstack/react-router";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import QRCode from "react-qr-code";
import { AppShell } from "@/components/AppShell";
import { useStudent } from "@/lib/profile";
import { Avatar } from "@/components/Avatar";
import logo from "@/assets/union-logo.png.asset.json";

export const Route = createFileRoute("/_authenticated/card")({
  head: () => ({
    meta: [
      { title: "بطاقتي الرقمية | تطبيق خدمات الطلاب" },
      { name: "description", content: "بطاقة العضوية الرقمية مع رمز QR للتحقق لدى الشركاء." },
      { property: "og:title", content: "بطاقة الطالب الرقمية" },
      { property: "og:description", content: "بطاقة عضوية برمز QR فريد." },
    ],
  }),
  component: CardPage,
});

function CardPage() {
  const student = useStudent();
  const navigate = useNavigate();
  const qc = useQueryClient();
  const signOut = async () => {
    await qc.cancelQueries();
    qc.clear();
    await supabase.auth.signOut();
    navigate({ to: "/auth", replace: true });
  };
  return (
    <AppShell title="بطاقتي">
      <div className="bg-member rounded-3xl p-6 text-primary-foreground shadow-soft">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-xs opacity-80">الاتحاد العام لطلبة سوريا</p>
            <p className="font-display text-xl font-bold">بطاقة عضوية</p>
          </div>
          <img src={logo.url} alt="" className="h-12 w-12 rounded-full bg-card object-contain p-1" />
        </div>
        <div className="mt-8 flex items-center gap-3">
          <Avatar path={student.avatar} name={student.name} className="h-14 w-14" textClass="text-lg" />
          <div className="min-w-0">
            <p className="font-display text-2xl font-bold">{student.name}</p>
            <p className="text-sm opacity-90">{student.university}</p>
          </div>
        </div>
        <div className="mt-4 flex justify-between text-xs opacity-90">
          <span>رقم العضوية: {student.id}</span>
          <span>صالحة حتى {student.validUntil}</span>
        </div>
      </div>

      <div className="mt-6 flex flex-col items-center rounded-3xl bg-card p-6 shadow-soft">
        <div className="rounded-2xl bg-card p-3">
          <QRCode value={`guss:${student.id}`} size={180} fgColor="var(--primary)" />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">اعرض هذا الرمز لدى الشريك المعتمد للاستفادة من التخفيض</p>
        <span className="mt-3 rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">● الاشتراك فعّال</span>
      </div>
      <Link to="/profile" className="mt-6 block w-full rounded-xl bg-primary py-2 text-center text-sm font-bold text-primary-foreground">ملفي وتعديل بياناتي</Link>
      <button onClick={signOut} className="mt-3 w-full rounded-xl border py-2 text-sm">تسجيل الخروج</button>
    </AppShell>
  );
}
