import type { ReactNode } from "react";

type MarkdownContentProps = {
  value: string | null;
  className?: string;
  compact?: boolean;
};

type MarkdownBlock =
  | { type: "heading"; depth: number; text: string }
  | { type: "paragraph"; text: string }
  | { type: "definition"; label: string; body: string }
  | { type: "unordered-list"; items: string[] }
  | { type: "ordered-list"; items: string[] };

const headingTailStarters = [
  "Perangkat",
  "Selain",
  "Pada",
  "Secara",
  "Berbeda",
  "Setelah",
  "Seringkali",
  "Dalam",
  "Saat",
  "Mayoritas",
  "Meskipun",
  "Dunia",
  "Ini",
  "Ia",
  "Mereka",
  "Aplikasi",
  "Bayangkan",
];

function normalizeMarkdown(value: string) {
  return removeAwkwardOpening(value)
    .replace(/\r\n/g, "\n")
    .replace(/\u00a0/g, " ")
    .replace(/([^\n])\s*(#{1,4}\s+)/g, "$1\n\n$2")
    .replace(/\n+\s*\*\*(?=[\s.,;:!?a-z])/g, "**")
    .replace(/\*\*\s*\n+\s*(?=[.,;:!?])/g, "**")
    .replace(/([.!?])(?=[^\s\d])/g, "$1 ")
    .replace(/[ \t]+/g, " ")
    .replace(/\n{3,}/g, "\n\n")
    .trim();
}

function removeAwkwardOpening(value: string) {
  const paragraphs = value.trim().split(/\n\s*\n/);
  const firstParagraph = paragraphs[0]?.trim() ?? "";
  const startsWithAwkwardOpening =
    /^(halo|hai|selamat datang|untuk mengawali|mari kita|pernahkah)/i.test(firstParagraph);

  if (startsWithAwkwardOpening && paragraphs.length > 1) {
    return paragraphs.slice(1).join("\n\n").trim();
  }

  return value.trim();
}

function joinTextLine(current: string, next: string) {
  return `${current.trim()} ${next.trim()}`
    .replace(/\s+([.,;:!?])/g, "$1")
    .replace(/\s{2,}/g, " ")
    .trim();
}

function isHeadingLine(line: string) {
  return /^(#{1,4})\s+(.+)$/.test(line);
}

function isUnorderedListLine(line: string) {
  return /^[-*\u2022]\s+(.+)$/.test(line);
}

function isOrderedListLine(line: string) {
  return /^\d+[.)]\s+(.+)$/.test(line);
}

function isDefinitionLine(line: string) {
  return /^\*\*([^*]+?):\*\*\s*(.+)$/.test(line) || /^\*\*([^*]+?)\*\*:\s*(.+)$/.test(line);
}

function splitHeadingTail(text: string) {
  for (const starter of headingTailStarters) {
    const index = text.indexOf(starter, 10);
    if (index <= 0) continue;

    const previous = text[index - 1];
    if (previous && !/\s/.test(previous)) {
      return {
        heading: text.slice(0, index).trim(),
        tail: text.slice(index).trim(),
      };
    }
  }

  return { heading: text.trim(), tail: "" };
}

function parseMarkdown(value: string) {
  const lines = normalizeMarkdown(value).split("\n");
  const blocks: MarkdownBlock[] = [];
  let pendingList: { type: "unordered-list" | "ordered-list"; items: string[] } | null = null;
  let pendingParagraph: string[] = [];

  const flushList = () => {
    if (!pendingList) return;
    blocks.push(pendingList);
    pendingList = null;
  };

  const flushParagraph = () => {
    if (!pendingParagraph.length) return;
    blocks.push({ type: "paragraph", text: pendingParagraph.reduce(joinTextLine) });
    pendingParagraph = [];
  };

  const addListItem = (type: "unordered-list" | "ordered-list", item: string) => {
    if (pendingList?.type !== type) {
      flushList();
      pendingList = { type, items: [] };
    }
    pendingList.items.push(item.trim());
  };

  const processLine = (rawLine: string) => {
    const line = rawLine.trim();

    if (!line) {
      flushList();
      flushParagraph();
      return;
    }

    const heading = isHeadingLine(line) ? line.match(/^(#{1,4})\s+(.+)$/) : null;
    if (heading) {
      flushList();
      flushParagraph();
      const { heading: headingText, tail } = splitHeadingTail(heading[2]);
      blocks.push({ type: "heading", depth: heading[1].length, text: headingText });
      if (tail) processLine(tail);
      return;
    }

    const unorderedItem = isUnorderedListLine(line) ? line.match(/^[-*\u2022]\s+(.+)$/) : null;
    if (unorderedItem) {
      flushParagraph();
      addListItem("unordered-list", unorderedItem[1]);
      return;
    }

    const orderedItem = isOrderedListLine(line) ? line.match(/^\d+[.)]\s+(.+)$/) : null;
    if (orderedItem) {
      flushParagraph();
      addListItem("ordered-list", orderedItem[1]);
      return;
    }

    const definition = isDefinitionLine(line)
      ? line.match(/^\*\*([^*]+?):\*\*\s*(.+)$/) ?? line.match(/^\*\*([^*]+?)\*\*:\s*(.+)$/)
      : null;
    if (definition) {
      flushList();
      flushParagraph();
      blocks.push({
        type: "definition",
        label: definition[1].trim(),
        body: definition[2].trim(),
      });
      return;
    }

    if (pendingList?.items.length) {
      const lastIndex = pendingList.items.length - 1;
      pendingList.items[lastIndex] = joinTextLine(pendingList.items[lastIndex], line);
      return;
    }

    pendingParagraph.push(line);
  };

  lines.forEach(processLine);
  flushList();
  flushParagraph();

  return blocks;
}

function renderInline(value: string) {
  const parts = value.split(/(\*\*[^*]+?\*\*|\*[^*]+?\*)/g).filter(Boolean);

  return parts.map((part, index) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={`${part}-${index}`} className="font-semibold text-gray-950 dark:text-white">
          {part.slice(2, -2)}
        </strong>
      );
    }

    if (part.startsWith("*") && part.endsWith("*")) {
      return (
        <em key={`${part}-${index}`} className="text-gray-800 dark:text-gray-100">
          {part.slice(1, -1)}
        </em>
      );
    }

    return <span key={`${part}-${index}`}>{part.replace(/\*+/g, "")}</span>;
  });
}

