import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useItem } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/news/$id")({
  head: () => ({
    meta: [
      { title: "الخبر | تطبيق خدمات الطلاب" },
      { name: "description", content: "تفاصيل الخبر من الاتحاد العام لطلبة سوريا." },
      { property: "og:title", content: "خبر من الاتحاد" },
      { property: "og:description", content: "تفاصيل الخبر من الاتحاد." },
      { property: "og:type", content: "article" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: NewsDetail,
});

function NewsDetail() {
  const { id } = Route.useParams();
  const { data: n, isLoading } = useItem<any>("news", id);
  return (
    <AppShell title="الخبر">
      <Link to="/news" className="mb-3 inline-flex items-center gap-1 text-sm text-primary"><ArrowRight className="h-4 w-4" />كل الأخبار</Link>
      {isLoading ? (
        <p className="text-center text-sm text-muted-foreground">جارٍ التحميل…</p>
      ) : !n ? (
        <p className="text-center">الخبر غير موجود</p>
      ) : (
        <article className="rounded-2xl bg-card p-5 shadow-soft">
          <p className="text-xs text-muted-foreground">{n.date}</p>
          <h2 className="mt-1 font-display text-2xl font-bold">{n.title}</h2>
          <p className="mt-4 whitespace-pre-wrap leading-7">{n.body || "لا توجد تفاصيل إضافية."}</p>
        </article>
      )}
    </AppShell>
  );
}
