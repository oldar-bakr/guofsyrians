import { cities, universitiesByCity } from "@/lib/turkey-universities";

type Props = {
  city: string;
  university: string;
  onChange: (v: { city: string; university: string }) => void;
  className?: string;
  labelClassName?: string;
  required?: boolean;
};

export function CityUniversitySelect({ city, university, onChange, className, labelClassName, required }: Props) {
  const cityList = city && !cities.includes(city) ? [city, ...cities] : cities;
  const base = universitiesByCity[city] ?? [];
  const uniList = university && !base.includes(university) ? [university, ...base] : base;
  return (
    <>
      <label className="block text-sm">
        <span className={labelClassName}>المدينة{required && <span className="text-destructive"> *</span>}</span>
        <select required={required} value={city} onChange={(e) => onChange({ city: e.target.value, university: "" })} className={className}>
          <option value="">اختر المدينة</option>
          {cityList.map((c) => <option key={c} value={c}>{c}</option>)}
        </select>
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
