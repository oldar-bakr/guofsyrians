import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, IdCard, GraduationCap, Tag, Sparkles } from "lucide-react";
import { Avatar } from "@/components/Avatar";
import { useStudent } from "@/lib/profile";
import logo from "@/assets/union-logo.png.asset.json";

const tabs = [
  { to: "/home", label: "الرئيسية", icon: Home },
  { to: "/courses", label: "الدورات", icon: GraduationCap },
  { to: "/card", label: "بطاقتي", icon: IdCard },
  { to: "/deals", label: "التخفيضات", icon: Tag },
  { to: "/assistant", label: "المساعد", icon: Sparkles },
] as const;

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  const student = useStudent();
  return (
    <div className="min-h-screen bg-muted">
      <header className="sticky top-0 z-20 border-b bg-background/90 backdrop-blur">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-3 px-4 py-3 md:px-6">
          <Link to="/home" className="flex shrink-0 items-center gap-2">
            <img src={logo.url} alt="شعار الاتحاد" className="h-9 w-9 object-contain" />
            <span className="font-display text-sm font-bold text-primary">اتحاد الطلبة</span>
          </Link>
          <nav className="hidden items-center gap-1 md:flex">
            {tabs.map(({ to, label, icon: Icon }) => (
              <Link
                key={to}
                to={to}
                activeOptions={{ exact: true }}
                className="flex items-center gap-1.5 rounded-full px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-secondary data-[status=active]:bg-secondary data-[status=active]:font-bold data-[status=active]:text-primary"
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            ))}
          </nav>
          <div className="flex shrink-0 items-center gap-3">
            {title && <h1 className="font-display text-lg font-bold md:hidden">{title}</h1>}
            <Link to="/admin" className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">الإدارة</Link>
            <Link to="/profile" aria-label="ملفي الشخصي" title="ملفي الشخصي" className="shrink-0">
              <Avatar path={student.avatar} name={student.name} className="h-8 w-8" textClass="text-xs" />
            </Link>
          </div>
        </div>
      </header>
      <main className="mx-auto w-full max-w-5xl flex-1 px-4 pb-28 pt-5 md:px-6 md:pb-10">{children}</main>
      <nav className="fixed inset-x-0 bottom-0 z-20 grid grid-cols-5 border-t bg-card md:hidden">
        {tabs.map(({ to, label, icon: Icon }) => (
          <Link
            key={to}
            to={to}
            activeOptions={{ exact: true }}
            className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground data-[status=active]:font-bold data-[status=active]:text-primary"
          >
            <Icon className="h-5 w-5" />
            {label}
          </Link>
        ))}
      </nav>
    </div>
  );
}
