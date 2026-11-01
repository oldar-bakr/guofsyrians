import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export type ContentTable = "news" | "courses" | "deals" | "events" | "products" | "branches";

export type Field = { key: string; label: string; type?: "number" };

// Editable fields per section, shared by the app pages and the admin dashboard.
export const sections: Record<ContentTable, { label: string; fields: Field[] }> = {
  news: { label: "الأخبار", fields: [{ key: "title", label: "العنوان" }, { key: "date", label: "التاريخ" }] },
  courses: { label: "الدورات", fields: [{ key: "title", label: "اسم الدورة" }, { key: "category", label: "التصنيف" }, { key: "lessons", label: "عدد الدروس", type: "number" }] },
  deals: { label: "التخفيضات", fields: [{ key: "partner", label: "الشريك" }, { key: "category", label: "التصنيف" }, { key: "discount", label: "الخصم" }, { key: "city", label: "المدينة" }, { key: "terms", label: "الشروط" }] },
  events: { label: "الفعاليات", fields: [{ key: "title", label: "العنوان" }, { key: "date", label: "التاريخ" }, { key: "time", label: "الوقت" }, { key: "place", label: "المكان" }, { key: "org", label: "الجهة المنظمة" }] },
  products: { label: "المنتجات", fields: [{ key: "name", label: "المنتج" }, { key: "price", label: "السعر" }, { key: "seller", label: "البائع" }] },
  branches: { label: "الفروع", fields: [{ key: "city", label: "المدينة" }, { key: "university", label: "الجامعة" }, { key: "head", label: "المسؤول" }, { key: "contact", label: "التواصل" }] },
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
