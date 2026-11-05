import { useState } from "react";
import type { Chapter, Quiz } from "../types";
import { chapters } from "../data/chapters";
import BlockRenderer from "./BlockRenderer";

function QuizCard({ index, quiz }: { index: number; quiz: Quiz }) {
  const [picked, setPicked] = useState<number | null>(null);
  const answered = picked !== null;
  const correct = picked === quiz.answer;

  return (
    <div className="rounded-xl border border-slate-200 p-4">
      <p className="font-medium text-slate-900">
        {index + 1}. {quiz.q}
      </p>
      <div className="mt-3 grid gap-2">
        {quiz.options.map((opt, i) => {
          let style = "border-slate-200 bg-white hover:border-cyan-400 hover:bg-cyan-50";
          if (answered && i === quiz.answer) style = "border-emerald-500 bg-emerald-50 text-emerald-900";
          else if (answered && i === picked) style = "border-rose-400 bg-rose-50 text-rose-900";
          return (
            <button
              key={i}
              type="button"
              disabled={answered}
              onClick={() => setPicked(i)}
              className={`rounded-lg border px-3 py-2 text-left text-sm transition disabled:cursor-default ${style}`}
            >
              <span className="mr-2 font-mono text-slate-400">{String.fromCharCode(65 + i)}.</span>
              {opt}
            </button>
          );
        })}
      </div>
      {answered && (
        <p className={`mt-3 text-sm leading-6 ${correct ? "text-emerald-700" : "text-rose-700"}`}>
          {correct ? "✅ 回答正确！" : "❌ 回答错误。"} {quiz.explain}
        </p>
      )}
    </div>
  );
}

interface Props {
  chapter: Chapter;
  index: number;
  prev?: Chapter;
  next?: Chapter;
  done: string[];
  onToggle: (id: string) => void;
}

export default function ChapterView({ chapter, index, prev, next, done, onToggle }: Props) {
  const isDone = done.includes(chapter.id);
  const codeCount = chapter.body.filter((b) => b.type === "code").length;

  return (
    <article className="mx-auto max-w-4xl">
      <nav className="text-sm text-slate-500">
        <a href="#/home" className="hover:text-cyan-700">
          首页
        </a>
        <span className="mx-2">/</span>
        <span>{chapter.part}</span>
      </nav>

      <header className="mt-5">
        <div className="flex items-start gap-4">
          <span className="text-5xl">{chapter.icon}</span>
          <div>
            <p className="text-sm font-semibold text-cyan-700">
              第 {index + 1} 章 / 共 {chapters.length} 章
            </p>
            <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">{chapter.title}</h1>
          </div>
        </div>
        <p className="mt-4 text-lg leading-8 text-slate-600">{chapter.summary}</p>
        <div className="mt-4 flex flex-wrap gap-2 text-xs font-medium">
          <span className="rounded-full bg-slate-200/70 px-3 py-1 text-slate-700">难度：{chapter.level}</span>
          <span className="rounded-full bg-slate-200/70 px-3 py-1 text-slate-700">约 {chapter.minutes} 分钟</span>
          <span className="rounded-full bg-slate-200/70 px-3 py-1 text-slate-700">{codeCount} 个代码块</span>
          <span className="rounded-full bg-slate-200/70 px-3 py-1 text-slate-700">{chapter.quiz.length} 道自测题</span>
        </div>
      </header>

      <section className="mt-6 rounded-2xl border border-cyan-100 bg-cyan-50/60 p-5">
        <h2 className="font-semibold text-cyan-900">🎯 学习目标</h2>
        <ul className="mt-2 space-y-1.5 text-sm leading-6 text-slate-700">
          {chapter.goals.map((g) => (
            <li key={g} className="flex gap-2">
              <span className="text-cyan-600">✔</span>
              <span>{g}</span>
            </li>
          ))}
        </ul>
      </section>

      <div className="mt-8">
        <BlockRenderer blocks={chapter.body} />
      </div>

      {chapter.exercises.length > 0 && (
        <section className="mt-12 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">✏️ 动手练习</h2>
          <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7 text-slate-700">
            {chapter.exercises.map((e) => (
              <li key={e}>{e}</li>
            ))}
          </ol>
        </section>
      )}

      {chapter.quiz.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">🧠 自测题</h2>
          <p className="mt-1 text-sm text-slate-500">选择一个答案，系统会立即判分并给出解析。</p>
          <div className="mt-4 space-y-4">
            {chapter.quiz.map((q, i) => (
              <QuizCard key={i} index={i} quiz={q} />
            ))}
          </div>
        </section>
      )}

      {chapter.refs.length > 0 && (
        <section className="mt-6 rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-xl font-bold text-slate-900">📖 官方文档（本章参考）</h2>
          <ul className="mt-3 divide-y divide-slate-100">
            {chapter.refs.map((r) => (
              <li key={r.url} className="py-2.5">
                <a href={r.url} target="_blank" rel="noreferrer" className="text-cyan-700 hover:underline">
                  {r.title} ↗
                </a>
              </li>
            ))}
          </ul>
        </section>
      )}

      <footer className="mt-10 border-t border-slate-200 pt-6">
        <button
          type="button"
          onClick={() => onToggle(chapter.id)}
          className={`rounded-lg px-5 py-2.5 text-sm font-semibold text-white shadow-sm transition ${
            isDone ? "bg-emerald-600 hover:bg-emerald-700" : "bg-cyan-600 hover:bg-cyan-700"
          }`}
        >
          {isDone ? "✅ 已完成（点击可取消）" : "标记本章为已完成"}
        </button>

        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {prev ? (
            <a
              href={`#/chapter/${prev.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 hover:border-cyan-400"
            >
              <p className="text-xs text-slate-500">← 上一章</p>
              <p className="mt-1 font-medium text-slate-900 group-hover:text-cyan-700">{prev.title}</p>
            </a>
          ) : (
            <div />
          )}
          {next ? (
            <a
              href={`#/chapter/${next.id}`}
              className="group rounded-xl border border-slate-200 bg-white p-4 text-right hover:border-cyan-400"
            >
              <p className="text-xs text-slate-500">下一章 →</p>
              <p className="mt-1 font-medium text-slate-900 group-hover:text-cyan-700">{next.title}</p>
            </a>
          ) : (
            <div />
          )}
        </div>
      </footer>
    </article>
  );
}
