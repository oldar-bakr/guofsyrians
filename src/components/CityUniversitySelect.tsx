import { useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { MapPin } from "lucide-react";
import { cities, universitiesByCity } from "@/lib/turkey-universities";
import { detectCity } from "@/lib/geo.functions";

type Props = {
  city: string;
  university: string;
  onChange: (v: { city: string; university: string }) => void;
  className?: string;
  labelClassName?: string;
  required?: boolean;
};

export function CityUniversitySelect({ city, university, onChange, className, labelClassName, required }: Props) {
  const detect = useServerFn(detectCity);
  const [locating, setLocating] = useState(false);
  const [locError, setLocError] = useState("");

  const cityList = city && !cities.includes(city) ? [city, ...cities] : cities;
  const base = universitiesByCity[city] ?? [];
  const uniList = university && !base.includes(university) ? [university, ...base] : base;

  const locate = () => {
    setLocError("");
    if (!navigator.geolocation) {
      setLocError("متصفحك لا يدعم تحديد الموقع");
      return;
    }
    setLocating(true);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const { city: detected } = await detect({ data: { lat: pos.coords.latitude, lng: pos.coords.longitude } });
          if (detected) {
            onChange({ city: detected, university: "" });
          } else {
            setLocError("لم نتمكن من تحديد مدينتك، اخترها يدوياً");
          }
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

  return (
    <>
      <label className="block text-sm">
        <span className={`flex items-center justify-between gap-2 ${labelClassName ?? ""}`}>
          <span>
            المدينة{required && <span className="text-destructive"> *</span>}
          </span>
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
        <select required={required} value={city} onChange={(e) => onChange({ city: e.target.value, university: "" })} className={className}>
          <option value="">اختر المدينة</option>
          {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
        {locError && <span className="mt-1 block text-xs text-destructive">{locError}</span>}
      </label>
      <label className="block text-sm">
        <span className={labelClassName}>الجامعة{required && <span className="text-destructive"> *</span>}</span>
        <select required={required} disabled={!city} value={university} onChange={(e) => onChange({ city, university: e.target.value })} className={className}>
          <option value="">{city ? "اختر الجامعة" : "اختر المدينة أولاً"}</option>
          {uniList.map((u) => <option key={u} value={u}>{u}</option>)}
        </select>
      </label>
    </>
  );
}
