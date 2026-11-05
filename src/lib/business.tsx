import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { toLogoBlob } from "@/lib/avatar";

export const LOGO_BUCKET = "business-logos";
export const businessCategories = ["مطعم", "مقهى", "متجر", "خدمات", "تعليم", "صحة وجمال", "أخرى"];
export const statusLabels: Record<string, string> = { pending: "بانتظار الموافقة", approved: "مفعّل", rejected: "مرفوض" };

export type Business = {
  id: string; owner_id: string; name: string; category: string; city: string; address: string;
  phone: string; email: string; description: string; logo_url: string | null; status: string; created_at: string;
};

export async function fetchMyBusiness(): Promise<Business | null> {
  const { data: u } = await supabase.auth.getUser();
  if (!u.user) return null;
  const { data } = await supabase.from("businesses").select("*").eq("owner_id", u.user.id).maybeSingle();
  return (data as Business | null) ?? null;
}

export async function uploadLogo(userId: string, file: File): Promise<string> {
  const blob = await toLogoBlob(file);
  const path = `${userId}/logo-${Date.now()}.png`;
  const { error } = await supabase.storage.from(LOGO_BUCKET).upload(path, blob, { contentType: "image/png", upsert: true });
  if (error) throw new Error("تعذّر رفع الشعار");
  return path;
}

export function useLogoUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["logo-url", path ?? null],
    enabled: Boolean(path),
    staleTime: 1000 * 60 * 60,
    queryFn: async () => {
      const { data } = await supabase.storage.from(LOGO_BUCKET).createSignedUrl(path!, 60 * 60 * 12);
      return data?.signedUrl ?? null;
    },
  });
}

export function BusinessLogo({ path, name, className = "h-14 w-14" }: { path: string | null | undefined; name: string; className?: string }) {
  const { data: url } = useLogoUrl(path);
  return url ? (
    <img src={url} alt={name} className={`${className} shrink-0 rounded-2xl bg-card object-contain p-1`} />
  ) : (
    <span className={`${className} grid shrink-0 place-items-center rounded-2xl bg-secondary font-display font-bold text-primary`}>{name.slice(0, 1)}</span>
  );
}
