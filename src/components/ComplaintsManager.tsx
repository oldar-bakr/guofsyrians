import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { useState } from "react";
import { listComplaints, reviewComplaint } from "@/lib/complaints.functions";
import { complaintStatuses } from "@/lib/complaints";
import { Button } from "@/components/ui/button";
import { Download, Loader2, MessageSquare, UserRound, ShieldCheck } from "lucide-react";

export function ComplaintsManager() {
  const list = useServerFn(listComplaints);
  const review = useServerFn(reviewComplaint);
  const qc = useQueryClient();
  const { data = [], isPending, error, refetch } = useQuery({ queryKey: ["staff-complaints"], queryFn: () => list() });
  const [busy, setBusy] = useState<string | null>(null);
  const [message, setMessage] = useState("");
  async function update(id: string, status: "new" | "reviewing" | "closed") {
    setBusy(id); setMessage("");
    try { await review({ data: { id, status } }); await qc.invalidateQueries({ queryKey: ["staff-complaints"] }); }
    catch { setMessage("تعذّر تحديث الحالة"); } finally { setBusy(null); }
  }
  return <section>
    <h2 className="mb-5 flex items-center gap-2 font-display text-2xl font-bold"><MessageSquare />الشكاوى والملاحظات <span className="text-sm text-muted-foreground">{data.length}</span></h2>
    {isPending && <Loader2 className="animate-spin" />}
    {error && <div role="alert">تعذّر تحميل الشكاوى <Button variant="outline" onClick={() => refetch()}>إعادة المحاولة</Button></div>}
    {message && <p role="alert" className="text-destructive">{message}</p>}
    {!isPending && !error && !data.length && <p className="py-10 text-center text-muted-foreground">لا توجد رسائل حتى الآن</p>}
    <div className="grid gap-4">{data.map(row => <article key={row.id} className="min-w-0 rounded-lg border bg-card p-5">
      <div className="flex flex-wrap items-start justify-between gap-3"><div className="min-w-0"><h3 className="break-words text-lg font-bold">{row.title}</h3><p className="mt-2 flex items-center gap-2 text-xs text-muted-foreground">{row.anonymous ? <ShieldCheck className="h-4 w-4" /> : <UserRound className="h-4 w-4" />}{row.anonymous ? "مرسل متخفي" : row.student_name} · {new Date(row.created_at).toLocaleDateString("ar")}</p></div><label className="text-xs">حالة الرسالة<select aria-label={`حالة ${row.title}`} value={row.status} disabled={busy === row.id} onChange={e => { const value = e.target.value; if (value === "new" || value === "reviewing" || value === "closed") update(row.id, value); }} className="ms-2 rounded-md border bg-background p-2">{Object.entries(complaintStatuses).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select></label></div>
      <p className="mt-5 whitespace-pre-wrap break-words text-sm leading-7">{row.body}</p>
      {row.attachment_url && <Button asChild variant="outline" className="mt-4 h-auto max-w-full py-2"><a href={row.attachment_url} rel="noreferrer" target="_blank"><Download className="shrink-0" /><span className="min-w-0 whitespace-normal break-all">{row.attachment_name}</span></a></Button>}
    </article>)}</div>
  </section>;
}