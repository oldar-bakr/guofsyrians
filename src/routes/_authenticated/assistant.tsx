import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { Send } from "lucide-react";
import { AppShell } from "@/components/AppShell";

export const Route = createFileRoute("/_authenticated/assistant")({
  head: () => ({
    meta: [
      { title: "المساعد الذكي | تطبيق خدمات الطلاب" },
      { name: "description", content: "مساعد ذكي يجيب عن أسئلة الطلاب حول الدراسة والخدمات والاتحاد." },
      { property: "og:title", content: "المساعد الذكي للطالب" },
      { property: "og:description", content: "اسأل عن الدراسة والخدمات." },
    ],
  }),
  component: Assistant,
});

type Msg = { from: "me" | "bot"; text: string };
const suggestions = ["كيف أجدد اشتراكي؟", "ما التخفيضات في إسطنبول؟", "كيف أتواصل مع فرع جامعتي؟"];

function Assistant() {
  const [msgs, setMsgs] = useState<Msg[]>([{ from: "bot", text: "أهلاً! أنا مساعدك الذكي. كيف أستطيع مساعدتك اليوم؟" }]);
  const [text, setText] = useState("");
  const send = (q: string) => {
    if (!q.trim()) return;
    setMsgs((m) => [...m, { from: "me", text: q }, { from: "bot", text: "هذا نموذج أولي — في النسخة النهائية سأجيبك اعتماداً على معلومات الاتحاد المعتمدة والمحدثة." }]);
    setText("");
  };
  return (
    <AppShell title="المساعد الذكي">
      <div className="space-y-3">
        {msgs.map((m, i) => (
          <div key={i} className={`max-w-[85%] rounded-2xl p-3 text-sm ${m.from === "me" ? "mr-auto bg-primary text-primary-foreground" : "bg-card shadow-soft"}`}>{m.text}</div>
        ))}
      </div>
      <div className="mt-4 flex flex-wrap gap-2">
        {suggestions.map((s) => (
          <button key={s} onClick={() => send(s)} className="rounded-full border border-primary px-3 py-1 text-xs text-primary">{s}</button>
        ))}
      </div>
      <form onSubmit={(e) => { e.preventDefault(); send(text); }} className="mt-4 flex gap-2">
        <input value={text} onChange={(e) => setText(e.target.value)} placeholder="اكتب سؤالك..." className="flex-1 rounded-full border bg-card px-4 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" />
        <button aria-label="إرسال" className="grid h-10 w-10 place-items-center rounded-full bg-primary text-primary-foreground"><Send className="h-4 w-4 -scale-x-100" /></button>
      </form>
    </AppShell>
  );
}
