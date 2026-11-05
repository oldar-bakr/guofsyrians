import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cities } from "@/lib/turkey-universities";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Normalize Turkish diacritics so "İstanbul" matches "istanbul" etc.
function normalize(s: string) {
  return s
    .toLocaleLowerCase("tr-TR")
    .replaceAll("ı", "i")
    .replaceAll("İ", "i")
    .replaceAll("ş", "s")
    .replaceAll("ğ", "g")
    .replaceAll("ü", "u")
    .replaceAll("ö", "o")
    .replaceAll("ç", "c")
    .trim();
}

/**
 * Reverse-geocodes the user's coordinates to a Turkish province (city)
 * using the Google Maps connector gateway. Runs only for signed-in users.
 */
export const detectCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lng: number }) => {
    if (typeof d?.lat !== "number" || typeof d?.lng !== "number" || Number.isNaN(d.lat) || Number.isNaN(d.lng)) {
      throw new Error("إحداثيات غير صالحة");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const apiKey = process.env.GOOGLE_MAPS_API_KEY;
    const lovableKey = process.env.LOVABLE_API_KEY;
    if (!apiKey || !lovableKey) throw new Error("خدمة تحديد الموقع غير مهيأة");

    const url = `${GATEWAY_URL}/maps/api/geocode/json?latlng=${data.lat},${data.lng}&language=tr&result_type=administrative_area_level_1|locality`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${lovableKey}`,
        "X-Connection-Api-Key": apiKey,
      },
    });
    if (!res.ok) {
      const body = await res.text();
      console.error(`Geocode request failed [${res.status}]: ${body}`);
      throw new Error("تعذّر تحديد المدينة من الموقع");
    }
    const json = (await res.json()) as {
      status?: string;
      results?: Array<{
        formatted_address?: string;
        address_components?: Array<{ long_name?: string; short_name?: string; types?: string[] }>;
      }>;
    };
    if (json.status !== "OK" || !json.results?.length) throw new Error("لم نتمكن من تحديد مدينتك، اخترها يدوياً");

    // Prefer the administrative_area_level_1 (province), fall back to locality.
    let name = "";
    for (const r of json.results) {
      for (const c of r.address_components ?? []) {
        if (c.types?.includes("administrative_area_level_1") && c.long_name) {
          name = c.long_name;
          break;
        }
        if (!name && c.types?.includes("locality") && c.long_name) name = c.long_name;
      }
      if (name) break;
    }
    if (!name) name = json.results[0]?.address_components?.[0]?.long_name ?? "";
    if (!name) throw new Error("لم نتمكن من تحديد مدينتك، اخترها يدوياً");

    // Map to a province from our list when it matches; otherwise return the raw name.
    const match = cities.find((c) => normalize(c) === normalize(name));
    return { city: match ?? name };
  });
