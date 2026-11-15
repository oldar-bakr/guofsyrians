import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { isPublished } from "./content-visibility";

export type ContentTable = "news" | "courses" | "deals" | "events" | "products" | "branches" | "faqs" | "scholarships";

export type Field = { key: string; label: string; type?: "number" | "long" | "status"; hideInTable?: boolean };

// Editable fields per section, shared by the app pages and the admin dashboard.
export const sections: Record<ContentTable, { label: string; fields: Field[] }> = {
  scholarships: { label: "المنح", fields: [{ key: "title", label: "اسم المنحة" }, { key: "provider", label: "الجهة المانحة" }, { key: "country", label: "الدولة" }, { key: "deadline", label: "آخر موعد للتقديم" }, { key: "application_url", label: "رابط التقديم", hideInTable: true }, { key: "eligibility", label: "شروط التقديم", type: "long", hideInTable: true }, { key: "description", label: "تفاصيل المنحة", type: "long", hideInTable: true }] },
  news: { label: "الأخبار", fields: [{ key: "title", label: "العنوان" }, { key: "date", label: "التاريخ" }, { key: "body", label: "تفاصيل الخبر", type: "long", hideInTable: true }] },
  courses: { label: "الدورات", fields: [{ key: "title", label: "اسم الدورة" }, { key: "category", label: "التصنيف" }, { key: "lessons", label: "عدد الدروس", type: "number" }, { key: "description", label: "الوصف", type: "long", hideInTable: true }, { key: "video_url", label: "رابط الفيديو", hideInTable: true }, { key: "instructor", label: "المدرّب" }, { key: "contact", label: "التواصل", hideInTable: true }, { key: "status", label: "الحالة", type: "status" }] },
  deals: { label: "التخفيضات", fields: [{ key: "partner", label: "الشريك" }, { key: "category", label: "التصنيف" }, { key: "discount", label: "الخصم" }, { key: "city", label: "المدينة" }, { key: "terms", label: "الشروط" }, { key: "status", label: "الحالة", type: "status" }] },
  events: { label: "الفعاليات", fields: [{ key: "title", label: "العنوان" }, { key: "date", label: "التاريخ" }, { key: "time", label: "الوقت" }, { key: "place", label: "المكان" }, { key: "org", label: "الجهة المنظمة" }, { key: "description", label: "الوصف", type: "long", hideInTable: true }] },
  products: { label: "المنتجات", fields: [{ key: "name", label: "المنتج" }, { key: "price", label: "السعر" }, { key: "seller", label: "البائع" }, { key: "description", label: "الوصف", type: "long", hideInTable: true }, { key: "contact", label: "التواصل", hideInTable: true }, { key: "status", label: "الحالة", type: "status" }] },
  branches: { label: "الفروع", fields: [{ key: "city", label: "المدينة" }, { key: "university", label: "الجامعة" }, { key: "head", label: "المسؤول" }, { key: "contact", label: "رقم الاتصال" }, { key: "email", label: "البريد الإلكتروني" }] },
  faqs: { label: "معرفة المساعد", fields: [{ key: "question", label: "السؤال" }, { key: "answer", label: "الإجابة المعتمدة", type: "long" }] },
};

export function useContent<T = Record<string, any>>(table: ContentTable, includeHidden = false) {
  return useQuery({
    queryKey: ["content", table, includeHidden ? "management" : "published"],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: table !== "news" });
      if (error) throw error;
      if (includeHidden) return (data ?? []) as T[];
      let visible = (data ?? []).filter(isPublished);
      if (table === "deals") {
        const { data: businesses, error: businessError } = await supabase.from("businesses").select("id").eq("active", true).eq("status", "approved");
        if (businessError) throw businessError;
        const ids = new Set((businesses ?? []).map(b => b.id));
        visible = visible.filter(row => !("business_id" in row) || !row.business_id || ids.has(row.business_id));
      }
      return visible as T[];
    },
  });
}

export function useItem<T = Record<string, any>>(table: ContentTable, id: string) {
  return useQuery({
    queryKey: ["content", table, id],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return (data && isPublished(data) ? data : null) as T | null;
    },
  });
}

// Turns a YouTube/Vimeo link into an embeddable player URL; returns null for other links.
export function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([\w-]{6,})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}`;
  const vm = url.match(/vimeo\.com\/(\d+)/);
  if (vm) return `https://player.vimeo.com/video/${vm[1]}`;
  return null;
}

export const statusLabels: Record<string, string> = { pending: "بانتظار الموافقة", approved: "منشور", rejected: "مرفوض" };
// Student-submitted rows stay hidden from listings until staff approve them.
export const approvedOnly = <T extends { status?: string }>(rows: T[]) => rows.filter(isPublished);
