/** A student gets discounts only when the admin activated them, the membership hasn't expired, and the account isn't blocked. */
export function isMembershipActive(p: { membership_active: boolean; membership_expires: string | null }, banned = false, today = new Date()): boolean {
  if (banned || !p.membership_active) return false;
  if (!p.membership_expires) return true;
  const day = today.toISOString().slice(0, 10);
  return p.membership_expires >= day;
}

/** Reads the member code (and optional deal id) out of a student's QR code: "guss:CODE" or "guss:CODE:deal:ID". */
export function parseStudentQr(raw: string): { code: string; dealId: string | null } | null {
  const v = raw.trim();
  const m = /^guss:([^:\s]+)(?::deal:([0-9a-f-]{36}))?$/i.exec(v);
  if (m) return { code: m[1]!, dealId: m[2] ?? null };
  if (/^GUSS-\d{4}-\d{5}$/i.test(v)) return { code: v.toUpperCase(), dealId: null };
  return null;
}
