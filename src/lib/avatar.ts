import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";

export const AVATAR_BUCKET = "avatars";
const MAX_SIDE = 512;

/** Every student owns the folder named after their own id. */
export function avatarPath(userId: string) {
  return `${userId}/avatar.jpg`;
}

/** Center-crop the picked picture to a square and re-encode it as a small JPEG. */
export async function toAvatarBlob(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("هذه الصورة غير مدعومة، جرّب JPG أو PNG");
  }
  const side = Math.min(bitmap.width, bitmap.height);
  const out = Math.min(MAX_SIDE, side);
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("تعذّر تجهيز الصورة");
  }
  ctx.drawImage(bitmap, (bitmap.width - side) / 2, (bitmap.height - side) / 2, side, side, 0, 0, out, out);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", 0.85));
  if (!blob) throw new Error("تعذّر تجهيز الصورة");
  return blob;
}

/**
 * Put a logo inside a square canvas and re-encode it as PNG, so a transparent
 * background stays transparent (JPEG would flatten it onto solid black).
 */
export async function toLogoBlob(file: File): Promise<Blob> {
  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file);
  } catch {
    throw new Error("هذه الصورة غير مدعومة، جرّب JPG أو PNG");
  }
  const longest = Math.max(bitmap.width, bitmap.height);
  const out = Math.min(MAX_SIDE, longest);
  const scale = Math.min(1, out / longest);
  const w = Math.max(1, Math.round(bitmap.width * scale));
  const h = Math.max(1, Math.round(bitmap.height * scale));
  const canvas = document.createElement("canvas");
  canvas.width = out;
  canvas.height = out;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    throw new Error("تعذّر تجهيز الصورة");
  }
  ctx.drawImage(bitmap, (out - w) / 2, (out - h) / 2, w, h);
  bitmap.close();
  const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/png"));
  if (!blob) throw new Error("تعذّر تجهيز الصورة");
  return blob;
}

/** Put the picture in the student's own folder and return its path. */
export async function uploadAvatarFile(userId: string, file: File): Promise<string> {
  const blob = await toAvatarBlob(file);
  const path = avatarPath(userId);
  const { error } = await supabase
    .storage.from(AVATAR_BUCKET)
    .upload(path, blob, { contentType: "image/jpeg", upsert: true, cacheControl: "3600" });
  if (error) throw new Error("تعذّر رفع الصورة، حاول مجدداً");
  return path;
}

/**
 * Writes the stored path to the profile. Calls are queued so a quick
 * "choose photo" then "remove" can never land out of order in the database.
 */
let saveQueue: Promise<unknown> = Promise.resolve();
export function saveAvatarPath(userId: string, path: string | null) {
  const run = saveQueue.then(async () => {
    const { error } = await supabase.from("profiles").update({ avatar_url: path }).eq("id", userId);
    if (error) throw new Error("تعذّر حفظ الصورة");
  });
  saveQueue = run.catch(() => undefined);
  return run;
}

export async function removeAvatar(userId: string) {
  await supabase.storage.from(AVATAR_BUCKET).remove([avatarPath(userId)]);
  await saveAvatarPath(userId, null);
}

/** The bucket is private, so each view needs a short-lived signed link. */
export async function resolveAvatarUrl(path: string | null | undefined): Promise<string | null> {
  if (!path) return null;
  if (path.startsWith("http")) return path;
  const { data, error } = await supabase.storage.from(AVATAR_BUCKET).createSignedUrl(path, 60 * 60 * 12);
  return error || !data?.signedUrl ? null : data.signedUrl;
}

export function useAvatarUrl(path: string | null | undefined) {
  return useQuery({
    queryKey: ["avatar-url", path ?? null],
    queryFn: () => resolveAvatarUrl(path),
    enabled: Boolean(path),
    staleTime: 1000 * 60 * 60,
  });
}
