import { Link } from "@tanstack/react-router";
import type { ReactNode } from "react";
import { Home, IdCard, GraduationCap, Tag, Sparkles } from "lucide-react";
import logo from "@/assets/union-logo.png.asset.json";

const tabs = [
  { to: "/", label: "الرئيسية", icon: Home },
  { to: "/courses", label: "الدورات", icon: GraduationCap },
  { to: "/card", label: "بطاقتي", icon: IdCard },
  { to: "/deals", label: "التخفيضات", icon: Tag },
  { to: "/assistant", label: "المساعد", icon: Sparkles },
] as const;

export function AppShell({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="min-h-screen bg-muted md:py-8">
      <div className="relative mx-auto flex min-h-screen max-w-md flex-col bg-background md:min-h-[850px] md:overflow-hidden md:rounded-[2.5rem] md:border-8 md:border-foreground md:shadow-soft">
        <header className="sticky top-0 z-10 flex items-center justify-between border-b bg-background/90 px-5 py-3 backdrop-blur">
          <Link to="/" className="flex items-center gap-2">
            <img src={logo.url} alt="شعار الاتحاد" className="h-9 w-9 object-contain" />
            <span className="font-display text-sm font-bold text-primary">اتحاد الطلبة</span>
          </Link>
          <div className="flex items-center gap-3">
            {title && <h1 className="font-display text-lg font-bold">{title}</h1>}
            <Link to="/admin" className="rounded-full bg-secondary px-3 py-1 text-xs font-bold text-primary">الإدارة</Link>
          </div>
        </header>
        <main className="flex-1 px-5 pb-28 pt-5">{children}</main>
        <nav className="fixed inset-x-0 bottom-0 z-10 mx-auto grid max-w-md grid-cols-5 border-t bg-card md:absolute">
          {tabs.map(({ to, label, icon: Icon }) => (
            <Link
              key={to}
              to={to}
              activeOptions={{ exact: true }}
              className="flex flex-col items-center gap-1 py-3 text-xs text-muted-foreground data-[status=active]:text-primary data-[status=active]:font-bold"
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          ))}
        </nav>
      </div>
    </div>
  );
}
