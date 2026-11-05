/**
 * Date helpers for event rows.
 * Event dates/times are free text typed by staff in the admin dashboard
 * ("2026-11-05", "05/11/2026", "5/11", "18:00", "6:30 م"...), so parsing is tolerant.
 */

const ARABIC_DIGITS = "٠١٢٣٤٥٦٧٨٩";
const PERSIAN_DIGITS = "۰۱۲۳۴۵۶۷۸۹";

export type ParsedEvent = { start: Date; hasTime: boolean };

/** Converts Arabic-Indic / Persian digits to ASCII so regexes work on them. */
export function normalizeDigits(input: string): string {
  let out = "";
  for (const ch of input) {
    const a = ARABIC_DIGITS.indexOf(ch);
    if (a >= 0) {
      out += String(a);
      continue;
    }
    const p = PERSIAN_DIGITS.indexOf(ch);
    if (p >= 0) {
      out += String(p);
      continue;
    }
    out += ch;
  }
  return out;
}

/** Month names staff may type instead of a number (Arabic, English, Turkish). */
const MONTH_NAMES: [string, number][] = [
  ["كانون الثاني", 1], ["كانون الاول", 1], ["كانون الأول", 1], ["يناير", 1], ["كانون2", 1], ["january", 1], ["jan", 1], ["ocak", 1],
  ["شباط", 2], ["فبراير", 2], ["شباط2", 2], ["february", 2], ["feb", 2], ["subat", 2], ["şubat", 2],
  ["آذار", 3], ["اذار", 3], ["مارس", 3], ["mart", 3], ["march", 3], ["mar", 3],
  ["نيسان", 4], ["ابريل", 4], ["أبريل", 4], ["nisan", 4], ["april", 4], ["apr", 4],
  ["ايار", 5], ["أيار", 5], ["مايو", 5], ["mayis", 5], ["mayıs", 5], ["may", 5],
  ["حزيران", 6], ["يونيو", 6], ["haziran", 6], ["june", 6], ["jun", 6],
  ["تموز", 7], ["يوليو", 7], ["temmuz", 7], ["july", 7], ["jul", 7],
  ["اب", 8], ["أب", 8], ["اغسطس", 8], ["أغسطس", 8], ["آب", 8], ["agustos", 8], ["ağustos", 8], ["august", 8], ["aug", 8],
  ["ايلول", 9], ["أيلول", 9], ["سبتمبر", 9], ["eylul", 9], ["eylül", 9], ["september", 9], ["sep", 9],
  ["تشرين الاول", 10], ["تشرين الأول", 10], ["اكتوبر", 10], ["أكتوبر", 10], ["ekim", 10], ["october", 10], ["oct", 10],
  ["تشرين الثاني", 11], ["نوفمبر", 11], ["kasim", 11], ["kasım", 11], ["november", 11], ["nov", 11],
  ["كانون الاول2", 12], ["كانون الأول", 12], ["كانون2", 12], ["ديسمبر", 12], ["aralik", 12], ["aralık", 12], ["december", 12], ["dec", 12],
];

/**
 * Reads "8 تشرين الثاني", "5 نوفمبر 2027", "10 Nov" and the like.
 * Returns null when the text carries no month name or no day number.
 */
function parseMonthNameDate(raw: string): { y: number; mo: number; d: number } | null {
  const t = normalizeDigits(raw)
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, " ")
    .replace(/\s+/g, " ")
    .trim();
  if (!t) return null;

  let month: number | null = null;
  let rest = t;
  for (const [name, m] of MONTH_NAMES) {
    if (rest.includes(name)) {
      month = m;
      rest = rest.replace(name, " ");
      break;
    }
  }
  if (!month) return null;

  const nums = (rest.match(/\d{1,4}/g) || []).map(Number).filter((n) => n > 0);
  const year = nums.find((n) => n >= 1000) ?? null;
  const day = nums.find((n) => n < 1000 && n <= 31) ?? null;
  if (!day) return null;

  const now = new Date();
  const y = year ?? now.getFullYear();
  const candidate = new Date(y, month - 1, day);
  // A bare "8 تشرين الثاني" that already passed means next year's edition.
  if (!year && candidate.getTime() < now.getTime() - 86400000) return { y: y + 1, mo: month, d: day };
  return { y, mo: month, d: day };
}

