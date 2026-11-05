import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MapPin } from "lucide-react";
import { detectCity } from "@/lib/geo.functions";

// City → university → faculty → departments, taken from YÖK Atlas (2026 guide).
type Tree = Record<string, Record<string, Record<string, string[]>>>;
let cache: Tree | null = null;
async function loadTree(): Promise<Tree> {
  if (!cache) cache = (await import("@/data/yok-programs.json")).default as Tree;
  return cache;
}

export type StudyValue = { city: string; university: string; faculty: string; department: string };

type Props = StudyValue & {
  onChange: (v: StudyValue) => void;
  className?: string;
  labelClassName?: string;
  required?: boolean;
};

const sortTr = (a: string[]) => [...a].sort((x, y) => x.localeCompare(y, "tr"));
const withCurrent = (list: string[], v: string) => (v && !list.includes(v) ? [v, ...list] : list);

export function CityUniversitySelect({ city, university, faculty, department, onChange, className, labelClassName, required }: Props) {
  const detect = useServerFn(detectCity);
  const [tree, setTree] = useState<Tree | null>(cache);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  useEffect(() => {
    if (!tree) loadTree().then(setTree);
  }, [tree]);

  const t = tree ?? {};
  const cityList = withCurrent(sortTr(Object.keys(t)), city);
  const uniList = withCurrent(sortTr(Object.keys(t[city] ?? {})), university);
  const facList = withCurrent(sortTr(Object.keys(t[city]?.[university] ?? {})), faculty);
  const depList = withCurrent(sortTr(t[city]?.[university]?.[faculty] ?? []), department);

  const locate = () => {
    setLocError("");
    if (!navigator.geolocation) return setLocError("متصفحك لا يدعم تحديد الموقع");
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { city: detected } = await detect({ data: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
          if (detected) onChange({ city: detected, university: "", faculty: "", department: "" });
          else setLocError("لم نتمكن من تحديد مدينتك، اخترها يدوياً");
        } catch (e) {
          setLocError(e instanceof Error ? e.message : "تعذّر تحديد المدينة");
        } finally {
          setLocating(false);
        }
      },
      () => {
        setLocating(false);
        setLocError("لم نحصل على إذن الموقع، اختر المدينة يدوياً");
      },
      { enableHighAccuracy: false, timeout: 10000, maximumAge: 60000 }
    );
  };

  const star = required && <span className="text-destructive"> *</span>;

  return (
    <>
      <label className="block text-sm">
        <span className={`flex items-center justify-between gap-2 ${labelClassName ?? ""}`}>
          <span>المدينة{star}</span>
          <button
            type="button"
            onClick={locate}
            disabled={locating}
            className="inline-flex items-center gap-1 rounded-full border px-2 py-0.5 text-xs font-medium text-primary transition-colors hover:bg-accent disabled:opacity-60"
          >
            <MapPin className="h-3 w-3" />
            {locating ? "جارٍ التحديد…" : "تحديد موقعي تلقائياً"}
          </button>
        </span>
        <select required={required} value={city} onChange={(e) => onChange({ city: e.target.value, university: "", faculty: "", department: "" })} className={className}>
          <option value="">{tree ? "اختر المدينة" : "جارٍ التحميل…"}</option>
          {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {locError && <span className="mt-1 block text-xs text-destructive">{locError}</span>}
      </label>
      <label className="block text-sm">
        <span className={labelClassName}>الجامعة{star}</span>
        <select required={required} disabled={!city} value={university} onChange={(e) => onChange({ city, university: e.target.value, faculty: "", department: "" })} className={className}>
          <option value="">{city ? "اختر الجامعة" : "اختر المدينة أولاً"}</option>
          {uniList.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className={labelClassName}>الكلية{star}</span>
        <select required={required} disabled={!university} value={faculty} onChange={(e) => onChange({ city, university, faculty: e.target.value, department: "" })} className={className}>
          <option value="">{university ? "اختر الكلية" : "اختر الجامعة أولاً"}</option>
          {facList.map((f) => <option key={f} value={f}>{f}</option>)}
        </select>
      </label>
      <label className="block text-sm">
        <span className={labelClassName}>القسم / التخصص{star}</span>
        <select required={required} disabled={!faculty} value={department} onChange={(e) => onChange({ city, university, faculty, department: e.target.value })} className={className}>
          <option value="">{faculty ? "اختر التخصص" : "اختر الكلية أولاً"}</option>
          {depList.map((d) => <option key={d} value={d}>{d}</option>)}
        </select>
      </label>
    </>
  );
}
