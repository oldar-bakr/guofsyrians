import { User } from "lucide-react";
import { useAvatarUrl } from "@/lib/avatar";
import { UniversityLogo } from "@/components/UniversityLogo";

type Props = {
  path?: string | null | undefined;
  name?: string | null | undefined;
  className?: string;
  textClass?: string;
  /** When given, the university logo sits as a small circle on the photo's corner. */
  university?: string | null | undefined;
};

/** Shows the student's photo, or their initials when there is none yet. */
export function Avatar({ university, ...rest }: Props) {
  if (!university) return <Photo {...rest} />;
  return (
    <span className="relative inline-block shrink-0">
      <Photo {...rest} />
      <UniversityLogo university={university} className="absolute -bottom-1 -left-1 h-[42%] w-[42%] min-h-4 min-w-4" />
    </span>
  );
}

function Photo({ path, name, className = "h-10 w-10", textClass = "text-sm" }: Omit<Props, "university">) {
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
