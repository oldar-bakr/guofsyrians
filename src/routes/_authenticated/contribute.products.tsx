import { createFileRoute } from "@tanstack/react-router";
import { ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContributeForm } from "@/components/ContributeForm";

export const Route = createFileRoute("/_authenticated/contribute/products")({
  staticData: { sitemap: false },
  head: () => ({
    meta: [
      { title: "قدّم منتجاتك | تطبيق خدمات الطلاب" },
      { name: "description", content: "اعرض منتجك في سوق الطلاب — يُنشر بعد موافقة الإدارة." },
      { property: "og:title", content: "قدّم منتجاتك" },
      { property: "og:description", content: "اعرض منتجاتك لطلاب الاتحاد في السوق." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContributeProducts,
});

function ContributeProducts() {
  return (
    <AppShell title="قدّم منتجاتك">
      <div className="mb-4 flex items-center gap-3 rounded-3xl bg-primary p-4 text-primary-foreground shadow-soft">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-foreground/15">
          <ShoppingBag className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold">قدّم منتجاتك</h2>
          <p className="text-sm opacity-80">اعرض منتجك في سوق الطلاب — يُنشر بعد موافقة الإدارة.</p>
        </div>
      </div>
      <ContributeForm kind="products" />
    </AppShell>
  );
}
