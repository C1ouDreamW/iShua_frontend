import katex from "katex";
import { cn } from "@/lib/utils";

type MathRendererProps = {
  text: string | null | undefined;
  className?: string;
  as?: "span" | "p" | "li" | "div" | "h2";
};

const MATH_REGEX = /(\$\$[\s\S]*?\$\$|\$[^$\n\r]+?\$)/g;

function renderMathFragment(latex: string, displayMode: boolean): string {
  const formula = displayMode
    ? latex.slice(2, -2).trim()
    : latex.slice(1, -1).trim();

  if (!formula) return "";

  try {
    return katex.renderToString(formula, {
      displayMode,
      throwOnError: false,
      trust: false,
    });
  } catch {
    return latex;
  }
}

export function MathRenderer({
  text,
  className,
  as: Tag = "span",
}: MathRendererProps) {
  if (!text) {
    return null;
  }

  const parts: Array<{ type: "text" | "html"; content: string }> = [];
  let lastIndex = 0;
  let match: RegExpExecArray | null;

  const regex = new RegExp(MATH_REGEX.source, "g");

  while ((match = regex.exec(text)) !== null) {
    if (match.index > lastIndex) {
      parts.push({ type: "text", content: text.slice(lastIndex, match.index) });
    }

    const isBlock = match[0].startsWith("$$");
    parts.push({
      type: "html",
      content: renderMathFragment(match[0], isBlock),
    });
    lastIndex = match.index + match[0].length;
  }

  if (lastIndex < text.length) {
    parts.push({ type: "text", content: text.slice(lastIndex) });
  }

  if (parts.length === 0) {
    return <Tag className={className}>{text}</Tag>;
  }

  return (
    <Tag className={cn(className)}>
      {parts.map((part, i) =>
        part.type === "html" ? (
          <span key={i} dangerouslySetInnerHTML={{ __html: part.content }} />
        ) : (
          <span key={i}>{part.content}</span>
        ),
      )}
    </Tag>
  );
}
