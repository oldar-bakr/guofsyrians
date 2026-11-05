import { useEffect, useState } from "react";
import { GraduationCap } from "lucide-react";

type Entry = { site?: string; logo?: string };
let cache: Record<string, Entry> | null = null;

// Logo comes from Wikimedia (Wikidata) or, failing that, the university website's icon.
export function UniversityLogo({ university, className = "h-4 w-4" }: { university: string; className?: string }) {
  const [map, setMap] = useState(cache);
  const [step, setStep] = useState(0);
  useEffect(() => {
    if (!cache) import("@/data/university-logos.json").then((m) => { cache = m.default as Record<string, Entry>; setMap(cache); });
  }, []);
  useEffect(() => setStep(0), [university]);
  if (!university) return null;
  const e = map?.[university];
  const srcs = [e?.logo, e?.site && `https://www.google.com/s2/favicons?domain=${e.site}&sz=128`].filter(Boolean) as string[];
  const src = srcs[step];
  return (
    <span title={university} className={`grid shrink-0 place-items-center overflow-hidden rounded-full border-2 border-card bg-card shadow-soft ${className}`}>
      {src ? <img src={src} alt={university} className="h-full w-full object-contain p-px" onError={() => setStep((s) => s + 1)} /> : <GraduationCap className="h-3/4 w-3/4 text-primary" />}
    </span>
  );
}
