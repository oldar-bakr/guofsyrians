import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { ContentTable } from "@/lib/content";

export function ContentActivation({ table, id, active, title }: { table: ContentTable | "businesses"; id: string; active: boolean; title: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  const [checked, setChecked] = useState(active);
  useEffect(() => { if (!busy) setChecked(active); }, [active, busy]);
  async function change(value: boolean) {
    if (busy) return;
    setBusy(true); setError(false); setChecked(value);
    try {
      const patch = table === "deals" ? { staff_active: value } : { active: value };
      const { data, error } = await supabase.from(table).update(patch as never).eq("id", id).select("*").single();
      const saved = data && (table === "deals" && "staff_active" in data ? data.staff_active : "active" in data ? data.active : null);
      if (error || saved !== value) throw new Error("Activation not saved");
      await Promise.all([
        qc.invalidateQueries({ queryKey: ["content"] }),
        qc.invalidateQueries({ queryKey: ["admin-businesses"] }),
        qc.invalidateQueries({ queryKey: ["shops"] }),
        qc.invalidateQueries({ queryKey: ["partner"] }),
        qc.invalidateQueries({ queryKey: ["my-business"] }),
        qc.invalidateQueries({ queryKey: ["biz-deals"] }),
      ]);
    } catch { setChecked(active); setError(true); }
    finally { setBusy(false); }
  }
  return <div className="flex min-w-16 flex-col items-center gap-1.5" aria-busy={busy}><Switch aria-label={`تفعيل ${title}`} checked={checked} disabled={busy} onCheckedChange={change} /><span aria-live="polite" className={`flex h-4 items-center gap-1 whitespace-nowrap text-xs ${error ? "text-destructive" : checked ? "font-medium text-primary" : "text-muted-foreground"}`}>{busy ? <><Loader2 className="h-3 w-3 animate-spin" />جارٍ الحفظ</> : error ? "تعذّر الحفظ" : checked ? "مفعّل" : "معطّل"}</span></div>;
}