import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cities } from "@/lib/turkey-universities";
import { findProvince, loadOutlines, nearestProvince } from "@/lib/province-shapes";

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

function toCityName(raw: string) {
  return cities.find((c) => normalize(c) === normalize(raw)) ?? raw;
}

/**
 * Reverse-geocodes the user's coordinates to a Turkish province (city).
 * Runs entirely on our own province outlines, so it needs no external service;
 * when the Google Maps connector is linked it is used first for a finer match.
 * Only signed-in users can call it.
 */
export const detectCity = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { lat: number; lng: number }) => {
    if (
      typeof d?.lat !== "number" ||
      typeof d?.lng !== "number" ||
      Number.isNaN(d.lat) ||
      Number.isNaN(d.lng) ||
      Math.abs(d.lat) > 90 ||
      Math.abs(d.lng) > 180
    ) {
      throw new Error("إحداثيات غير صالحة");
    }
    return d;
  })
  .handler(async ({ data }) => {
    const { lat, lng } = data;

    // Optional upgrade: use Google when this workspace has the connector linked.
    const apiKey = process.env["GOOGLE_MAPS_API_KEY"];
    const lovableKey = process.env["LOVABLE_API_KEY"];
    if (apiKey && lovableKey) {
      try {
        const url = `${GATEWAY_URL}/maps/api/geocode/json?latlng=${lat},${lng}&language=tr&result_type=administrative_area_level_1|locality`;
        const res = await fetch(url, {
          headers: {
            Authorization: `Bearer ${lovableKey}`,
            "X-Connection-Api-Key": apiKey,
          },
        });
        if (res.ok) {
          const json = (await res.json()) as {
            status?: string;
            results?: Array<{
              address_components?: Array<{ long_name?: string; types?: string[] }>;
            }>;
          };
          let name = "";
          if (json.status === "OK") {
            for (const r of json.results ?? []) {
              for (const c of r.address_components ?? []) {
                if (c.types?.includes("administrative_area_level_1") && c.long_name) {
                  name = c.long_name;
                  break;
                }
                if (!name && c.types?.includes("locality") && c.long_name) name = c.long_name;
              }
              if (name) break;
            }
          }
          if (name) return { city: toCityName(name) };
        } else {
          console.error(`Geocode request failed [${res.status}]: ${await res.text()}`);
        }
      } catch (e) {
        console.error("Google geocoding failed, falling back to local outlines:", e);
      }
    }

    const geo = await loadOutlines();
    const hit = findProvince(geo, lng, lat);
    if (hit) return { city: toCityName(hit) };

    // Just outside a simplified border (coastline, river boundary): take the closest province.
    const near = await nearestProvince(lat, lng, 40);
    if (near) return { city: toCityName(near) };

    throw new Error("موقعك خارج تركيا، اختر مدينتك من القائمة");
  });
