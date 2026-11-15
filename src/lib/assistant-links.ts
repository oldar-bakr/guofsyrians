import type { Root, Link, Text } from "mdast";
import { visit, SKIP } from "unist-util-visit";

export function phoneHref(value: string): string | null {
  const normalized = value.replace(/[٠-٩۰-۹]/g, (digit) => String(digit.charCodeAt(0) - (digit >= "۰" ? 0x6f0 : 0x660)));
  const digits = normalized.replace(/\D/g, "");
  if (digits.length < 10 || digits.length > 15) return null;
  return `tel:${normalized.trim().startsWith("+") ? "+" : ""}${digits}`;
}

export function remarkPhoneLinks() {
  return (tree: Root) => {
    visit(tree, (node, index, parent) => {
      if (node.type === "link" || node.type === "linkReference" || node.type === "code" || node.type === "inlineCode") return SKIP;
      if (node.type !== "text" || !parent || index === undefined) return;
      const expression = /(?<![\p{L}\p{N}])\+?[0-9٠-٩۰-۹](?:[0-9٠-٩۰-۹ ()-]*[0-9٠-٩۰-۹])?(?![\p{L}\p{N}])/gu;
      const parts: (Text | Link)[] = [];
      let last = 0;
      for (const match of node.value.matchAll(expression)) {
        const href = phoneHref(match[0]);
        if (!href) continue;
        if (match.index > last) parts.push({ type: "text", value: node.value.slice(last, match.index) });
        parts.push({ type: "link", url: href, children: [{ type: "text", value: match[0] }] });
        last = match.index + match[0].length;
      }
      if (!parts.length) return;
      if (last < node.value.length) parts.push({ type: "text", value: node.value.slice(last) });
      parent.children.splice(index, 1, ...parts);
      return index + parts.length;
    });
  };
}

export function safeAssistantUrl(url: string): string {
  const value = url.trim();
  if (/^(https?:\/\/|mailto:|tel:)/i.test(value)) return value;
  if (value.startsWith("/") && !value.startsWith("//") && !value.includes("\\")) return value;
  return "";
}