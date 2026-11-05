import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { ShoppingBag, Minus, Plus } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useContent } from "@/lib/content";
import { useMine, useActivityActions } from "@/lib/activity";

export const Route = createFileRoute("/_authenticated/market/")({
  head: () => ({
    meta: [
      { title: "سوق الطالب | تطبيق خدمات الطلاب" },
      { name: "description", content: "منتجات من بائعين معتمدين للطلاب مع سلة وطلبات." },
      { property: "og:title", content: "سوق الطالب" },
      { property: "og:description", content: "تسوّق من بائعين معتمدين." },
    ],
  }),
  component: Market,
});

function Market() {
  const { data: products = [] } = useContent<any>("products");
  const { data: orders = [] } = useMine<any>("orders");
  const actions = useActivityActions("orders");
  const [cart, setCart] = useState<Record<string, number>>({});
  const [note, setNote] = useState("");
  const [done, setDone] = useState(false);

  const items = products.filter((p: any) => cart[p.id]).map((p: any) => ({ product_id: p.id, name: p.name, price: p.price, qty: cart[p.id] }));
  const count = items.reduce((s: number, i: any) => s + i.qty, 0);
  const setQty = (id: string, q: number) => setCart((c) => { const n = { ...c }; if (q <= 0) delete n[id]; else n[id] = q; return n; });

  const order = async () => {
    await actions.add({ items, note });
    setCart({});
    setNote("");
    setDone(true);
  };

  return (
    <AppShell title="السوق">
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
        {products.map((p: any) => (
          <article key={p.id} className="rounded-2xl bg-card p-3 shadow-soft">
            <div className="mb-3 grid aspect-square place-items-center rounded-xl bg-muted text-primary"><ShoppingBag className="h-8 w-8" /></div>
            <h3 className="text-sm font-bold">{p.name}</h3>
            <p className="text-xs text-muted-foreground">{p.seller}</p>
            <div className="mt-2 flex items-center justify-between">
              <span className="font-bold text-primary">{p.price}</span>
              {cart[p.id] ? (
                <div className="flex items-center gap-2">
                  <button aria-label="إنقاص" onClick={() => setQty(p.id, cart[p.id]! - 1)}><Minus className="h-4 w-4" /></button>
                  <span className="text-sm font-bold">{cart[p.id]}</span>
                  <button aria-label="زيادة" onClick={() => setQty(p.id, cart[p.id]! + 1)}><Plus className="h-4 w-4" /></button>
                </div>
              ) : (
                <button onClick={() => { setDone(false); setQty(p.id, 1); }} className="rounded-full bg-accent px-3 py-1 text-xs font-bold text-accent-foreground">أضف</button>
              )}
            </div>
          </article>
        ))}
      </div>

      {count > 0 && (
        <section className="mt-5 rounded-2xl bg-card p-4 shadow-soft">
          <h3 className="mb-2 font-bold">السلة ({count})</h3>
          {items.map((i: any) => <p key={i.product_id} className="text-sm">{i.qty} × {i.name} — {i.price}</p>)}
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="ملاحظات أو عنوان التسليم" className="mt-3 w-full rounded-xl border bg-background px-3 py-2 text-sm" />
          <button onClick={order} className="mt-2 w-full rounded-xl bg-primary py-2 font-bold text-primary-foreground">إرسال الطلب</button>
        </section>
      )}
      {done && <p className="mt-4 rounded-2xl bg-secondary p-3 text-center text-sm">تم إرسال طلبك، وسيتواصل معك البائع قريباً.</p>}

      {orders.length > 0 && (
        <section className="mt-6">
          <h3 className="mb-2 font-display text-lg font-bold">طلباتي</h3>
          <div className="space-y-2">
            {orders.map((o: any) => (
              <div key={o.id} className="rounded-2xl bg-card p-3 text-sm shadow-soft">
                <div className="flex justify-between"><span className="font-bold">{new Date(o.created_at).toLocaleDateString("ar")}</span><span className="rounded-full bg-secondary px-2 text-xs text-primary">{o.status}</span></div>
                <p className="text-muted-foreground">{(o.items as any[]).map((i) => `${i.qty}× ${i.name}`).join("، ")}</p>
              </div>
            ))}
          </div>
        </section>
      )}
    </AppShell>
  );
}
