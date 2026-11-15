import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { remarkPhoneLinks, safeAssistantUrl } from "@/lib/assistant-links";

export function AssistantAnswer({ text }: { text: string }) {
  return <div dir="rtl" className="min-w-0 space-y-3 break-words text-sm leading-7 text-foreground [overflow-wrap:anywhere]">
    <ReactMarkdown remarkPlugins={[remarkGfm, remarkPhoneLinks]} urlTransform={safeAssistantUrl} skipHtml components={{
      p: ({ children }) => <p className="whitespace-pre-line">{children}</p>,
      strong: ({ children }) => <strong className="font-bold text-foreground">{children}</strong>,
      h1: ({ children }) => <h3 className="pt-2 font-display text-lg font-bold text-primary">{children}</h3>,
      h2: ({ children }) => <h3 className="pt-2 font-display text-base font-bold text-primary">{children}</h3>,
      h3: ({ children }) => <h4 className="pt-1 text-sm font-bold text-primary">{children}</h4>,
      ul: ({ children }) => <ul className="list-disc space-y-1 ps-5 marker:text-primary">{children}</ul>,
      ol: ({ children }) => <ol className="list-decimal space-y-1 ps-5 marker:font-semibold marker:text-primary">{children}</ol>,
      li: ({ children }) => <li className="ps-1 [&>p]:my-1">{children}</li>,
      blockquote: ({ children }) => <blockquote className="border-s-2 border-primary/30 ps-4 text-muted-foreground">{children}</blockquote>,
      a: ({ href, children }) => {
        if (!href) return <span>{children}</span>;
        const external = /^https?:\/\//i.test(href);
        const contact = /^(tel:|mailto:)/i.test(href);
        return <a href={href} target={external ? "_blank" : undefined} rel={external ? "noopener noreferrer" : undefined} dir={contact ? "ltr" : "auto"} className={`rounded-sm font-medium text-primary underline decoration-primary/35 underline-offset-4 hover:decoration-primary focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring ${contact ? "inline-block" : ""}`}>{children}</a>;
      },
      img: ({ alt }) => <span className="text-muted-foreground">{alt}</span>,
      pre: ({ children }) => <pre dir="ltr" className="overflow-x-auto rounded-lg bg-muted p-3 text-left text-xs">{children}</pre>,
      code: ({ children }) => <code className="rounded bg-muted px-1 py-0.5 text-xs">{children}</code>,
      table: ({ children }) => <div className="max-w-full overflow-x-auto"><table className="w-full border-collapse text-start text-xs">{children}</table></div>,
      th: ({ children }) => <th className="border-b bg-muted px-3 py-2 text-start font-bold">{children}</th>,
      td: ({ children }) => <td className="border-b px-3 py-2 align-top">{children}</td>,
      hr: () => <hr className="my-4 border-border" />,
    }}>{text}</ReactMarkdown>
  </div>;
}