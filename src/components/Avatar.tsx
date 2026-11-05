import { User } from "lucide-react";
import { useAvatarUrl } from "@/lib/avatar";

type Props = {
  path?: string | null;
  name?: string | null;
  className?: string;
  textClass?: string;
};

/** Shows the student's photo, or their initials when there is none yet. */
export function Avatar({ path, name, className = "h-10 w-10", textClass = "text-sm" }: Props) {
  const { data: url } = useAvatarUrl(path);
  const initials = (name ?? "")
    .trim()
    .split(/\s+/)
    .slice(0, 2)
    .map((w) => w[0] ?? "")
    .join("");

  if (url) return <img src={url} alt={name || "الصورة الشخصية"} className={`${className} shrink-0 rounded-full object-cover`} />;

  return (
    <span className={`${className} ${textClass} grid shrink-0 place-items-center rounded-full bg-secondary font-bold text-primary`}>
      {initials || <User className="h-1/2 w-1/2" />}
    </span>
  );
}
