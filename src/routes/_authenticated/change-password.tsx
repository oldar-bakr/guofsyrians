import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { z } from "zod";
import { supabase } from "@/integrations/supabase/client";
import { AppShell } from "@/components/AppShell";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { ArrowRight, LockKeyhole, Loader2 } from "lucide-react";

export const Route = createFileRoute("/_authenticated/change-password")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "تغيير كلمة المرور | اتحاد الطلبة" }, { name: "description", content: "حدّث كلمة مرور حسابك بأمان." }, { property: "og:title", content: "تغيير كلمة المرور | اتحاد الطلبة" }, { property: "og:description", content: "إدارة كلمة مرور حساب الطالب." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ChangePassword,
});
function ChangePassword() {
  const [current, setCurrent] = useState(""); const [password, setPassword] = useState(""); const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState(""); const [busy, setBusy] = useState(false); const [success, setSuccess] = useState(false);
  async function save(e: React.FormEvent) {
    e.preventDefault(); setMessage(""); setSuccess(false);
    const result = z.object({ current: z.string().min(1).max(128), password: z.string().min(8).max(128), confirm: z.string() }).refine(v => v.password === v.confirm).safeParse({ current, password, confirm });
    if (!result.success) return setMessage("اكتب كلمة المرور الحالية وكلمة جديدة من 8 أحرف على الأقل مع تأكيد مطابق.");
    setBusy(true);
    try { const { error } = await supabase.auth.updateUser({ password, current_password: current }); if (error) throw error; setSuccess(true); setMessage("تم تغيير كلمة المرور"); setCurrent(""); setPassword(""); setConfirm(""); }
    catch { setMessage("تعذّر التغيير. تحقّق من كلمة المرور الحالية؛ قد يُطلب تحقق إضافي لحسابك."); } finally { setBusy(false); }
  }
  return <AppShell title="تغيير كلمة المرور"><div className="mx-auto max-w-md"><Button asChild variant="ghost" className="mb-5"><Link to="/profile"><ArrowRight />ملفي الشخصي</Link></Button><h1 className="font-display text-2xl font-bold">تغيير كلمة المرور</h1><form onSubmit={save} className="mt-6 space-y-5">{[{ label: "كلمة المرور الحالية", value: current, set: setCurrent, auto: "current-password" }, { label: "كلمة المرور الجديدة", value: password, set: setPassword, auto: "new-password" }, { label: "تأكيد كلمة المرور", value: confirm, set: setConfirm, auto: "new-password" }].map(f => <label key={f.label} className="block space-y-2 text-sm"><span>{f.label}</span><Input type="password" required maxLength={128} dir="ltr" autoComplete={f.auto} value={f.value} onChange={e => f.set(e.target.value)} disabled={busy} /></label>)}{message && <p role={success ? "status" : "alert"} className={`text-sm ${success ? "text-primary" : "text-destructive"}`}>{message}</p>}<Button disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : <LockKeyhole />}حفظ كلمة المرور</Button></form></div></AppShell>;
}