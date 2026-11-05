import { createFileRoute } from "@tanstack/react-router";
import { Mail, Phone, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { useStudent } from "@/lib/profile";
import { useContent } from "@/lib/content";

export const Route = createFileRoute("/_authenticated/union")({
  head: () => ({
    meta: [
      { title: "دليل الاتحاد | تطبيق خدمات الطلاب" },
      { name: "description", content: "التعريف بالاتحاد ودليل الفروع والجامعات وبيانات التواصل." },
      { property: "og:title", content: "دليل الاتحاد والفروع" },
      { property: "og:description", content: "الاتحادات الفرعية وبيانات التواصل." },
    ],
  }),
  component: Union,
});

function Union() {
  const student = useStudent();
  const { data: branches = [] } = useContent<any>("branches");
  return (
    <AppShell title="دليل الاتحاد">
      <section className="rounded-2xl bg-hero p-5 text-primary-foreground">
        <h2 className="font-display text-xl font-bold">الاتحاد العام لطلبة سوريا</h2>
        <p className="mt-2 text-sm opacity-90">مظلة تجمع الطلاب السوريين وتمثلهم، وتقدم لهم الخدمات والفرص التعليمية والاجتماعية.</p>
      </section>
      <h3 className="mb-3 mt-6 font-display text-lg font-bold">الفروع</h3>
      <div className="grid gap-3 md:grid-cols-2">
        {branches.map((b) => (
          <article key={b.city} className={`rounded-2xl bg-card p-4 shadow-soft ${b.university === student.university ? "ring-2 ring-accent" : ""}`}>
            {b.university === student.university && <span className="text-xs font-bold text-primary">فرع جامعتك</span>}
            <h4 className="font-bold">فرع {b.city}</h4>
            <p className="text-xs text-muted-foreground">{b.university}</p>
            <p className="mt-2 flex items-center gap-1 text-sm"><User className="h-4 w-4 text-primary" />{b.head}</p>
            {b.contact && <a href={`tel:${b.contact.replace(/\s/g, "")}`} dir="ltr" className="flex items-center gap-1 text-sm text-primary"><Phone className="h-4 w-4" />{b.contact}</a>}
            {b.email && <a href={`mailto:${b.email}`} dir="ltr" className="flex items-center gap-1 text-sm text-primary"><Mail className="h-4 w-4" />{b.email}</a>}
          </article>
        ))}
      </div>
    </AppShell>
  );
}
