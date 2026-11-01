import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ActivityTable = "course_enrollments" | "event_registrations" | "deal_redemptions" | "orders" | "assistant_messages";

async function uid() {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("not signed in");
  return data.user.id;
}

// The signed-in student's own rows (RLS also limits this to their rows).
export function useMine<T = any>(table: ActivityTable) {
  return useQuery({
    queryKey: ["mine", table],
    queryFn: async () => {
      const id = await uid();
      const { data, error } = await supabase.from(table).select("*").eq("user_id", id).order("created_at", { ascending: false });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useActivityActions(table: ActivityTable) {
  const qc = useQueryClient();
  const refresh = () => qc.invalidateQueries({ queryKey: ["mine", table] });
  return {
    add: async (row: Record<string, unknown>) => {
      const { error } = await supabase.from(table).insert({ ...row, user_id: await uid() } as never);
      if (error) throw error;
      await refresh();
    },
    remove: async (id: string) => {
      const { error } = await supabase.from(table).delete().eq("id", id);
      if (error) throw error;
      await refresh();
    },
    update: async (id: string, patch: Record<string, unknown>) => {
      const { error } = await supabase.from(table).update(patch as never).eq("id", id);
      if (error) throw error;
      await refresh();
    },
  };
}
