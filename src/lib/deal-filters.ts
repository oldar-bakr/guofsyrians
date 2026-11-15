import { sameCity } from "@/lib/city-match";

type FilterDeal = { business_id: string | null; partner: string; city: string; category: string; discount: string; terms: string };
type FilterShop = { id: string; name: string };
export const dealCompanyKey = (deal: FilterDeal) => deal.business_id ? `business:${deal.business_id}` : `partner:${deal.partner.trim()}`;
const searchKey = (text: string) => text.normalize("NFKD").replace(/[\u0300-\u036f\u064B-\u065F\u0670]/g, "").toLocaleLowerCase().replace(/ı/g, "i").replace(/[أإآ]/g, "ا").replace(/ـ/g, "");
export function filterDeals<T extends FilterDeal>(deals: readonly T[], shops: readonly FilterShop[], { city, company, query }: { city: string; company: string; query: string }): T[] {
  const words = searchKey(query.trim()).split(/\s+/).filter(Boolean);
  return deals.filter((deal) => {
    if (city && !sameCity(deal.city, city)) return false;
    if (company && dealCompanyKey(deal) !== company) return false;
    const text = searchKey([deal.partner, shops.find((s) => s.id === deal.business_id)?.name ?? "", deal.city, deal.category, deal.discount, deal.terms].join(" "));
    return words.every((word) => text.includes(word));
  });
}