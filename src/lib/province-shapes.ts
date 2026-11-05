// Pure geometry helpers for turning a map position into a Turkish province.
// The outlines in @/data/turkey-provinces.json come from a public province
// boundary dataset, simplified so the file stays small; borders are accurate to
// well under a kilometre, which is far more precise than a phone's location.

// { "Adana": [ [ [ [lng, lat], ... ] ] ] } — province → polygons → rings → points.
export type ProvinceOutlines = Record<string, Array<Array<Array<[number, number]>>>>;
export type Centroids = Record<string, [number, number]>;

let outlines: ProvinceOutlines | null = null;
let centroids: Centroids | null = null;

export async function loadOutlines(): Promise<ProvinceOutlines> {
  if (!outlines) {
    outlines = (await import("@/data/turkey-provinces.json")).default as unknown as ProvinceOutlines;
  }
  return outlines;
}

export async function loadCentroids(): Promise<Centroids> {
  if (!centroids) {
    const geo = await loadOutlines();
    centroids = {};
    for (const [name, polys] of Object.entries(geo)) {
      let lat = 0;
      let lng = 0;
      let n = 0;
      for (const poly of polys) {
        for (const ring of poly) {
          for (const pt of ring) {
            if (!pt) continue;
            lng += pt[1];
            lat += pt[0];
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
export function inRing(lng: number, lat: number, ring: Array<[number, number]>) {
  let inside = false;
  for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
    const cur = ring[i];
    const prev = ring[j];
    if (!cur || !prev) continue;
    const xi = cur[0];
    const yi = cur[1];
    const xj = prev[0];
    const yj = prev[1];
    if (yi > lat !== yj > lat && lng < ((xj - xi) * (lat - yi)) / (yj - yi) + xi) {
      inside = !inside;
    }
  }
  return inside;
}

export function findProvince(geo: ProvinceOutlines, lng: number, lat: number) {
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
export function distanceKm(aLat: number, aLng: number, bLat: number, bLng: number) {
  const R = 6371;
  const dLat = ((bLat - aLat) * Math.PI) / 180;
  const dLng = ((bLng - aLng) * Math.PI) / 180;
  const h =
    Math.sin(dLat / 2) ** 2 +
    Math.cos((aLat * Math.PI) / 180) * Math.cos((bLat * Math.PI) / 180) * Math.sin(dLng / 2) ** 2;
  return 2 * R * Math.asin(Math.sqrt(h));
}

// Closest province when a position falls just outside a simplified border
// (coastline, river). Returns null when nothing is within limitKm.
export async function nearestProvince(lat: number, lng: number, limitKm: number) {
  const cent = await loadCentroids();
  let best = "";
  let bestD = Infinity;
  for (const [name, c] of Object.entries(cent)) {
    if (!c) continue;
    const d = distanceKm(lat, lng, c[0], c[1]);
    if (d < bestD) {
      bestD = d;
      best = name;
    }
  }
  return bestD <= limitKm ? best : null;
}