function splitNumberedHeading(text: string) {
  const match = text.match(/^(\d+[.)]?)\s+(.+)$/);
  return match ? { number: match[1].replace(/[.)]/g, ""), title: match[2] } : null;
}

function getHeadingStyle(text: string, depth: number, compact: boolean) {
  const normalized = text.toLowerCase();
  const isActionBlock =
    normalized.includes("poin penting") ||
    normalized.includes("refleksi") ||
    normalized.includes("latihan");

  if (isActionBlock) {
    return {
      wrapper:
        "rounded-xl border border-brand-100 bg-brand-50 px-4 py-3 dark:border-brand-500/20 dark:bg-brand-500/10",
      eyebrow: "text-xs font-semibold uppercase tracking-[0.16em] text-brand-600 dark:text-brand-300",
      title: compact
        ? "mt-1 text-base font-semibold text-brand-700 dark:text-white"
        : "mt-1 text-lg font-semibold text-brand-700 dark:text-white",
    };
  }

  return {
    wrapper:
      "rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-800 dark:bg-white/[0.03]",
    eyebrow: "text-xs font-semibold uppercase tracking-[0.16em] text-gray-400",
    title:
      depth <= 2
        ? compact
          ? "mt-1 text-lg font-semibold text-gray-950 dark:text-white"
          : "mt-1 text-xl font-semibold text-gray-950 dark:text-white"
        : compact
          ? "mt-1 text-base font-semibold text-gray-950 dark:text-white"
          : "mt-1 text-lg font-semibold text-gray-950 dark:text-white",
  };
}

