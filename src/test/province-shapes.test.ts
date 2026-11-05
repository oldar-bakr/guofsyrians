import { describe, expect, it } from "vitest";
import { cities } from "@/lib/turkey-universities";
import { findProvince, loadOutlines, nearestProvince } from "@/lib/province-shapes";

// Real positions of three provincial capitals (lat, lng).
const ISTANBUL = { lat: 41.0082, lng: 28.9784 };
const ANKARA = { lat: 39.9334, lng: 32.8597 };
const IZMIR = { lat: 38.4237, lng: 27.1428 };

describe("detecting the student's city from their position", () => {
  it("names the province the position falls in", async () => {
    const geo = await loadOutlines();
    expect(findProvince(geo, ISTANBUL.lng, ISTANBUL.lat)).toBe("İstanbul");
    expect(findProvince(geo, ANKARA.lng, ANKARA.lat)).toBe("Ankara");
    expect(findProvince(geo, IZMIR.lng, IZMIR.lat)).toBe("İzmir");
  });

  it("covers every city the student can pick from", async () => {
    const geo = await loadOutlines();
    const missing = cities.filter((c) => !geo[c]?.length);
    expect(missing).toEqual([]);
  });

  it("refuses a position in the sea and one outside Turkey", async () => {
    const geo = await loadOutlines();
    // Middle of the Black Sea, and central Cairo.
    expect(findProvince(geo, 30.0, 42.0)).toBeNull();
    expect(await nearestProvince(30.0444, 31.2357, 40)).toBeNull();
  });
});
