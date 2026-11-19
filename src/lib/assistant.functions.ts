import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";
import { CONTACT_SUMMARY } from "@/lib/contact";

function lines(rows: any[] | null, fmt: (r: any) => string) {
  return (rows ?? []).map(fmt).join("\n");
}

export const askAssistant = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((d: { question: string; history: { from: "me" | "bot"; text: string }[] }) => {
    const q = String(d.question ?? "").trim().slice(0, 1000);
    if (!q) throw new Error("السؤال فارغ");
    // Only the student's own earlier questions are kept; client-supplied "assistant" turns are never trusted.
    const history = (Array.isArray(d.history) ? d.history : [])
      .filter((m) => m && m.from === "me" && typeof m.text === "string")
      .slice(-4)
      .map((m) => ({ from: "me" as const, text: m.text.trim().slice(0, 1000) }))
      .filter((m) => m.text);
    return { question: q, history };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [faqs, branches, deals, events, courses, news, profile] = await Promise.all([
      supabase.from("faqs").select("question, answer").eq("active", true),
      supabase.from("branches").select("city, university, head, contact").eq("active", true),
      supabase.from("deals").select("partner, category, discount, city, terms").eq("active", true).eq("staff_active", true).eq("status", "approved"),
      supabase.from("events").select("title, date, time, place, org, description").eq("active", true),
      supabase.from("courses").select("title, category, lessons, description").eq("status", "approved").eq("active", true),
      supabase.from("news").select("title, date, body").eq("active", true).order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("full_name, city, university, faculty").eq("id", userId).maybeSingle(),
    ]);

    const knowledge = `
بيانات التواصل الرسمية مع الاتحاد: ${CONTACT_SUMMARY}

معلومات الطالب: ${profile.data ? `${profile.data.full_name}، ${profile.data.university} (${profile.data.faculty})، ${profile.data.city}` : "غير متوفرة"}

الأسئلة والإجابات المعتمدة:
${lines(faqs.data, (r) => `س: ${r.question}\nج: ${r.answer}`)}

الفروع:
${lines(branches.data, (r) => `- ${r.city} / ${r.university}: المسؤول ${r.head}، التواصل ${r.contact}`)}

التخفيضات:
${lines(deals.data, (r) => `- ${r.partner} (${r.category}) خصم ${r.discount} في ${r.city}: ${r.terms}`)}

الفعاليات:
${lines(events.data, (r) => `- ${r.title}: ${r.date} ${r.time} في ${r.place}، تنظيم ${r.org}. ${r.description ?? ""}`)}

الدورات:
${lines(courses.data, (r) => `- ${r.title} (${r.category}، ${r.lessons} درساً). ${r.description ?? ""}`)}

آخر الأخبار:
${lines(news.data, (r) => `- ${r.date}: ${r.title}. ${r.body ?? ""}`)}
`;

    const key = process.env["LOVABLE_API_KEY"];
    if (!key) throw new Error("المساعد غير مهيأ حالياً");

    const { createOpenAI } = await import("@ai-sdk/openai");
    const { streamText } = await import("ai");
    const openai = createOpenAI({
      baseURL: "https://ai.gateway.lovable.dev/v1",
      apiKey: key,
      headers: { "Lovable-API-Key": key, "X-Lovable-AIG-SDK": "vercel-ai-sdk" },
    });

    let answer = "";
    try {
      const result = streamText({
        model: openai.responses("openai/gpt-6-astra"),
        maxRetries: 0,
        system:
          "أنت المساعد الذكي لتطبيق خدمات الاتحاد العام لطلبة سوريا. أجب بالعربية بإيجاز ووضوح، واعتمد فقط على المعلومات المعتمدة التالية. إن لم تجد الإجابة فيها فقل ذلك بلطف واقترح التواصل مع فرع الطالب.\n" +
          knowledge,
        messages: [
          ...data.history.map((m) => ({ role: "user" as const, content: m.text })),
          { role: "user" as const, content: data.question },
        ],
        providerOptions: {
          openai: { forceReasoning: true, reasoningEffort: "low", store: false, include: ["reasoning.encrypted_content"] },
        },
      });
      answer = (await result.text).trim();
    } catch (e: any) {
      console.error("assistant error", e?.statusCode, e?.message);
      const status = e?.statusCode ?? e?.status;
      if (status === 429) throw new Error("المساعد مشغول حالياً، حاول بعد قليل");
      if (status === 402) throw new Error("رصيد المساعد الذكي نفد، يرجى إبلاغ الإدارة");
      throw new Error("تعذّر الحصول على إجابة الآن");
    }
    if (!answer) answer = "عذراً، لم أتمكن من الإجابة على هذا السؤال.";

    await supabase.from("assistant_messages").insert({ user_id: userId, question: data.question, answer });
    return { answer };
  });
