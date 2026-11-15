import { supabase } from "@/integrations/supabase/client";
import { getVisibleContentImages } from "@/lib/content-images.functions";

export const CONTENT_IMAGE_BUCKET = "content-images";

/** Resize without cropping or flattening transparent pixels. */
export async function uploadContentImage(file: File): Promise<string> {
  const { data } = await supabase.auth.getUser();
  if (!data.user) throw new Error("يرجى تسجيل الدخول");
  let bitmap: ImageBitmap;
  try { bitmap = await createImageBitmap(file); }
  catch { throw new Error("اختر صورة JPG أو PNG أو WebP"); }
  const scale = Math.min(1, 1600 / Math.max(bitmap.width, bitmap.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(bitmap.width * scale));
  canvas.height = Math.max(1, Math.round(bitmap.height * scale));
  const ctx = canvas.getContext("2d");
  if (!ctx) { bitmap.close(); throw new Error("تعذّر تجهيز الصورة"); }
  ctx.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/webp", 0.88));
  if (!blob || blob.size > 5 * 1024 * 1024) throw new Error("الصورة كبيرة جداً، اختر صورة أصغر");
  const path = `${data.user.id}/${crypto.randomUUID()}.webp`;
  const { error } = await supabase.storage.from(CONTENT_IMAGE_BUCKET).upload(path, blob, { contentType: "image/webp" });
  if (error) throw new Error("تعذّر رفع الصورة، حاول مجدداً");
  return path;
}

export async function resolveContentImages(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  return getVisibleContentImages({ data: { paths } });
}