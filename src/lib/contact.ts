/**
 * Official contact details of the General Union of Syrian Students (GUSS).
 * Single source of truth: app pages and the assistant both read from here.
 */
const ADDRESS = "Atatürk Mahallesi, Şehit Ahmetuğur Edeoğlu Sokak No:11, Kilis Merkez";

export const CONTACT = {
  email: "guofsysrians@gmail.com",
  phone: "+90 507 530 88 10",
  phoneHref: "tel:+905075308810",
  address: ADDRESS,
  mapsHref: `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(ADDRESS)}`,
  socials: [
    { key: "instagram", label: "إنستغرام", href: "https://www.instagram.com/guofsyrians" },
    { key: "facebook", label: "فيسبوك", href: "https://www.facebook.com/profile.php?id=61556795854406" },
    { key: "x", label: "إكس", href: "https://x.com/guofsyrians" },
  ],
} as const;

/** One-line summary used by the smart assistant's knowledge block. */
export const CONTACT_SUMMARY =
  `البريد الإلكتروني: ${CONTACT.email} — رقم الهاتف: ${CONTACT.phone} — ` +
  `العنوان: ${CONTACT.address} — ` +
  CONTACT.socials.map((s) => `${s.label}: ${s.href}`).join(" — ");
