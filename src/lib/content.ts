import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContentTable = "news" | "courses" | "deals" | "events" | "products" | "branches" | "faqs";

export type Field = { key: string; label: string; type?: "number" | "long"; hideInTable?: boolean };

// Editable fields per section, shared by the app pages and the admin dashboard.
export const sections: Record<ContentTable, { label: string; fields: Field[] }> = {
  news: { label: "الأخبار", fields: [{ key: "title", label: "العنوان" }, { key: "date", label: "التاريخ" }, { key: "body", label: "تفاصيل الخبر", type: "long", hideInTable: true }] },
  courses: { label: "الدورات", fields: [{ key: "title", label: "اسم الدورة" }, { key: "category", label: "التصنيف" }, { key: "lessons", label: "عدد الدروس", type: "number" }, { key: "description", label: "الوصف", type: "long", hideInTable: true }, { key: "video_url", label: "رابط الفيديو", hideInTable: true }] },
  deals: { label: "التخفيضات", fields: [{ key: "partner", label: "الشريك" }, { key: "category", label: "التصنيف" }, { key: "discount", label: "الخصم" }, { key: "city", label: "المدينة" }, { key: "terms", label: "الشروط" }] },
  events: { label: "الفعاليات", fields: [{ key: "title", label: "العنوان" }, { key: "date", label: "التاريخ" }, { key: "time", label: "الوقت" }, { key: "place", label: "المكان" }, { key: "org", label: "الجهة المنظمة" }, { key: "description", label: "الوصف", type: "long", hideInTable: true }] },
  products: { label: "المنتجات", fields: [{ key: "name", label: "المنتج" }, { key: "price", label: "السعر" }, { key: "seller", label: "البائع" }] },
  branches: { label: "الفروع", fields: [{ key: "city", label: "المدينة" }, { key: "university", label: "الجامعة" }, { key: "head", label: "المسؤول" }, { key: "contact", label: "رقم الاتصال" }, { key: "email", label: "البريد الإلكتروني" }] },
  faqs: { label: "معرفة المساعد", fields: [{ key: "question", label: "السؤال" }, { key: "answer", label: "الإجابة المعتمدة", type: "long" }] },
};

export function useContent<T = Record<string, any>>(table: ContentTable) {
  return useQuery({
    queryKey: ["content", table],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").order("created_at", { ascending: table !== "news" });
      if (error) throw error;
      return (data ?? []) as T[];
    },
  });
}

export function useItem<T = Record<string, any>>(table: ContentTable, id: string) {
  return useQuery({
    queryKey: ["content", table, id],
    queryFn: async () => {
      const { data, error } = await supabase.from(table).select("*").eq("id", id).maybeSingle();
      if (error) throw error;
      return data as T | null;
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
