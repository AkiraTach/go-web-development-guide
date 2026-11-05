import { useState } from "react";
import { Highlight, themes } from "prism-react-renderer";
import type { Lang } from "../types";

const LABEL: Record<Lang, string> = {
  go: "Go",
  bash: "Shell",
  sql: "SQL",
  html: "HTML",
  css: "CSS",
  json: "JSON",
  yaml: "YAML",
  dockerfile: "Dockerfile",
  text: "文本",
};

// 映射到 Prism 语法名；Prism 未提供的语言（bash、Dockerfile、文本）按纯文本显示
const PRISM: Partial<Record<Lang, string>> = {
  go: "go",
  sql: "sql",
  html: "markup",
  css: "css",
  json: "json",
  yaml: "yaml",
};

export default function CodeBlock({ lang, file, code }: { lang: Lang; file?: string; code: string }) {
  const [copied, setCopied] = useState(false);
  const text = code.replace(/^\n/, "").replace(/\s+$/, "");
  const grammar = PRISM[lang];

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 1500);
    } catch {
      setCopied(false);
    }
  };

  return (
    <div className="overflow-hidden rounded-xl border border-slate-800 bg-[#1e1e1e] shadow-sm">
      <div className="flex items-center justify-between border-b border-white/10 bg-[#2d2d2d] px-4 py-2">
        <div className="flex min-w-0 items-center gap-2 text-xs">
          <span className="shrink-0 rounded bg-cyan-500/20 px-1.5 py-0.5 font-mono text-cyan-300">{LABEL[lang]}</span>
          {file && <span className="truncate font-mono text-slate-400">{file}</span>}
        </div>
        <button
          type="button"
          onClick={copy}
          className="shrink-0 rounded-md px-2 py-1 text-xs text-slate-300 hover:bg-white/10 hover:text-white"
        >
          {copied ? "已复制 ✓" : "复制"}
        </button>
      </div>
      {grammar ? (
        <Highlight theme={themes.vsDark} code={text} language={grammar}>
          {({ className, style, tokens, getLineProps, getTokenProps }) => (
            <pre
              className={`${className} m-0 overflow-x-auto px-4 py-4 text-[13px] leading-6`}
              style={{ ...style, background: "transparent" }}
            >
              {tokens.map((line, i) => (
                <div key={i} {...getLineProps({ line })}>
                  {line.map((token, key) => (
                    <span key={key} {...getTokenProps({ token })} />
                  ))}
                </div>
              ))}
            </pre>
          )}
        </Highlight>
      ) : (
        <pre className="m-0 overflow-x-auto px-4 py-4 font-mono text-[13px] leading-6 text-slate-200">{text}</pre>
      )}
    </div>
  );
}
