import { Mail, MapPin, Phone } from "lucide-react";
import { CONTACT } from "@/lib/contact";

type SocialKey = (typeof CONTACT.socials)[number]["key"];

function SocialIcon({ name, className }: { name: SocialKey; className?: string }) {
  if (name === "instagram") {
    return (
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={1.8}
        strokeLinecap="round"
        strokeLinejoin="round"
        className={className}
        aria-hidden="true"
      >
        <rect x="2.6" y="2.6" width="18.8" height="18.8" rx="5.2" />
        <circle cx="12" cy="12" r="4.1" />
        <circle cx="17.2" cy="6.8" r="1.1" fill="currentColor" stroke="none" />
      </svg>
    );
  }
  if (name === "facebook") {
    return (
      <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
        <path d="M24 12.07C24 5.4 18.63 0 12 0S0 5.4 0 12.07c0 5.99 4.39 10.95 10.13 11.83v-8.38H7.08v-3.47h3.05V9.43c0-3.01 1.79-4.67 4.53-4.67 1.31 0 2.69.24 2.69.24v2.95h-1.51c-1.49 0-1.96.93-1.96 1.87v2.25h3.33l-.53 3.47h-2.8v8.38C19.61 23.02 24 18.06 24 12.07Z" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden="true">
      <path d="M18.9 1.15h3.68l-8.04 9.19L24 22.85h-7.41l-5.8-7.58-6.64 7.58H.47l8.6-9.83L0 1.15h7.59l5.24 6.93 6.07-6.93Zm-.29 19.5h2.04L6.49 3.24H4.3l14.31 17.41Z" />
    </svg>
  );
}

/**
 * Contact pills (email, phone, address) plus social buttons.
 * `variant="dark"` is for use on the green hero/member backgrounds.
 */
export function ContactLinks({
  variant = "light",
  showAddress = true,
}: {
  variant?: "light" | "dark";
  showAddress?: boolean;
}) {
  const dark = variant === "dark";
  const pill = `flex items-center gap-2 rounded-full border px-4 py-2 text-sm font-medium transition-colors ${
    dark
      ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
      : "border-border bg-card text-foreground hover:bg-secondary"
  }`;
  const iconColor = dark ? "text-accent" : "text-primary";

  return (
    <div className="flex flex-wrap items-center gap-2">
      <a href={`mailto:${CONTACT.email}`} dir="ltr" className={pill}>
        <Mail className={`h-4 w-4 shrink-0 ${iconColor}`} />
        {CONTACT.email}
      </a>
      <a href={CONTACT.phoneHref} dir="ltr" className={pill}>
        <Phone className={`h-4 w-4 shrink-0 ${iconColor}`} />
        {CONTACT.phone}
      </a>
      {showAddress && (
        <a href={CONTACT.mapsHref} target="_blank" rel="noreferrer" className={pill}>
          <MapPin className={`h-4 w-4 shrink-0 ${iconColor}`} />
          {CONTACT.address}
        </a>
      )}
      <div className="flex items-center gap-2">
        {CONTACT.socials.map((s) => (
          <a
            key={s.key}
            href={s.href}
            target="_blank"
            rel="noreferrer"
            aria-label={s.label}
            title={s.label}
            className={`grid h-9 w-9 place-items-center rounded-full border transition-colors ${
              dark
                ? "border-primary-foreground/25 bg-primary-foreground/10 text-primary-foreground hover:bg-primary-foreground/20"
                : "border-border bg-card text-primary hover:bg-secondary"
            }`}
          >
            <SocialIcon name={s.key} className="h-4 w-4" />
          </a>
        ))}
      </div>
    </div>
  );
}
