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
    return { question: q, history: (d.history ?? []).slice(-8) };
  })
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const [faqs, branches, deals, events, courses, news, profile] = await Promise.all([
      supabase.from("faqs").select("question, answer"),
      supabase.from("branches").select("city, university, head, contact"),
      supabase.from("deals").select("partner, category, discount, city, terms"),
      supabase.from("events").select("title, date, time, place, org, description"),
      supabase.from("courses").select("title, category, lessons, description"),
      supabase.from("news").select("title, date, body").order("created_at", { ascending: false }).limit(10),
      supabase.from("profiles").select("full_name, city, university, faculty").eq("id", userId).maybeSingle(),
    ]);

    const knowledge = `
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
          ...data.history.map((m) => ({ role: m.from === "me" ? ("user" as const) : ("assistant" as const), content: m.text })),
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