function MarkdownHeading({
  block,
  compact,
}: {
  block: Extract<MarkdownBlock, { type: "heading" }>;
  compact: boolean;
}) {
  const style = getHeadingStyle(block.text, block.depth, compact);
  const numbered = splitNumberedHeading(block.text);
  const normalized = block.text.toLowerCase();
  const eyebrow = normalized.includes("poin penting")
    ? "Ringkasan"
    : normalized.includes("refleksi")
      ? "Refleksi"
      : normalized.includes("latihan")
        ? "Latihan"
        : null;

  return (
    <section className={style.wrapper}>
      {eyebrow ? <p className={style.eyebrow}>{eyebrow}</p> : null}
      <div className={`${eyebrow ? "mt-1" : ""} flex items-start gap-3`}>
        {numbered ? (
          <span className="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-brand-500 text-xs font-bold text-white">
            {numbered.number}
          </span>
        ) : null}
        <h2 className={style.title}>{numbered?.title ?? block.text}</h2>
      </div>
    </section>
  );
}

function MarkdownList({
  items,
  ordered = false,
}: {
  items: string[];
  ordered?: boolean;
}) {
  const content = items.map((item, index) => (
    <li key={`${item}-${index}`} className="flex gap-3">
      <span className="mt-2 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-brand-50 text-xs font-bold text-brand-600 dark:bg-brand-500/15 dark:text-brand-300">
        {ordered ? index + 1 : <span className="h-1.5 w-1.5 rounded-full bg-brand-500" />}
      </span>
      <span className="min-w-0 flex-1">{renderInline(item)}</span>
    </li>
  ));

  return ordered ? (
    <ol className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 text-gray-700 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-200">
      {content}
    </ol>
  ) : (
    <ul className="space-y-3 rounded-xl border border-gray-100 bg-white p-4 text-gray-700 dark:border-gray-800 dark:bg-white/[0.02] dark:text-gray-200">
      {content}
    </ul>
  );
}

function renderBlock(block: MarkdownBlock, index: number, compact: boolean): ReactNode {
  switch (block.type) {
    case "heading":
      return <MarkdownHeading key={`heading-${index}`} block={block} compact={compact} />;
    case "definition":
      return (
        <div
          key={`definition-${index}`}
          className="rounded-xl border border-gray-200 bg-gray-50 p-4 dark:border-gray-800 dark:bg-white/[0.03]"
        >
          <p className="text-sm font-semibold text-brand-700 dark:text-brand-300">
            {block.label}
          </p>
          <p className="mt-1 text-gray-700 dark:text-gray-200">{renderInline(block.body)}</p>
        </div>
      );
    case "unordered-list":
      return <MarkdownList key={`ul-${index}`} items={block.items} />;
    case "ordered-list":
      return <MarkdownList key={`ol-${index}`} items={block.items} ordered />;
    default:
      return (
        <p key={`paragraph-${index}`} className="text-gray-700 dark:text-gray-200">
          {renderInline(block.text)}
        </p>
      );
  }
}

export default function MarkdownContent({
  value,
  className = "",
  compact = false,
}: MarkdownContentProps) {
  if (!value) {
    return (
      <p className={`${compact ? "mt-4" : "mt-7"} text-sm text-gray-500 dark:text-gray-400`}>
        Isi materi belum tersedia.
      </p>
    );
  }

  const blocks = parseMarkdown(value);

  return (
    <article
      className={`${
        compact ? "mt-4 space-y-4 text-sm leading-7" : "mt-8 space-y-5 text-base leading-8"
      } ${className}`}
    >
      {blocks.map((block, index) => renderBlock(block, index, compact))}
    </article>
  );
}
