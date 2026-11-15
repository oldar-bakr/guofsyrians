import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowRight, Loader2, Mail, Phone, ShoppingBag, UserRound } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContentImages } from "@/components/ContentImages";
import { Button } from "@/components/ui/button";
import { useItem } from "@/lib/content";
import { productContacts } from "@/lib/product-contact";
import type { Database } from "@/integrations/supabase/types";

export const Route = createFileRoute("/_authenticated/market/$id")({
  staticData: { sitemap: false },
  head: () => ({ meta: [
    { title: "تفاصيل المنتج | سوق الاتحاد العام لطلبة سوريا" },
    { name: "description", content: "صور المنتج وتفاصيله وسعره ووسائل التواصل المنشورة من البائع." },
    { property: "og:title", content: "تفاصيل المنتج | سوق الاتحاد" },
    { property: "og:description", content: "تعرّف على المنتج وتواصل مع البائع عبر بيانات التواصل المنشورة." },
    { property: "og:type", content: "website" },
    { name: "twitter:card", content: "summary" },
  ] }),
  component: ProductPage,
});

function ProductPage() {
  const { id } = Route.useParams();
  const { data: product, isLoading, isError, refetch } = useItem<Database["public"]["Tables"]["products"]["Row"]>("products", id);
  const contacts = productContacts(product?.contact ?? "");
  return <AppShell title="المنتج">
    <Button asChild variant="link" className="mb-4 px-0"><Link to="/market"><ArrowRight />سوق الطالب</Link></Button>
    {isLoading ? <div role="status" className="flex min-h-48 items-center justify-center gap-2 text-muted-foreground"><Loader2 className="h-5 w-5 animate-spin" />جارٍ تحميل المنتج…</div> : isError ? <div className="py-12 text-center"><p role="alert" className="mb-3 text-destructive">تعذّر تحميل المنتج</p><Button variant="outline" onClick={() => refetch()}>إعادة المحاولة</Button></div> : !product || product.status !== "approved" ? <p className="py-12 text-center text-muted-foreground">المنتج غير متاح</p> : <article className="grid min-w-0 gap-6 lg:grid-cols-2 lg:gap-8">
      <div className="min-w-0">{product.images.length ? <ContentImages paths={product.images} title={product.name} /> : <div className="grid aspect-square place-items-center rounded-lg bg-secondary"><ShoppingBag className="h-16 w-16 text-primary" /></div>}</div>
      <div className="min-w-0">
        <h1 className="break-words font-display text-2xl font-bold sm:text-3xl">{product.name}</h1>
        <p className="mt-3 break-words font-display text-2xl font-bold text-primary">{product.price}</p>
        {product.description && <section className="mt-6 border-t pt-5"><h2 className="mb-2 font-bold">تفاصيل المنتج</h2><p className="whitespace-pre-wrap break-words text-sm leading-7 text-muted-foreground">{product.description}</p></section>}
        <section className="mt-6 border-t pt-5" aria-label="التواصل مع البائع">
          <h2 className="mb-3 flex items-center gap-2 font-bold"><UserRound className="h-4 w-4 text-primary" />التواصل مع البائع</h2>
          <p className="mb-4 break-words text-sm">{product.seller}</p>
          <div className="flex flex-col gap-2">
            {contacts.phones.map((phone) => <Button asChild variant="outline" key={phone.href} className="h-auto min-h-11 justify-start whitespace-normal py-3"><a href={phone.href}><Phone className="h-4 w-4 shrink-0" /><span dir="ltr" className="min-w-0 break-all">{phone.label}</span></a></Button>)}
            {contacts.emails.map((email) => <Button asChild variant="outline" key={email} className="h-auto min-h-11 justify-start whitespace-normal py-3"><a href={`mailto:${email}`}><Mail className="h-4 w-4 shrink-0" /><span dir="ltr" className="min-w-0 break-all">{email}</span></a></Button>)}
          </div>
          {!contacts.phones.length && !contacts.emails.length && <p className="whitespace-pre-wrap break-words text-sm text-muted-foreground">{product.contact || "لم ينشر البائع بيانات تواصل بعد."}</p>}
        </section>
      </div>
    </article>}
  </AppShell>;
}