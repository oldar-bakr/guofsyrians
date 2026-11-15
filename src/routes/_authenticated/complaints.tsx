import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { AppShell } from "@/components/AppShell";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { ArrowRight, Send, Paperclip, CheckCircle2, Loader2, X } from "lucide-react";
import { submitComplaint } from "@/lib/complaints.functions";
import { complaintSchema, validateComplaintSize } from "@/lib/complaints";

export const Route = createFileRoute("/_authenticated/complaints")({
  staticData: { sitemap: false },
  head: () => ({ meta: [{ title: "الشكاوى والملاحظات | اتحاد الطلبة" }, { name: "description", content: "أرسل ملاحظتك أو شكواك إلى إدارة الاتحاد بسرية." }, { property: "og:title", content: "الشكاوى والملاحظات | اتحاد الطلبة" }, { property: "og:description", content: "تواصل مع الإدارة وأرسل مرفقات شكواك بشكل خاص." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: ComplaintsPage,
});
function ComplaintsPage() {
  const send = useServerFn(submitComplaint);
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [anonymous, setAnonymous] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [sent, setSent] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setError(""); setBusy(true);
    try {
      let attachment;
      if (file) {
        validateComplaintSize(file.size);
        const bytes = new Uint8Array(await file.arrayBuffer());
        let binary = "";
        for (let i = 0; i < bytes.length; i += 8192) binary += String.fromCharCode(...bytes.subarray(i, i + 8192));
        attachment = { name: file.name, base64: btoa(binary) };
      }
      const data = complaintSchema.parse({ title, body, anonymous, attachment });
      await send({ data }); setSent(true); setFile(null);
    } catch (e) { setError(e instanceof Error ? e.message : "تعذّر الإرسال"); }
    finally { setBusy(false); }
  }
  return <AppShell title="الشكاوى والملاحظات"><div className="mx-auto max-w-xl">
    <Button asChild variant="ghost" className="mb-5"><Link to="/profile"><ArrowRight />ملفي الشخصي</Link></Button>
    {sent ? <section className="py-12 text-center" aria-live="polite"><CheckCircle2 className="mx-auto mb-4 h-12 w-12 text-primary" /><h1 className="font-display text-xl font-bold">تم إرسال رسالتك للإدارة</h1><p className="mt-3 text-sm text-muted-foreground">شكرًا لمشاركتك، ستراجع الإدارة رسالتك.</p><Button className="mt-6" onClick={() => { setSent(false); setTitle(""); setBody(""); }}>إرسال ملاحظة أخرى</Button></section> : <>
      <h1 className="font-display text-2xl font-bold">الشكاوى والملاحظات</h1>
      <form onSubmit={submit} className="mt-6 space-y-5">
        <label className="block space-y-2 text-sm font-medium"><span>العنوان</span><Input required maxLength={160} value={title} onChange={e => setTitle(e.target.value)} disabled={busy} /></label>
        <label className="block space-y-2 text-sm font-medium"><span>التفاصيل</span><Textarea required rows={7} maxLength={5000} value={body} onChange={e => setBody(e.target.value)} disabled={busy} /></label>
        <div className="border-y py-4"><div className="flex items-center justify-between gap-3"><label htmlFor="complaint-anonymous" className="text-sm font-bold">إرسال دون إظهار هويتي</label><Switch id="complaint-anonymous" checked={anonymous} onCheckedChange={setAnonymous} disabled={busy} /></div><p className="mt-2 text-xs leading-6 text-muted-foreground">{anonymous ? "لن يُحفظ اسمك أو رقم حسابك مع الرسالة. تجنّب ذكر معلومات تكشف هويتك في النص أو المرفق." : "ستظهر رسالتك للإدارة باسمك."}</p></div>
        <div className="space-y-2"><label className="flex cursor-pointer items-center gap-2 text-sm font-medium"><Paperclip className="h-4 w-4" />إرفاق ملف <span className="text-xs text-muted-foreground">اختياري · حتى 3 ميجابايت</span><input aria-label="المرفق" type="file" className="sr-only" disabled={busy} onChange={e => { const f = e.target.files?.[0]; setError(""); if (!f) return; try { validateComplaintSize(f.size); setFile(f); } catch { setFile(null); setError("حجم الملف يجب ألا يتجاوز 3 ميجابايت"); e.target.value = ""; } }} /></label>{file && <div className="flex items-center gap-2 rounded-lg border bg-card p-3"><span className="min-w-0 flex-1 break-all text-xs">{file.name}</span><Button type="button" size="icon" variant="ghost" aria-label="إزالة المرفق" disabled={busy} onClick={() => setFile(null)}><X /></Button></div>}</div>
        {error && <p role="alert" className="break-words text-sm text-destructive">{error}</p>}
        <Button type="submit" disabled={busy} className="w-full">{busy ? <Loader2 className="animate-spin" /> : <Send />}{busy ? "جارٍ الإرسال…" : "إرسال للإدارة"}</Button>
      </form></>}
  </div></AppShell>;
}