function timeToMinutes(time: string): { hour: number; minute: number } | null {
  const t = normalizeDigits(time || "").toLowerCase();
  const m = t.match(/(\d{1,2})[:.](\d{2})/);
  if (!m) return null;
  let hour = Number(m[1]);
  const minute = Number(m[2]);
  if (hour > 23 || minute > 59) return null;
  // Arabic letters are not "word" characters, so \b never matches around م / ص.
  const pm = /(pm|p\.m|مساء|عصر)/.test(t) || /م\s*$/.test(t.trim());
  const am = /(am|a\.m|صباح)/.test(t) || /ص\s*$/.test(t.trim());
  if (pm && hour < 12) hour += 12;
  if (am && hour === 12) hour = 0;
  return { hour, minute };
}

/**
 * Tolerant parser for the free-text date/time columns.
 * Returns null when nothing usable is found, so the page can skip date-only UI.
 */
export function parseEventDate(date: string, time = ""): ParsedEvent | null {
  const raw = normalizeDigits((date || "").trim());
  if (!raw) return null;

  let y: number | null = null;
  let mo: number | null = null;
  let d: number | null = null;

  const iso = raw.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  const dmy = raw.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})/);
  const dm = raw.match(/^(\d{1,2})[-/.](\d{1,2})$/);

  if (iso) {
    y = Number(iso[1]);
    mo = Number(iso[2]);
    d = Number(iso[3]);
  } else if (dmy) {
    d = Number(dmy[1]);
    mo = Number(dmy[2]);
    y = Number(dmy[3]);
  } else if (dm) {
    const now = new Date();
    d = Number(dm[1]);
    mo = Number(dm[2]);
    y = now.getFullYear();
    // "5/11" already passed this year -> the student means next year.
    if (mo < 1 || mo > 12 || d < 1 || d > 31 || new Date(y, mo - 1, d).getTime() < now.getTime() - 86400000) y += 1;
  } else {
    const parsed = new Date(raw);
    if (!Number.isNaN(parsed.getTime())) {
      const t = timeToMinutes(time);
      return { start: t ? new Date(parsed.getFullYear(), parsed.getMonth(), parsed.getDate(), t.hour, t.minute) : parsed, hasTime: !!t };
    }
    return null;
  }

  if (!y || !mo || !d || mo < 1 || mo > 12 || d < 1 || d > 31) return null;
  const t = timeToMinutes(time);
  if (t) return { start: new Date(y, mo - 1, d, t.hour, t.minute), hasTime: true };
  return { start: new Date(y, mo - 1, d), hasTime: false };
}

/** Day / month / weekday parts for the square date badge, in Arabic. */
export function eventDayBadge(date: Date): { day: string; month: string; weekday: string } {
  const fmt = (opts: Intl.DateTimeFormatOptions) => {
    try {
      return new Intl.DateTimeFormat("ar", opts).format(date);
    } catch {
      return date.toLocaleDateString("en-GB", opts);
    }
  };
  return {
    day: fmt({ day: "2-digit" }),
    month: fmt({ month: "long" }),
    weekday: fmt({ weekday: "long" }),
  };
}

/** "يوم غد / بعد 3 أيام / منتهي" style hint used next to the countdown. */
export function eventCountdown(target: Date, now = new Date()): { done: boolean; parts: { value: number; label: string }[] } {
  const ms = target.getTime() - now.getTime();
  if (ms <= 0) return { done: true, parts: [] };
  const totalMinutes = Math.floor(ms / 60000);
  const days = Math.floor(totalMinutes / (60 * 24));
  const hours = Math.floor((totalMinutes % (60 * 24)) / 60);
  const minutes = totalMinutes % 60;
  const parts: { value: number; label: string }[] = [];
  if (days) parts.push({ value: days, label: "يوم" });
  if (hours || days) parts.push({ value: hours, label: "ساعة" });
  parts.push({ value: minutes, label: "دقيقة" });
  return { done: false, parts };
}

