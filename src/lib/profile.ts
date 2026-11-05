import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type Profile = {
  id: string;
  full_name: string;
  phone: string;
  city: string;
  university: string;
  faculty: string;
  department: string | null;
  student_number: string;
  uni_email: string;
  member_code: string;
  avatar_url: string | null;
  created_at: string;
};

export async function fetchMyProfile(): Promise<Profile | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("profiles").select("*").eq("id", u.user.id).maybeSingle();
  return (data as Profile | null) ?? null;
}

export function useMyProfile() {
  return useQuery({ queryKey: ["my-profile"], queryFn: fetchMyProfile });
}

// Display shape used by the student-facing pages.
export function useStudent() {
  const { data } = useMyProfile();
  const created = data ? new Date(data.created_at) : new Date();
  const valid = new Date(created);
  valid.setFullYear(valid.getFullYear() + 1);
  return {
    name: data?.full_name ?? "",
    university: data?.university ?? "",
    city: data?.city ?? "",
    id: data?.member_code ?? "",
    avatar: data?.avatar_url ?? null,
    validUntil: valid.toLocaleDateString("en-GB"),
  };
}
