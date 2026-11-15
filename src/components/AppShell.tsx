import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, IdCard, GraduationCap, Tag, Landmark } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { UniversityLogo } from "@/components/UniversityLogo";
import { Button } from "@/components/ui/button";
import { useIsStaff, useStudent } from "@/lib/profile";
import logo from "@/assets/union-logo.png.asset.json";

const tabs = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/courses", label: "الدورات", icon: GraduationCap },
  { to: "/card", label: "بطاقتي", icon: IdCard },
  { to: "/deals", label: "التخفيضات", icon: Tag },
  { to: "/assistant", label: "المساعد", icon: Home },
] as const;

// Mobile floating bar: deals replaces courses, union guide replaces deals.
const mobileTabs = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/deals", label: "التخفيضات", icon: Tag },
  { to: "/card", label: "بطاقتي", icon: IdCard },
  { to: "/union", label: "دليل الاتحاد", icon: Landmark },
  { to: "/assistant", label: "المساعد", icon: Home },
] as const;

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const student = useStudent();
  const isStaff = useIsStaff();
  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/home" className="flex min-w-0 items-center gap-2 md:shrink-0">
            <img src={logo.url} alt="شعار الاتحاد" className="h-9 w-9 shrink-0 object-contain" />
            <span className="hidden font-display text-sm font-bold text-primary md:inline">اتحاد الطلبة</span>
            <span className="min-w-0 break-words font-display text-lg font-bold leading-7 text-primary md:hidden">{title || "اتحاد الطلبة"}</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary data-[status=active]:bg-secondary data-[status=active]:font-bold data-[status=active]:text-primary"
              >
                {to === "/assistant" ? <img src={logo.url} alt="" className="h-5 w-5 shrink-0 object-contain" /> : <Icon className="h-4 w-4" />}
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            {isStaff && <Link to="/admin" className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">الإدارة</Link>}
            <Link to="/profile" aria-label="ملفي الشخصي" title="ملفي الشخصي" className="relative shrink-0">
              <Avatar path={student.avatar} name={student.name} className="h-10 w-10" textClass="text-xs" />
              <UniversityLogo university={student.university} className="absolute -bottom-1 -left-1 h-5 w-5" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-10">{children}</main>
      <nav aria-label="التنقل الرئيسي للهاتف" className="fixed inset-x-3 bottom-[max(12px,env(safe-area-inset-bottom))] z-20 mx-auto grid max-w-md grid-cols-5 gap-1 rounded-full border bg-card/95 px-2 py-2 shadow-soft backdrop-blur-md md:hidden">
        {mobileTabs.map(({ to, label, icon: Icon }) => (
          <Button asChild variant="ghost" key={to} className="group h-14 min-w-0 flex-col gap-1 rounded-full px-0 py-1 text-[10px] text-muted-foreground hover:bg-secondary hover:text-primary data-[status=active]:bg-secondary data-[status=active]:font-bold data-[status=active]:text-primary">
          <Link
            to={to}
            activeOptions={{ exact: true }}
          >
            {to === "/assistant" ? <img src={logo.url} alt="" className="h-5 w-5 shrink-0 object-contain" /> : <Icon className="size-5!" />}
            {label}
          </Link>
          </Button>
        ))}
      </nav>
    </div>
  );
}
