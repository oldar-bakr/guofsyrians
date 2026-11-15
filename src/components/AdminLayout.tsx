import { Link } from "@tanstack/react-router";
import { useState, type ReactNode } from "react";
import { Newspaper, CalendarDays, GraduationCap, Award, Tag, ShoppingBag, Building2, BookOpen, UsersRound, Activity, MessageSquare, Store, PanelRightClose, PanelRightOpen, Menu, ArrowUpLeft, LogOut, ChevronLeft, type LucideIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle } from "@/components/ui/sheet";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { sections, type ContentTable } from "@/lib/content";
import logo from "@/assets/union-logo.png.asset.json";

export type AdminSection = ContentTable | "complaints" | "activity" | "businesses" | "users";
export const adminSectionKeys = [...Object.keys(sections), "complaints", "activity", "businesses", "users"];
const groups: { label: string; items: { key: AdminSection; label: string; icon: LucideIcon }[] }[] = [
  { label: "المحتوى والخدمات", items: [
    { key: "news", label: sections.news.label, icon: Newspaper },
    { key: "events", label: sections.events.label, icon: CalendarDays },
    { key: "scholarships", label: sections.scholarships.label, icon: Award },
    { key: "courses", label: sections.courses.label, icon: GraduationCap },
    { key: "deals", label: sections.deals.label, icon: Tag },
    { key: "products", label: sections.products.label, icon: ShoppingBag },
    { key: "branches", label: sections.branches.label, icon: Building2 },
    { key: "faqs", label: sections.faqs.label, icon: BookOpen },
  ] },
  { label: "المتابعة والإدارة", items: [
    { key: "businesses", label: "المتاجر والعروض", icon: Store },
    { key: "activity", label: "نشاط الطلاب", icon: Activity },
    { key: "complaints", label: "الشكاوى والملاحظات", icon: MessageSquare },
    { key: "users", label: "المستخدمون والصلاحيات", icon: UsersRound },
  ] },
];

export function AdminLayout({ section, role, email, onSignOut, children }: { section: AdminSection; role: "admin" | "editor"; email: string; onSignOut: () => void; children: ReactNode }) {
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const active = groups.flatMap(g => g.items).find(item => item.key === section);
  function navigation(mini: boolean) {
    return <nav aria-label="أقسام الإدارة" className="min-h-0 flex-1 overflow-y-auto px-3 py-3">
      {groups.map(group => <div key={group.label} className="mb-5">
        {!mini && <p className="mb-2 px-3 text-[11px] font-bold text-muted-foreground">{group.label}</p>}
        <div className="space-y-1">{group.items.filter(item => role === "admin" || item.key !== "users").map(item => {
          const selected = item.key === section;
          const link = <Button asChild variant="ghost" className={`h-11 w-full rounded-lg ${mini ? "justify-center px-0" : "justify-start px-3"} ${selected ? "bg-secondary font-bold text-primary hover:bg-secondary" : "text-muted-foreground hover:text-foreground"}`}><Link to="/admin" search={{ section: item.key }} aria-label={item.label} aria-current={selected ? "page" : undefined} onClick={() => setMobileOpen(false)}><item.icon className="size-5! shrink-0" />{!mini && <><span className="min-w-0 whitespace-normal text-start leading-5">{item.label}</span>{selected && <ChevronLeft className="ms-auto size-3.5! shrink-0" />}</>}</Link></Button>;
          return mini ? <Tooltip key={item.key}><TooltipTrigger asChild>{link}</TooltipTrigger><TooltipContent side="left">{item.label}</TooltipContent></Tooltip> : <div key={item.key}>{link}</div>;
        })}</div>
      </div>)}
    </nav>;
  }
  function brand(mini: boolean) {
    return <div className={`flex h-20 shrink-0 items-center gap-3 border-b ${mini ? "justify-center px-2" : "px-5"}`}><img src={logo.url} alt="شعار الاتحاد" className="h-10 w-10 shrink-0 object-contain" />{!mini && <div><p className="font-display text-base font-bold text-primary">اتحاد الطلبة</p><p className="mt-1 text-xs text-muted-foreground">لوحة الإدارة</p></div>}</div>;
  }
  function account(mini: boolean) {
    return <div className="shrink-0 border-t p-3">{!mini && <div className="mb-3 px-2"><p className="text-xs font-bold">{role === "admin" ? "مدير المنصة" : "محرر المحتوى"}</p><p dir="ltr" className="mt-1 truncate text-start text-xs text-muted-foreground" title={email}>{email}</p></div>}<Button onClick={onSignOut} variant="ghost" title="تسجيل الخروج" aria-label="تسجيل الخروج" className={`h-10 w-full text-muted-foreground hover:text-destructive ${mini ? "px-0" : "justify-start"}`}><LogOut />{!mini && "تسجيل الخروج"}</Button></div>;
  }
  return <TooltipProvider delayDuration={100}><div dir="rtl" className="flex min-h-screen w-full bg-muted">
    <aside aria-label="القائمة الجانبية" className={`sticky top-0 hidden h-svh shrink-0 flex-col border-e bg-card md:flex ${collapsed ? "w-20" : "w-64"}`}>{brand(collapsed)}{navigation(collapsed)}{account(collapsed)}</aside>
    <Sheet open={mobileOpen} onOpenChange={setMobileOpen}><SheetContent side="right" dir="rtl" className="flex w-72 max-w-[88vw] flex-col gap-0 bg-card p-0 [&>button]:left-4 [&>button]:right-auto"><SheetHeader className="sr-only"><SheetTitle>قائمة الإدارة</SheetTitle></SheetHeader>{brand(false)}{navigation(false)}{account(false)}</SheetContent></Sheet>
    <div className="min-w-0 flex-1">
      <header className="sticky top-0 z-20 flex h-20 items-center justify-between gap-3 border-b bg-card/95 px-4 backdrop-blur md:px-7">
        <div className="flex min-w-0 items-center gap-3"><Button variant="ghost" size="icon" aria-label="فتح قائمة الإدارة" className="md:hidden" onClick={() => setMobileOpen(true)}><Menu /></Button><Button variant="ghost" size="icon" aria-label={collapsed ? "توسيع القائمة" : "طي القائمة"} title={collapsed ? "توسيع القائمة" : "طي القائمة"} className="hidden md:inline-flex" onClick={() => setCollapsed(!collapsed)}>{collapsed ? <PanelRightOpen /> : <PanelRightClose />}</Button><div className="min-w-0"><p className="hidden text-xs text-muted-foreground sm:block">لوحة الإدارة</p><h1 className="break-words font-display text-base font-bold leading-6 sm:text-lg">{active?.label}</h1></div></div>
        <Button asChild variant="outline" className="shrink-0 max-sm:px-2"><Link to="/home" aria-label="عرض التطبيق"><span className="hidden sm:inline">عرض التطبيق</span><ArrowUpLeft /></Link></Button>
      </header>
      <main className="mx-auto min-w-0 max-w-7xl p-4 md:p-7 lg:p-9">{children}</main>
    </div>
  </div></TooltipProvider>;
}