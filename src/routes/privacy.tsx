import { createFileRoute } from "@tanstack/react-router";
import { LegalPage } from "@/components/LegalPage";
export const Route = createFileRoute("/privacy")({
  staticData: { sitemap: true },
  head: () => ({ meta: [{ title: "سياسة الخصوصية | اتحاد الطلبة" }, { name: "description", content: "كيفية معالجة بيانات الطلاب والشكاوى وإحصاءات الزيارات في منصة الاتحاد." }, { property: "og:title", content: "سياسة الخصوصية | اتحاد الطلبة" }, { property: "og:description", content: "بيانات الحساب والملفات الخاصة وخيارات التواصل والخصوصية." }, { property: "og:type", content: "website" }, { name: "twitter:card", content: "summary" }] }),
  component: () => <LegalPage kind="privacy" />,
});