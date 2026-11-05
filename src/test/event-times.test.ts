import { describe, expect, it } from "vitest";
import { buildEventIcs, eventCountdown, eventDayBadge, icsFileName, normalizeDigits, parseEventDate } from "@/lib/event-times";

describe("parseEventDate", () => {
  it("reads an ISO date written by staff", () => {
    const p = parseEventDate("2026-11-05", "18:00");
    expect(p?.start.getFullYear()).toBe(2026);
    expect(p?.start.getMonth()).toBe(10);
    expect(p?.start.getDate()).toBe(5);
    expect(p?.start.getHours()).toBe(18);
    expect(p?.hasTime).toBe(true);
  });

  it("reads day/month/year", () => {
    const p = parseEventDate("05/11/2026", "9:30 م");
    expect(p?.start.getDate()).toBe(5);
    expect(p?.start.getMonth()).toBe(10);
    expect(p?.start.getHours()).toBe(21);
    expect(p?.start.getMinutes()).toBe(30);
  });

  it("treats a day/month without a year as the next match", () => {
    const p = parseEventDate("5/11");
    expect(p).not.toBeNull();
    expect(p!.start.getMonth()).toBe(10);
    expect(p!.start.getTime()).toBeGreaterThanOrEqual(new Date(new Date().getFullYear(), 10, 5).getTime() - 86400000);
  });

  it("accepts Arabic-Indic digits", () => {
    const p = parseEventDate("٢٠٢٦-١١-٠٥", "٦:٣٠ م");
    expect(p?.start.getDate()).toBe(5);
    expect(p?.start.getHours()).toBe(18);
    expect(p?.start.getMinutes()).toBe(30);
  });

  it("stays date-only when no time is written", () => {
    const p = parseEventDate("2026-11-05", "");
    expect(p?.hasTime).toBe(false);
    expect(p?.start.getHours()).toBe(0);
  });

  it("reads an Arabic month name", () => {
    const p = parseEventDate("8 تشرين الثاني", "18:00");
    expect(p?.start.getMonth()).toBe(10);
    expect(p?.start.getDate()).toBe(8);
    expect(p?.start.getHours()).toBe(18);
  });

  it("reads a month name with an explicit year", () => {
    const p = parseEventDate("5 نوفمبر 2027", "");
    expect(p?.start.getFullYear()).toBe(2027);
    expect(p?.start.getMonth()).toBe(10);
    expect(p?.start.getDate()).toBe(5);
  });

  it("reads English and Turkish month names", () => {
    expect(parseEventDate("10 Nov")?.start.getMonth()).toBe(10);
    expect(parseEventDate("3 Ocak 2027")?.start.getMonth()).toBe(0);
  });

  it("keeps the two Kanun months apart", () => {
    expect(parseEventDate("2 كانون الأول 2027")?.start.getMonth()).toBe(11);
    expect(parseEventDate("2 كانون الثاني 2027")?.start.getMonth()).toBe(0);
  });

  it("returns null for text that carries no date", () => {
    expect(parseEventDate("قريباً", "")).toBeNull();
    expect(parseEventDate("", "18:00")).toBeNull();
  });

  it("normalizes digits only, leaving other text alone", () => {
    expect(normalizeDigits("١٠/١١")).toBe("10/11");
    expect(normalizeDigits("Kilis")).toBe("Kilis");
  });
});

describe("eventDayBadge", () => {
  it("returns a zero-padded day plus month and weekday text", () => {
    const badge = eventDayBadge(new Date(2026, 10, 5));
    expect(badge.day).toBe("05");
    expect(badge.month.length).toBeGreaterThan(0);
    expect(badge.weekday.length).toBeGreaterThan(0);
  });
});

describe("eventCountdown", () => {
  it("counts days, hours and minutes until the event", () => {
    const now = new Date(2026, 10, 1, 10, 0, 0);
    const c = eventCountdown(new Date(2026, 10, 4, 12, 30, 0), now);
    expect(c.done).toBe(false);
    expect(c.parts).toEqual([
      { value: 3, label: "يوم" },
      { value: 2, label: "ساعة" },
      { value: 30, label: "دقيقة" },
    ]);
  });

  it("is done once the time has passed", () => {
    const now = new Date(2026, 10, 5, 12, 0, 0);
    expect(eventCountdown(new Date(2026, 10, 5, 11, 59, 0), now).done).toBe(true);
  });
});

describe("buildEventIcs", () => {
  it("writes a timed event with summary, place and description", () => {
    const ics = buildEventIcs(
      { id: "abc", title: "لقاء الطلاب", place: "Kilis Merkez", description: "حوار مفتوح", date: "2026-11-05", time: "18:00" },
      new Date(2026, 10, 1),
    );
    expect(ics).toContain("BEGIN:VCALENDAR");
    expect(ics).toContain("UID:abc@guss");
    expect(ics).toContain("DTSTART:20261105T180000Z");
    expect(ics).toContain("DTEND:20261105T200000Z");
    expect(ics).toContain("SUMMARY:لقاء الطلاب");
    expect(ics).toContain("LOCATION:Kilis Merkez");
    expect(ics).toContain("END:VCALENDAR");
  });

  it("writes an all-day event when the time is empty", () => {
    const ics = buildEventIcs({ id: "x", title: "Y", date: "2026-11-05", time: "" }, new Date(2026, 10, 1));
    expect(ics).toContain("DTSTART;VALUE=DATE:20261105");
    expect(ics).toContain("DTEND;VALUE=DATE:20261106");
    expect(ics).not.toContain("DTSTART:");
  });

  it("escapes commas and semicolons so the file stays valid", () => {
    const ics = buildEventIcs({ id: "y", title: "A, B; C", date: "2026-11-05", time: "" }, new Date(2026, 10, 1));
    expect(ics).toContain("SUMMARY:A\\, B\\; C");
  });

  it("wraps very long lines", () => {
    const ics = buildEventIcs({ id: "z", title: "T", description: "س".repeat(200), date: "2026-11-05", time: "" }, new Date(2026, 10, 1));
    const long = ics.split("\r\n").filter((l) => l.startsWith("DESCRIPTION"));
    expect(long[0].length).toBeLessThanOrEqual(72);
    expect(ics).toContain("\r\n س");
  });
});

describe("icsFileName", () => {
  it("strips characters a file name cannot hold", () => {
    expect(icsFileName("لقاء/الطلاب: 2026")).toBe("لقاءالطلاب-2026.ics");
    expect(icsFileName("   ")).toBe("event.ics");
  });
});
