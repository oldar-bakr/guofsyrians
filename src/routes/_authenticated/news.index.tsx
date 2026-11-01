import { createFileRoute, Link } from "@tanstack/react-router";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/news/")({
  head: () => ({
    meta: [
      { title: "الأخبار | تطبيق خدمات الطلاب" },
      { name: "description", content: "آخر أخبار وإعلانات الاتحاد العام لطلبة سوريا." },
      { property: "og:title", content: "أخبار الاتحاد" },
      { property: "og:description", content: "آخر أخبار وإعلانات الاتحاد." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewsList,
});

function NewsList() {
  const { data: news = [] } = useContent<any>("news");
  return (
    <AppShell title="الأخبار">
      <ul className="space-y-3">
        {news.map((n: any) => (
          <li key={n.id}>
            <Link to="/news/$id" params={{ id: n.id }} className="block rounded-2xl border-r-4 border-accent bg-card p-4">
              <p className="font-medium">{n.title}</p>
              <p className="mt-1 text-xs text-muted-foreground">{n.date}</p>
              {n.body && <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">{n.body}</p>}
            </Link>
          </li>
        ))}
        {news.length === 0 && <p className="text-center text-sm text-muted-foreground">لا توجد أخبار بعد</p>}
      </ul>
    </AppShell>
  );
}
