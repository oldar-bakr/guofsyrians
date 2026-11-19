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

/** Identify allowed attachment types from their leading bytes; returns null for anything else. */
export function detectComplaintFileType(b: Uint8Array): string | null {
  const at = (o: number, sig: number[]) => sig.every((v, i) => b[o + i] === v);
  const ascii = (o: number, t: string) => at(o, [...t].map((c) => c.charCodeAt(0)));
  if (at(0, [0x89, 0x50, 0x4e, 0x47])) return "image/png";
  if (at(0, [0xff, 0xd8, 0xff])) return "image/jpeg";
  if (ascii(0, "GIF8")) return "image/gif";
  if (ascii(0, "RIFF") && ascii(8, "WEBP")) return "image/webp";
  if (ascii(0, "RIFF") && ascii(8, "WAVE")) return "audio/wav";
  if (ascii(0, "%PDF-")) return "application/pdf";
  if (ascii(4, "ftyp")) return "video/mp4";
  if (ascii(0, "ID3") || at(0, [0xff, 0xfb]) || at(0, [0xff, 0xf3])) return "audio/mpeg";
  if (ascii(0, "OggS")) return "audio/ogg";
  if (at(0, [0x1a, 0x45, 0xdf, 0xa3])) return "video/webm";
  return null;
}
