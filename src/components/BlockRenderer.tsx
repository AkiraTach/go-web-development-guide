import type { Block } from "../types";
import CodeBlock from "./CodeBlock";

/** 解析行内格式：`代码` 与 **粗体** */
function renderInline(text: string) {
  return text.split(/(`[^`]+`|\*\*[^*]+\*\*)/g).map((part, i) => {
    if (part.length > 2 && part.startsWith("`") && part.endsWith("`")) {
      return (
        <code key={i} className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[0.9em] text-rose-600">
          {part.slice(1, -1)}
        </code>
      );
    }
    if (part.length > 4 && part.startsWith("**") && part.endsWith("**")) {
      return (
        <strong key={i} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={i}>{part}</span>;
  });
}

const CALLOUT = {
  tip: { box: "border-emerald-200 bg-emerald-50 text-emerald-900", icon: "💡", title: "提示" },
  warn: { box: "border-amber-200 bg-amber-50 text-amber-900", icon: "⚠️", title: "注意" },
  note: { box: "border-sky-200 bg-sky-50 text-sky-900", icon: "📘", title: "版本说明" },
} as const;

function Callout({ kind, title, text }: { kind: "tip" | "warn" | "note"; title?: string; text: string }) {
  const style = CALLOUT[kind];
  return (
    <div className={`rounded-xl border p-4 text-sm leading-6 ${style.box}`}>
      <p className="font-semibold">
        {style.icon} {title ?? style.title}
      </p>
      <p className="mt-1">{renderInline(text)}</p>
    </div>
  );
}

function OutputBlock({ title, text }: { title?: string; text: string }) {
  return (
    <div className="overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
      <div className="border-b border-white/10 px-4 py-2 text-xs text-slate-400">{title ?? "运行结果"}</div>
      <pre className="m-0 overflow-x-auto px-4 py-3 font-mono text-[13px] leading-6 text-emerald-300">
        {text.replace(/^\n/, "").replace(/\s+$/, "")}
      </pre>
    </div>
  );
}

export default function BlockRenderer({ blocks }: { blocks: Block[] }) {
  return (
    <div className="space-y-4">
      {blocks.map((b, i) => {
        switch (b.type) {
          case "h2":
            return (
              <h2
                key={i}
                className="mt-10 scroll-mt-20 border-b border-slate-200 pb-2 text-2xl font-bold tracking-tight text-slate-900 first:mt-0"
              >
                {b.text}
              </h2>
            );
          case "h3":
            return (
              <h3 key={i} className="mt-6 text-lg font-semibold text-slate-900">
                {b.text}
              </h3>
            );
          case "p":
            return (
              <p key={i} className="leading-7 text-slate-700">
                {renderInline(b.text)}
              </p>
            );
          case "ul":
            return (
              <ul key={i} className="list-disc space-y-1.5 pl-6 leading-7 text-slate-700">
                {b.items.map((t, j) => (
                  <li key={j}>{renderInline(t)}</li>
                ))}
              </ul>
            );
          case "ol":
            return (
              <ol key={i} className="list-decimal space-y-1.5 pl-6 leading-7 text-slate-700">
                {b.items.map((t, j) => (
                  <li key={j}>{renderInline(t)}</li>
                ))}
              </ol>
            );
          case "tip":
          case "warn":
          case "note":
            return <Callout key={i} kind={b.type} title={b.title} text={b.text} />;
          case "code":
            return <CodeBlock key={i} lang={b.lang} file={b.file} code={b.code} />;
          case "output":
            return <OutputBlock key={i} title={b.title} text={b.text} />;
          case "table":
            return (
              <div key={i} className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
                <table className="min-w-full text-left text-sm">
                  <thead className="bg-slate-50 text-slate-600">
                    <tr>
                      {b.head.map((h, j) => (
                        <th key={j} className="px-4 py-2.5 font-semibold">
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {b.rows.map((row, r) => (
                      <tr key={r}>
                        {row.map((cell, c) => (
                          <td key={c} className="px-4 py-2.5 align-top text-slate-700">
                            {renderInline(cell)}
                          </td>
                        ))}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            );
          default:
            return null;
        }
      })}
    </div>
  );
}
