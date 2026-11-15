import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Switch } from "@/components/ui/switch";
import { supabase } from "@/integrations/supabase/client";
import type { ContentTable } from "@/lib/content";

export function ContentActivation({ table, id, active, title }: { table: ContentTable | "businesses"; id: string; active: boolean; title: string }) {
  const qc = useQueryClient();
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState(false);
  async function change(value: boolean) {
    setBusy(true); setError(false);
    const patch = table === "deals" ? { staff_active: value } : { active: value };
    const { error } = await supabase.from(table).update(patch as never).eq("id", id);
    if (error) setError(true);
    else await qc.invalidateQueries();
    setBusy(false);
  }
  return <div className="flex flex-col items-center gap-1"><Switch aria-label={`تفعيل ${title}`} checked={active} disabled={busy} onCheckedChange={change} /><span className={`text-[10px] ${error ? "text-destructive" : "text-muted-foreground"}`}>{error ? "تعذّر الحفظ" : active ? "مفعّل" : "معطّل"}</span></div>;
}