function escapeIcs(text: string): string {
  return (text || "")
    .replace(/\\/g, "\\\\")
    .replace(/;/g, "\\;")
    .replace(/,/g, "\\,")
    .replace(/\r?\n/g, "\\n");
}

/** RFC 5545 wraps long lines: continuation lines start with a space. */
function foldIcs(line: string): string {
  if (line.length <= 72) return line;
  const out: string[] = [];
  let rest = line;
  while (rest.length > 72) {
    out.push(rest.slice(0, 72));
    rest = " " + rest.slice(72);
  }
  out.push(rest);
  return out.join("\r\n");
}

function toUtcStamp(date: Date): string {
  return date.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
}

function toDateStamp(date: Date): string {
  const p = (n: number) => String(n).padStart(2, "0");
  return `${date.getFullYear()}${p(date.getMonth() + 1)}${p(date.getDate())}`;
}

/**
 * Builds a .ics file so a student can add the event to their phone calendar.
 * All-day when the admin left the time empty, timed (UTC) otherwise.
 */
export function buildEventIcs(ev: { id?: string; title: string; place?: string; description?: string; date: string; time?: string }, now = new Date()): string {
  const parsed = parseEventDate(ev.date, ev.time);
  const lines: string[] = ["BEGIN:VCALENDAR", "VERSION:2.0", "PRODID:-//GUSS//Events//AR", "CALSCALE:GREGORIAN", "BEGIN:VEVENT"];
  lines.push(`UID:${ev.id || "event"}@guss`);
  lines.push(`DTSTAMP:${toUtcStamp(now)}`);
  if (parsed && parsed.hasTime) {
    const end = new Date(parsed.start.getTime() + 2 * 60 * 60 * 1000);
    lines.push(`DTSTART:${toUtcStamp(parsed.start)}`);
    lines.push(`DTEND:${toUtcStamp(end)}`);
  } else if (parsed) {
    const nextDay = new Date(parsed.start.getTime() + 24 * 60 * 60 * 1000);
    lines.push(`DTSTART;VALUE=DATE:${toDateStamp(parsed.start)}`);
    lines.push(`DTEND;VALUE=DATE:${toDateStamp(nextDay)}`);
  } else {
    // No usable date: keep the entry so the student still gets title + place.
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const nextDay = new Date(day.getTime() + 24 * 60 * 60 * 1000);
    lines.push(`DTSTART;VALUE=DATE:${toDateStamp(day)}`);
    lines.push(`DTEND;VALUE=DATE:${toDateStamp(nextDay)}`);
  }
  lines.push(`SUMMARY:${escapeIcs(ev.title)}`);
  if (ev.place) lines.push(`LOCATION:${escapeIcs(ev.place)}`);
  const desc = [ev.description, ev.date && ev.time ? `${ev.date} — ${ev.time}` : ev.date].filter(Boolean).join("\n");
  if (desc) lines.push(`DESCRIPTION:${escapeIcs(desc)}`);
  lines.push("END:VEVENT", "END:VCALENDAR");
  return lines.map(foldIcs).join("\r\n") + "\r\n";
}

/** Safe file name for the downloaded .ics. */
export function icsFileName(title: string): string {
  const base = (title || "event").replace(/[\\/:*?"<>|]+/g, "").replace(/\s+/g, "-").slice(0, 60).replace(/^-+|-+$/g, "");
  return `${base || "event"}.ics`;
}

/** Triggers the browser download of an .ics string. */
export function downloadEventIcs(ics: string, fileName: string) {
  const url = URL.createObjectURL(new Blob([ics], { type: "text/calendar;charset=utf-8" }));
  const a = document.createElement("a");
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 1000);
}
