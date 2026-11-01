import { createFileRoute } from "@tanstack/react-router";
import { Mail, User } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { branches, student } from "@/lib/data";

export const Route = createFileRoute("/union")({
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
  return (
    <AppShell title="دليل الاتحاد">
      <section className="rounded-2xl bg-hero p-5 text-primary-foreground">
        <h2 className="font-display text-xl font-bold">الاتحاد العام لطلبة سوريا</h2>
        <p className="mt-2 text-sm opacity-90">مظلة تجمع الطلاب السوريين وتمثلهم، وتقدم لهم الخدمات والفرص التعليمية والاجتماعية.</p>
      </section>
      <h3 className="mb-3 mt-6 font-display text-lg font-bold">الفروع</h3>
      <div className="space-y-3">
        {branches.map((b) => (
          <article key={b.city} className={`rounded-2xl bg-card p-4 shadow-soft ${b.university === student.university ? "ring-2 ring-accent" : ""}`}>
            {b.university === student.university && <span className="text-xs font-bold text-primary">فرع جامعتك</span>}
            <h4 className="font-bold">فرع {b.city}</h4>
            <p className="text-xs text-muted-foreground">{b.university}</p>
            <p className="mt-2 flex items-center gap-1 text-sm"><User className="h-4 w-4 text-primary" />{b.head}</p>
            <p className="flex items-center gap-1 text-sm"><Mail className="h-4 w-4 text-primary" />{b.contact}</p>
          </article>
        ))}
      </div>
    </AppShell>
  );
}
