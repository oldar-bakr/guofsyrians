import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Pencil, Trash2, X, ChevronDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { cities } from "@/lib/turkey-universities";
import { BusinessLogo, businessCategories, statusLabels, type Business } from "@/lib/business";

const input = "mt-1 w-full rounded-xl border bg-background px-3 py-2";

export function BusinessesManager() {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["admin-businesses"],
    queryFn: async () => {
      const [b, d, r] = await Promise.all([
        supabase.from("businesses").select("*").order("created_at", { ascending: false }),
        supabase.from("deals").select("*").not("business_id", "is", null),
        supabase.from("deal_redemptions").select("id, user_id, deal_id, business_id, created_at").order("created_at", { ascending: false }),
      ]);
      const ids = [...new Set((r.data ?? []).map((x) => x.user_id))];
      const p = ids.length ? await supabase.from("profiles").select("id, full_name, member_code, university").in("id", ids) : { data: [] as any[] };
      return { businesses: (b.data ?? []) as Business[], deals: d.data ?? [], uses: r.data ?? [], students: p.data ?? [] };
    },
  });
  const [editing, setEditing] = useState<Business | null>(null);
  const [openId, setOpenId] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [err, setErr] = useState("");
  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-businesses"] });

  if (isLoading || !data) return <p>جارٍ التحميل...</p>;
  const { businesses, deals, uses, students } = data;
  const bizUses = uses.filter((u) => u.business_id);
  const stats = [
    { label: "المتاجر", v: businesses.length },
    { label: "بانتظار الموافقة", v: businesses.filter((b) => b.status === "pending").length },
    { label: "العروض", v: deals.length },
    { label: "تخفيضات مقدَّمة", v: bizUses.length },
    { label: "طلاب مستفيدون", v: new Set(bizUses.map((u) => u.user_id)).size },
  ];
  const list = businesses.filter((b) => filter === "all" || b.status === filter);

  const setStatus = async (id: string, status: string) => {
    const { error } = await supabase.from("businesses").update({ status }).eq("id", id);
    if (error) setErr(error.message); else refresh();
  };
  const saveBiz = async (b: Business) => {
    const { id, owner_id, created_at, ...rest } = b;
    const { error } = await supabase.from("businesses").update(rest).eq("id", id);
    if (error) return setErr(error.message);
    await supabase.from("deals").update({ partner: b.name, city: b.city }).eq("business_id", id);
    setEditing(null);
    refresh();
  };
  const removeBiz = async (id: string) => {
    if (!confirm("حذف المتجر وكل عروضه؟")) return;
    await supabase.from("businesses").delete().eq("id", id);
    refresh();
  };

  return (
    <section>
      <div className="mb-5 grid grid-cols-2 gap-3 md:grid-cols-5">
        {stats.map((s) => (
          <div key={s.label} className="rounded-2xl bg-card p-4 text-center shadow-soft"><p className="font-display text-3xl font-bold text-primary">{s.v}</p><p className="text-xs text-muted-foreground">{s.label}</p></div>
        ))}
      </div>
      <div className="mb-4 flex gap-2">
        {["all", "pending", "approved", "rejected"].map((k) => (
          <button key={k} onClick={() => setFilter(k)} className={`rounded-full px-4 py-1.5 text-sm ${filter === k ? "bg-primary text-primary-foreground" : "bg-card"}`}>{k === "all" ? "الكل" : statusLabels[k]}</button>
        ))}
      </div>
      {err && <p className="mb-3 text-sm text-destructive">{err}</p>}
      <div className="space-y-3">
        {list.length === 0 && <p className="text-muted-foreground">لا توجد متاجر</p>}
        {list.map((b) => {
          const myDeals = deals.filter((d) => d.business_id === b.id);
          const myUses = bizUses.filter((u) => u.business_id === b.id);
          const isOpen = openId === b.id;
          return (
            <article key={b.id} className="rounded-2xl bg-card p-4 shadow-soft">
              <div className="flex flex-wrap items-center gap-4">
                <BusinessLogo path={b.logo_url} name={b.name} />
                <div className="min-w-0 flex-1">
                  <p className="font-bold">{b.name} <span className="text-xs text-muted-foreground">· {b.category}</span></p>
                  <p className="text-xs text-muted-foreground">{b.city} · {b.address}</p>
                  <p className="text-xs text-muted-foreground" dir="ltr">{b.phone} {b.email}</p>
                </div>
                <div className="text-center text-xs"><p className="font-display text-lg font-bold text-primary">{myDeals.length}</p>عروض</div>
                <div className="text-center text-xs"><p className="font-display text-lg font-bold text-primary">{myUses.length}</p>استخدام</div>
                <div className="text-center text-xs"><p className="font-display text-lg font-bold text-primary">{new Set(myUses.map((u) => u.user_id)).size}</p>طالب</div>
                <select value={b.status} onChange={(e) => setStatus(b.id, e.target.value)} className={`rounded-xl border px-2 py-1 text-sm ${b.status === "approved" ? "text-primary" : b.status === "pending" ? "font-bold" : "text-destructive"}`}>
                  {Object.entries(statusLabels).map(([k, v]) => <option key={k} value={k}>{v}</option>)}
                </select>
                <button aria-label="تعديل" onClick={() => setEditing(b)} className="text-primary"><Pencil className="h-4 w-4" /></button>
                <button aria-label="حذف" onClick={() => removeBiz(b.id)} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
                <button aria-label="التفاصيل" onClick={() => setOpenId(isOpen ? null : b.id)}><ChevronDown className={`h-5 w-5 transition ${isOpen ? "rotate-180" : ""}`} /></button>
              </div>
              {isOpen && (
                <div className="mt-4 grid gap-4 border-t pt-4 md:grid-cols-2">
                  <div>
                    <h4 className="mb-2 font-bold">العروض</h4>
                    {myDeals.length === 0 && <p className="text-sm text-muted-foreground">لا توجد عروض</p>}
                    {myDeals.map((d) => <DealRow key={d.id} deal={d} onChange={refresh} />)}
                  </div>
                  <div>
                    <h4 className="mb-2 font-bold">الطلاب المستفيدون</h4>
                    {myUses.length === 0 && <p className="text-sm text-muted-foreground">لا يوجد بعد</p>}
                    <ul className="max-h-64 space-y-1 overflow-y-auto text-sm">
                      {myUses.map((u) => {
                        const s = students.find((x: any) => x.id === u.user_id);
                        const d = deals.find((x) => x.id === u.deal_id);
                        return <li key={u.id} className="flex justify-between gap-2 rounded-lg bg-muted px-3 py-1.5"><span>{s?.full_name ?? "—"} <span className="text-xs text-muted-foreground">{s?.university}</span></span><span className="text-xs text-muted-foreground">{d?.discount} · {new Date(u.created_at).toLocaleDateString("ar")}</span></li>;
                      })}
                    </ul>
                  </div>
                </div>
              )}
            </article>
          );
        })}
      </div>
      {editing && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-foreground/40 p-4">
          <form onSubmit={(e) => { e.preventDefault(); saveBiz(editing); }} className="max-h-[90vh] w-full max-w-md space-y-3 overflow-y-auto rounded-3xl bg-card p-6 shadow-soft">
            <div className="flex justify-between"><h3 className="font-display text-lg font-bold">تعديل المتجر</h3><button type="button" onClick={() => setEditing(null)}><X className="h-5 w-5" /></button></div>
            {(["name", "address", "phone", "email"] as const).map((k) => (
              <label key={k} className="block text-sm">{{ name: "الاسم", address: "العنوان", phone: "رقم التواصل", email: "البريد" }[k]}<input value={editing[k]} onChange={(e) => setEditing({ ...editing, [k]: e.target.value })} className={input} /></label>
            ))}
            <label className="block text-sm">النوع<select value={editing.category} onChange={(e) => setEditing({ ...editing, category: e.target.value })} className={input}>{businessCategories.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="block text-sm">المدينة<select value={editing.city} onChange={(e) => setEditing({ ...editing, city: e.target.value })} className={input}>{cities.map((c) => <option key={c}>{c}</option>)}</select></label>
            <label className="block text-sm">نبذة<textarea rows={3} value={editing.description} onChange={(e) => setEditing({ ...editing, description: e.target.value })} className={input} /></label>
            <button className="w-full rounded-xl bg-primary py-2 font-bold text-primary-foreground">حفظ</button>
          </form>
        </div>
      )}
    </section>
  );
}

function DealRow({ deal, onChange }: { deal: any; onChange: () => void }) {
  const [d, setD] = useState(deal);
  const save = async (patch: any) => {
    const next = { ...d, ...patch };
    setD(next);
    await supabase.from("deals").update({ discount: next.discount, terms: next.terms, active: next.active }).eq("id", d.id);
    onChange();
  };
  return (
    <div className="mb-2 flex items-center gap-2 rounded-lg bg-muted p-2 text-sm">
      <input defaultValue={d.discount} onBlur={(e) => e.target.value !== d.discount && save({ discount: e.target.value })} className="w-20 rounded border bg-background px-2 py-1" />
      <input defaultValue={d.terms} onBlur={(e) => e.target.value !== d.terms && save({ terms: e.target.value })} className="flex-1 rounded border bg-background px-2 py-1" />
      <label className="flex items-center gap-1 text-xs"><input type="checkbox" checked={d.active} onChange={(e) => save({ active: e.target.checked })} />منشور</label>
      <button aria-label="حذف" onClick={async () => { if (confirm("حذف العرض؟")) { await supabase.from("deals").delete().eq("id", d.id); onChange(); } }} className="text-destructive"><Trash2 className="h-4 w-4" /></button>
    </div>
  );
}
