// Deals may store city names in Arabic while profiles use Turkish province names.
const arabic: Record<string, string> = {
  "إسطنبول": "istanbul", "اسطنبول": "istanbul", "أنقرة": "ankara", "انقرة": "ankara", "إزمير": "izmir", "ازمير": "izmir",
  "غازي عنتاب": "gaziantep", "بورصة": "bursa", "قونية": "konya", "أنطاليا": "antalya", "انطاليا": "antalya", "مرسين": "mersin",
  "أضنة": "adana", "اضنة": "adana", "هاتاي": "hatay", "كيليس": "kilis", "شانلي أورفا": "sanliurfa", "أورفا": "sanliurfa",
  "طرابزون": "trabzon", "قيصري": "kayseri", "سكاريا": "sakarya", "كوجالي": "kocaeli", "إسكي شهير": "eskisehir", "ماردين": "mardin",
  "ملاطيا": "malatya", "سامسون": "samsun", "ديار بكر": "diyarbakir", "كهرمان مرعش": "kahramanmaras", "مرعش": "kahramanmaras",
};
export function cityKey(name: string): string {
  const s = name.trim();
  if (arabic[s]) return arabic[s];
  return s.toLocaleLowerCase("tr").replace(/ı/g, "i").normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z]/g, "");
}
export const sameCity = (a: string, b: string) => !!a && !!b && cityKey(a) === cityKey(b);
