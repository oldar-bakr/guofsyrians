import { phoneHref } from "@/lib/assistant-links";

/** Read only the contact details published on the product, never the seller's private profile. */
export function productContacts(contact: string) {
  const emails = Array.from(new Set(contact.match(/[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}/gi) ?? []));
  const withoutEmails = emails.reduce((text, email) => text.replaceAll(email, " "), contact);
  const phones = Array.from(withoutEmails.matchAll(/\+?[0-9٠-٩۰-۹](?:[0-9٠-٩۰-۹ ()-]*[0-9٠-٩۰-۹])/gu))
    .map((match) => ({ label: match[0].trim(), href: phoneHref(match[0]) }))
    .filter((phone): phone is { label: string; href: string } => phone.href !== null);
  return { emails, phones: phones.filter((phone, index) => phones.findIndex((item) => item.href === phone.href) === index) };
}