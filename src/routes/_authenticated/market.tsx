import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/market")({
  head: () => ({
    meta: [
      { title: "سوق الطالب | تطبيق خدمات الطلاب" },
      { name: "description", content: "منتجات من بائعين معتمدين للطلاب." },
      { property: "og:title", content: "سوق الطالب" },
      { property: "og:description", content: "تسوّق من بائعين معتمدين." },
    ],
  }),
  component: Market,
});

function Market() {
  const { data: products = [] } = useContent<any>("products");
  const [cart, setCart] = useState(0);
  return (
    <AppShell title="السوق">
      <div className="mb-4 flex items-center justify-between rounded-2xl bg-secondary p-3 text-sm">
        <span>السلة</span>
        <span className="flex items-center gap-1 font-bold text-primary"><ShoppingBag className="h-4 w-4" />{cart} منتجات</span>
      </div>
      <div className="grid grid-cols-2 gap-3">
        {products.map((p) => (
          <article key={p.name} className="rounded-2xl bg-card p-3 shadow-soft">
            <div className="mb-3 grid aspect-square place-items-center rounded-xl bg-muted text-primary"><ShoppingBag className="h-8 w-8" /></div>
            <h3 className="text-sm font-bold">{p.name}</h3>
            <p className="text-xs text-muted-foreground">{p.seller}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-primary">{p.price}</span>
              <button onClick={() => setCart(cart + 1)} className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">أضف</button>
            </div>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
