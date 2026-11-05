import { createFileRoute } from "@tanstack/react-router";
import { GraduationCap } from "lucide-react";
import { AppShell } from "@/components/AppShell";
import { ContributeForm } from "@/components/ContributeForm";

export const Route = createFileRoute("/_authenticated/contribute/courses")({
  head: () => ({
    meta: [
      { title: "قدّم دوراتك | تطبيق خدمات الطلاب" },
      { name: "description", content: "علّم زملاءك مهارة: أرسل دورتك التدريبية وتُنشر بعد موافقة الإدارة." },
      { property: "og:title", content: "قدّم دوراتك" },
      { property: "og:description", content: "شارك مهاراتك مع طلاب الاتحاد عبر دورة تدريبية." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: ContributeCourses,
});

function ContributeCourses() {
  return (
    <AppShell title="قدّم دوراتك">
      <div className="mb-4 flex items-center gap-3 rounded-3xl bg-primary p-4 text-primary-foreground shadow-soft">
        <span className="grid h-11 w-11 shrink-0 place-items-center rounded-full bg-primary-foreground/15">
          <GraduationCap className="h-6 w-6" />
        </span>
        <div>
          <h2 className="font-display text-xl font-bold">قدّم دوراتك</h2>
          <p className="text-sm opacity-80">علّم زملاءك مهارة — تُنشر دورتك بعد موافقة الإدارة.</p>
        </div>
      </div>
      <ContributeForm kind="courses" />
    </AppShell>
  );
}
