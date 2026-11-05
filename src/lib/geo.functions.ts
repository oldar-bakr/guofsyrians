import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { cities } from "@/lib/turkey-universities";

const GATEWAY_URL = "https://connector-gateway.lovable.dev/google_maps";

// Province outlines: { "Adana": [ [ [ [lng, lat], ... ] ] ] } — polygon → rings → points.
type ProvinceOutlines = Record<string, Array<Array<Array<[number, number]>>>>;
type Centroids = Record<string, [number, number]>;

let outlines: ProvinceOutlines | null = null;
let centroids: Centroids | null = null;

async function loadOutlines(): Promise<ProvinceOutlines> {
  if (!outlines) {
    outlines = (await import("@/data/turkey-provinces.json")).default as ProvinceOutlines;
  }
  return outlines;
}

async function loadCentroids(): Promise<Centroids> {
  if (!centroids) {
    const geo = await loadOutlines();
    centroids = {};
    for (const [name, polys] of Object.entries(geo)) {
      let lat = 0;
      let lng = 0;
      let n = 0;
      for (const poly of polys) {
        for (const ring of poly) {
          for (const [x, y] of ring) {
            lng += x;
            lat += y;
            n++;
          }
        }
      }
      if (n) centroids[name] = [lat / n, lng / n];
    }
  }
  return centroids;
}

// Ray casting: is (lng, lat) inside the ring?
function inRing(lng: number, lat: number, ring: Array<[number, number]>) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const [xi, yi] = ring[i];
    const [xj, yj] = ring[j];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

function findProvince(geo: ProvinceOutlines, lng: number, lat: number) {
  for (const [name, polys] of Object.entries(geo)) {
    for (const poly of polys) {
      for (const ring of poly) {
        if (inRing(lng, lat, ring)) return name;
      }
    }
  }
  return null;
}

// Great-circle distance in km.
function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

async function nearestProvince(lat: number, lng: number, limitKm: number) {
  const cent = await loadCentroids();
  let best = "";
  let bestD = Infinity;
  for (const [name, [cLat, cLng]] of Object.entries(cent)) {
    const d = distanceKm(lat, lng, cLat, cLng);
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return bestD <= limitKm ? best : null;
}

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
