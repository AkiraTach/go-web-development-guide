import { useState, type ReactNode } from "react";
import type { Chapter } from "../types";
import { chapters, parts } from "../data/chapters";
import type { Route } from "../lib/hooks";

interface Props {
  route: Route;
  done: string[];
}

function NavItem({ href, active, children }: { href: string; active: boolean; children: ReactNode }) {
  return (
    <a
      href={href}
      className={`flex items-center gap-2 rounded-lg px-3 py-2 text-sm transition ${
        active ? "bg-cyan-50 font-semibold text-cyan-800" : "text-slate-600 hover:bg-slate-100 hover:text-slate-900"
      }`}
    >
      {children}
    </a>
  );
}

export default function Sidebar({ route, done }: Props) {
  const [query, setQuery] = useState("");
  const keyword = query.trim().toLowerCase();
  const match = (c: Chapter) => !keyword || `${c.title} ${c.summary}`.toLowerCase().includes(keyword);
  const matchedCount = chapters.filter(match).length;

  return (
    <nav className="space-y-6">
      <input
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        placeholder="搜索章节关键词…"
        className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm outline-none focus:border-cyan-500 focus:ring-2 focus:ring-cyan-100"
      />

      <div className="space-y-0.5">
        <NavItem href="#/home" active={route.page === "home"}>
          <span>🏠</span>
          <span>教程首页</span>
        </NavItem>
        <NavItem href="#/cheatsheet" active={route.page === "cheatsheet"}>
          <span>⚡</span>
          <span>速查表</span>
        </NavItem>
        <NavItem href="#/resources" active={route.page === "resources"}>
          <span>📚</span>
          <span>资源与常见问题</span>
        </NavItem>
      </div>

      {parts.map((part) => {
        const items = chapters.filter((c) => c.part === part && match(c));
        if (items.length === 0) return null;
        return (
          <div key={part}>
            <h3 className="mb-1 px-3 text-xs font-semibold tracking-wider text-slate-400">{part}</h3>
            <div className="space-y-0.5">
              {items.map((c) => (
                <NavItem key={c.id} href={`#/chapter/${c.id}`} active={route.page === "chapter" && route.id === c.id}>
                  <span className="w-5 shrink-0 text-center">{done.includes(c.id) ? "✅" : c.icon}</span>
                  <span className="truncate">{c.title}</span>
                </NavItem>
              ))}
            </div>
          </div>
        );
      })}

      {matchedCount === 0 && <p className="px-3 text-sm text-slate-400">没有匹配的章节，换个关键词试试。</p>}
    </nav>
  );
}
