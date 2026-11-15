import { z } from "zod";

export const MAX_COMPLAINT_BYTES = 3 * 1024 * 1024;
export const complaintSchema = z.object({
  title: z.string().trim().min(1, "اكتب عنوانًا").max(160),
  body: z.string().trim().min(1, "اكتب تفاصيل الملاحظة أو الشكوى").max(5000),
  anonymous: z.boolean(),
  attachment: z.object({ name: z.string().trim().min(1).max(200), base64: z.string().max(4194304).regex(/^[A-Za-z0-9+/]*={0,2}$/) }).optional(),
});
export function validateComplaintSize(size: number) {
  if (!Number.isInteger(size) || size < 1 || size > MAX_COMPLAINT_BYTES) throw new Error("حجم الملف يجب ألا يتجاوز 3 ميجابايت");
}
export function complaintIdentity(anonymous: boolean, userId: string) {
  return anonymous ? null : userId;
}
export const complaintStatuses = { new: "جديدة", reviewing: "قيد المراجعة", closed: "مغلقة" } as const;