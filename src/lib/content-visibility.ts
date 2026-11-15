export type Publication = { active?: boolean; staff_active?: boolean; status?: string };
export function isPublished(row: Publication) {
  return row.active !== false && row.staff_active !== false && (!row.status || row.status === "approved");
}
export function splitReviewRows<T extends { status?: string }>(rows: T[]) {
  return { pending: rows.filter(row => row.status === "pending"), published: rows.filter(row => row.status !== "pending") };
}