import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
export const Route = createFileRoute("/terms")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "الشروط والأحكام | اتحاد الطلبة" }, { name: "description", content: "شروط استخدام خدمات الاتحاد والعضوية والمحتوى والشكاوى." }, { property: "og:title", content: "الشروط والأحكام | اتحاد الطلبة" }, { property: "og:description", content: "حقوق ومسؤوليات المستخدم عند استخدام منصة اتحاد الطلبة." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <LegalPage kind="terms" />,
});