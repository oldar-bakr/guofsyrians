import { useQuery, useQueryClient } from "@tanstack/react-query";
import { useState } from "react";
import { Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useContent } from "@/lib/content";
import type { ActivityTable } from "@/lib/activity";

const tabs: { key: ActivityTable; label: string }[] = [
  { key: "orders", label: "طلبات السوق" },
  { key: "course_enrollments", label: "تسجيلات الدورات" },
  { key: "event_registrations", label: "تسجيلات الفعاليات" },
  { key: "deal_redemptions", label: "استخدام التخفيضات" },
  { key: "assistant_messages", label: "أسئلة المساعد" },
];
const orderStatuses = ["جديد", "قيد التجهيز", "تم التسليم", "ملغى"];

export function ActivityManager() {
  const [tab, setTab] = useState<ActivityTable>("orders");
  const qc = useQueryClient();
  const { data: courses = [] } = useContent<any>("courses");
  const { data: events = [] } = useContent<any>("events");
  const { data: deals = [] } = useContent<any>("deals");
  const { data: profiles = [] } = useQuery({
    queryKey: ["admin-profiles"],
    queryFn: async () => (await supabase.from("profiles").select("id, full_name, phone, university")).data ?? [],
  });
  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-activity", tab],
    queryFn: async () => {
      const { data, error } = await supabase.from(tab).select("*").order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
  });
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-activity", tab] });
  const who = (id: string) => profiles.find((p: any) => p.id === id);
  const name = (list: any[], id: string, key = "title") => list.find((x) => x.id === id)?.[key] ?? "—";

  const detail = (r: any) => {
    switch (tab) {
      case "course_enrollments": {
        const c = courses.find((x: any) => x.id === r.course_id);
        return `${c?.title ?? "—"} · أنجز ${r.completed_lessons}/${c?.lessons ?? "?"}`;
      }
      case "event_registrations": return name(events, r.event_id);
      case "deal_redemptions": return name(deals, r.deal_id, "partner");
      case "orders": return `${(r.items as any[]).map((i) => `${i.qty}× ${i.name}`).join("، ")}${r.note ? ` — ${r.note}` : ""}`;
      case "assistant_messages": return `س: ${r.question}\nج: ${r.answer}`;
    }
  };

  const setStatus = async (id: string, status: string) => {
    await supabase.from("orders").update({ status }).eq("id", id);
    refresh();
  };
  const remove = async (id: string) => {
    if (!confirm("حذف هذا السجل؟")) return;
    await supabase.from(tab).delete().eq("id", id);
    refresh();
  };

  return (
    <section>
      <h2 className="mb-4 font-display text-2xl font-bold">نشاط الطلاب</h2>
      <div className="mb-4 flex gap-2 overflow-x-auto">
        {tabs.map((t) => (
          <button key={t.key} onClick={() => setTab(t.key)} className={`shrink-0 rounded-full px-4 py-1.5 text-sm ${t.key === tab ? "bg-primary text-primary-foreground" : "bg-card"}`}>{t.label}</button>
        ))}
      </div>
      <div className="overflow-x-auto rounded-2xl bg-card shadow-soft">
        <table className="w-full text-sm">
          <thead className="bg-secondary text-right">
            <tr><th className="px-4 py-3">الطالب</th><th className="px-4 py-3">التفاصيل</th><th className="px-4 py-3">التاريخ</th>{tab === "orders" && <th className="px-4 py-3">الحالة</th>}<th className="w-12" /></tr>
          </thead>
          <tbody>
            {isLoading && <tr><td className="p-4" colSpan={5}>جارٍ التحميل...</td></tr>}
            {!isLoading && rows.length === 0 && <tr><td className="p-4 text-muted-foreground" colSpan={5}>لا توجد سجلات بعد</td></tr>}
            {rows.map((r) => {
              const p = who(r.user_id);
              return (
                <tr key={r.id} className="border-t align-top">
                  <td className="px-4 py-3"><p className="font-bold">{p?.full_name ?? "—"}</p><p className="text-xs text-muted-foreground">{p?.phone} {p?.university && `· ${p.university}`}</p></td>
                  <td className="whitespace-pre-wrap px-4 py-3">{detail(r)}</td>
                  <td className="px-4 py-3 text-muted-foreground">{new Date(r.created_at).toLocaleString("ar")}</td>
                  {tab === "orders" && (
                    <td className="px-4 py-3">
                      <select value={r.status} onChange={(e) => setStatus(r.id, e.target.value)} className="rounded-lg border bg-background px-2 py-1">
                        {orderStatuses.map((s) => <option key={s}>{s}</option>)}
                      </select>
                    </td>
                  )}
                  <td className="px-4 py-3"><button aria-label="حذف" onClick={() => remove(r.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
