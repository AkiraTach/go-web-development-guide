import { chapters, parts } from "../data/chapters";
import { coreDocs } from "../data/official";

const PREREQUISITES = [
  "会一点任意编程语言（变量、函数、循环、条件判断即可），无需 Go 基础",
  "会使用命令行（cd、ls 或 dir、运行命令）",
  "一台能联网的电脑：Windows、macOS 或 Linux 均可",
  "一个代码编辑器，推荐 VS Code 并安装官方 Go 扩展",
];

const TIPS = [
  "按章节顺序学习：每章都有学习目标、代码示例与自测题",
  "代码可以直接复制到本地运行，并对照「运行结果」检查输出",
  "先自己敲一遍再看解析，动手练习比只读更有效",
  "卡住时查看「资源与常见问题」，或阅读每章末尾的官方文档",
  "第 19 章的综合项目是检验学习成果的最佳方式",
];

export default function HomePage({ done }: { done: string[] }) {
  const nextIndex = Math.max(0, chapters.findIndex((c) => !done.includes(c.id)));
  const next = chapters[nextIndex];
  const codeTotal = chapters.reduce((n, c) => n + c.body.filter((b) => b.type === "code").length, 0);
  const quizTotal = chapters.reduce((n, c) => n + c.quiz.length, 0);
  const percent = Math.round((done.length / chapters.length) * 100);
  const cta = done.length === 0 ? "开始学习" : done.length === chapters.length ? "回顾教程" : "继续学习";

  const stats = [
    { label: "章节", value: chapters.length },
    { label: "代码块", value: codeTotal },
    { label: "自测题", value: quizTotal },
    { label: "核心官方文档", value: coreDocs.length },
  ];

  return (
    <div className="space-y-12">
      <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-cyan-600 via-sky-600 to-indigo-700 p-8 text-white shadow-xl sm:p-12">
        <div className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-white/10 blur-3xl" />
        <div className="relative max-w-2xl">
          <span className="inline-flex items-center gap-2 rounded-full bg-white/15 px-3 py-1 text-xs font-semibold backdrop-blur">
            🐹 基于 Go 1.27（2026 年最新稳定版）
          </span>
          <h1 className="mt-5 text-4xl font-extrabold tracking-tight sm:text-5xl">Go Web 开发完全教程</h1>
          <p className="mt-4 text-lg leading-8 text-cyan-50">
            从零基础到独立上线一个 Go Web 应用。以 Go 官方文档为主线，覆盖语言基础、标准库 net/http、Go 1.22 路由增强、
            html/template、database/sql、log/slog、安全最佳实践与部署，并附带练习、自测和综合实战项目。
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <a
              href={`#/chapter/${next.id}`}
              className="rounded-xl bg-white px-5 py-2.5 text-sm font-semibold text-cyan-700 shadow-lg transition hover:bg-cyan-50"
            >
              {cta} · 第 {nextIndex + 1} 章
            </a>
            <a
              href="#/resources"
              className="rounded-xl border border-white/30 bg-white/10 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-white/20"
            >
              查看官方文档索引
            </a>
          </div>
        </div>
        <dl className="relative mt-10 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {stats.map((s) => (
            <div key={s.label} className="rounded-2xl bg-white/10 p-4 backdrop-blur">
              <dt className="text-xs text-cyan-100">{s.label}</dt>
              <dd className="mt-1 text-2xl font-bold">{s.value}</dd>
            </div>
          ))}
        </dl>
      </section>

      <section className="rounded-2xl border border-slate-200 bg-white p-6">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="text-lg font-bold text-slate-900">📈 我的学习进度</h2>
          <span className="text-sm text-slate-500">
            已完成 {done.length} / {chapters.length} 章（{percent}%）
          </span>
        </div>
        <div className="mt-4 h-2.5 overflow-hidden rounded-full bg-slate-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-sky-500 transition-all duration-500"
            style={{ width: `${percent}%` }}
          />
        </div>
        <p className="mt-3 text-xs text-slate-400">进度保存在当前浏览器的本地存储中，在每章末尾点击「标记为已完成」即可记录。</p>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">🗺️ 学习路线</h2>
        <p className="mt-2 text-slate-600">四个阶段循序渐进：先掌握语言，再学工程化，然后做 Web，最后谈安全与上线。</p>
        <div className="mt-6 grid gap-5 md:grid-cols-2">
          {parts.map((part) => (
            <div key={part} className="rounded-2xl border border-slate-200 bg-white p-5">
              <h3 className="font-semibold text-slate-900">{part}</h3>
              <ul className="mt-3 space-y-1.5">
                {chapters
                  .filter((c) => c.part === part)
                  .map((c) => (
                    <li key={c.id}>
                      <a
                        href={`#/chapter/${c.id}`}
                        className="flex items-center gap-2 rounded-lg px-2 py-1.5 text-sm text-slate-700 hover:bg-cyan-50 hover:text-cyan-800"
                      >
                        <span className="w-5 text-center">{done.includes(c.id) ? "✅" : c.icon}</span>
                        <span>{c.title}</span>
                        <span className="ml-auto shrink-0 text-xs text-slate-400">{c.minutes} 分钟</span>
                      </a>
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      </section>

      <section className="grid gap-5 md:grid-cols-2">
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">✅ 学习前提</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {PREREQUISITES.map((p) => (
              <li key={p}>{p}</li>
            ))}
          </ul>
        </div>
        <div className="rounded-2xl border border-slate-200 bg-white p-6">
          <h2 className="text-lg font-bold text-slate-900">💡 学习建议</h2>
          <ul className="mt-3 list-disc space-y-2 pl-5 text-sm leading-6 text-slate-700">
            {TIPS.map((t) => (
              <li key={t}>{t}</li>
            ))}
          </ul>
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">📚 官方文档索引</h2>
        <p className="mt-2 text-slate-600">
          以下是本教程的核心参考资料，均来自 go.dev 与 pkg.go.dev。每章末尾还列出了对应的官方链接，方便深入阅读。
        </p>
        <div className="mt-6 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">主题</th>
                <th className="px-4 py-3 font-semibold">链接</th>
                <th className="px-4 py-3 font-semibold">说明</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {coreDocs.map((d) => (
                <tr key={d.url} className="align-top">
                  <td className="px-4 py-3 font-medium text-slate-900">{d.topic}</td>
                  <td className="px-4 py-3">
                    <a href={d.url} target="_blank" rel="noreferrer" className="break-all text-cyan-700 hover:underline">
                      {d.url}
                    </a>
                  </td>
                  <td className="px-4 py-3 text-slate-600">{d.desc}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
