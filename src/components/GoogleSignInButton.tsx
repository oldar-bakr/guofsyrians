import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Google sign-in button built to Google's branding guidelines:
 * the official four-colour "G" (18x18, decorative) + label, 12px / 10px / 12px
 * padding, 40px tall, and one of Google's approved themes (light here).
 * The app is Arabic-only, so the label uses the app's font at medium weight
 * instead of Google Sans, which carries no Arabic glyphs.
 */
function GoogleLogo() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      style={{ width: 18, height: 18 }}
      className="shrink-0"
    >
      <path
        fill="#4285F4"
        d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z"
      />
      <path
        fill="#34A853"
        d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z"
      />
      <path
        fill="#FBBC05"
        d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z"
      />
      <path
        fill="#EA4335"
        d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z"
      />
    </svg>
  );
}

type Props = {
  onClick: () => void;
  label?: string;
  className?: string;
  disabled?: boolean;
};

export function GoogleSignInButton({
  onClick,
  label = "المتابعة مع Google",
  className,
  disabled,
}: Props) {
  return (
    <Button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        "h-10 w-full gap-[10px] rounded-xl px-[12px] text-sm leading-5 font-medium",
        "border border-google-border bg-google-surface text-google-text hover:bg-google-hover",
        className,
      )}
    >
      <GoogleLogo />
      {label}
    </Button>
  );
}
