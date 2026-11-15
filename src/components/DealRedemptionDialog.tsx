import QRCode from "react-qr-code";
import { BusinessLogo } from "@/lib/business";
import { useStudent } from "@/lib/profile";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";

export type RedemptionDeal = { id: string; partner: string; discount: string; terms: string };
export function DealRedemptionDialog({ deal, logoPath, onClose }: { deal: RedemptionDeal | null; logoPath?: string | null | undefined; onClose: () => void }) {
  const student = useStudent();
  return <Dialog open={Boolean(deal)} onOpenChange={(open) => { if (!open) onClose(); }}>
    {deal && <DialogContent dir="rtl" className="max-w-sm rounded-lg">
      <div className="mx-auto"><BusinessLogo path={logoPath} name={deal.partner} className="h-20 w-20" /></div>
      <DialogHeader><DialogTitle className="break-words font-display text-xl">{deal.partner}</DialogTitle><DialogDescription className="break-words">خصم {deal.discount} · {deal.terms}</DialogDescription></DialogHeader>
      <div className="mx-auto my-2 w-fit rounded-lg bg-card p-3"><QRCode value={`guss:${student.id}:deal:${deal.id}`} size={170} fgColor="var(--primary)" /></div>
      <p className="break-words text-center text-sm">{student.name} · {student.id}</p>
      <p className="text-center text-xs text-muted-foreground">اعرض هذا الرمز على الشريك قبل الدفع</p>
    </DialogContent>}
  </Dialog>;
}