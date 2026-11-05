import { useEffect, useState, type ReactNode } from "react";
import { chapters } from "./data/chapters";
import { useHashRoute, useProgress } from "./lib/hooks";
import Sidebar from "./components/Sidebar";
import HomePage from "./components/HomePage";
import ChapterView from "./components/ChapterView";
import { CheatSheet, ResourcesPage } from "./components/Appendix";

function NotFound() {
  return (
    <div className="py-24 text-center">
      <p className="text-6xl">🧭</p>
      <h1 className="mt-4 text-2xl font-bold text-slate-900">没有找到这个页面</h1>
      <a
        href="#/home"
        className="mt-6 inline-block rounded-lg bg-cyan-600 px-5 py-2.5 text-sm font-medium text-white hover:bg-cyan-700"
      >
        返回首页
      </a>
    </div>
  );
}

export default function App() {
  const route = useHashRoute();
  const { done, toggle } = useProgress();
  const [menuOpen, setMenuOpen] = useState(false);

  // 切换页面时回到顶部，并关闭移动端目录
  useEffect(() => {
    window.scrollTo({ top: 0 });
    setMenuOpen(false);
  }, [route]);

  const index = route.page === "chapter" ? chapters.findIndex((c) => c.id === route.id) : -1;

  let content: ReactNode;
  if (route.page === "home") {
    content = <HomePage done={done} />;
  } else if (route.page === "cheatsheet") {
    content = <CheatSheet />;
  } else if (route.page === "resources") {
    content = <ResourcesPage />;
  } else if (index >= 0) {
    content = (
      <ChapterView
        key={chapters[index].id}
        chapter={chapters[index]}
        index={index}
        prev={chapters[index - 1]}
        next={chapters[index + 1]}
        done={done}
        onToggle={toggle}
      />
    );
  } else {
    content = <NotFound />;
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800">
      <header className="sticky top-0 z-30 border-b border-slate-200/80 bg-white/80 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-7xl items-center gap-3 px-4">
          <button
            type="button"
            onClick={() => setMenuOpen(true)}
            className="rounded-md p-2 text-slate-600 hover:bg-slate-100 lg:hidden"
            aria-label="打开目录"
          >
            <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <a href="#/home" className="flex items-center gap-2 font-bold text-slate-900">
            <span className="text-xl">🐹</span>
            <span className="hidden sm:inline">Go Web 开发教程</span>
          </a>
          <span className="rounded-full bg-cyan-50 px-2.5 py-0.5 text-xs font-semibold text-cyan-700 ring-1 ring-cyan-200">
            Go 1.27
          </span>
          <div className="ml-auto flex items-center gap-4 text-sm">
            <span className="hidden font-medium text-slate-500 sm:inline">
              进度 {done.length}/{chapters.length}
            </span>
            <a
              href="https://go.dev/doc/"
              target="_blank"
              rel="noreferrer"
              className="text-slate-600 hover:text-cyan-700"
            >
              官方文档 ↗
            </a>
          </div>
        </div>
      </header>

      <div className="mx-auto flex max-w-7xl gap-8 px-4">
        <aside
          className={`${
            menuOpen ? "fixed inset-0 z-40 block overflow-y-auto bg-white p-5" : "hidden"
          } lg:sticky lg:top-14 lg:inset-auto lg:z-auto lg:block lg:h-[calc(100vh-3.5rem)] lg:w-72 lg:shrink-0 lg:overflow-y-auto lg:bg-transparent lg:p-0 lg:py-8 lg:pr-2`}
        >
          <div className="mb-4 flex items-center justify-between lg:hidden">
            <span className="font-semibold text-slate-900">目录</span>
            <button
              type="button"
              onClick={() => setMenuOpen(false)}
              className="rounded-md px-3 py-1.5 text-sm text-slate-600 hover:bg-slate-100"
            >
              关闭 ✕
            </button>
          </div>
          <Sidebar route={route} done={done} />
        </aside>

        <main className="min-w-0 flex-1 py-8 lg:py-10">{content}</main>
      </div>

      <footer className="mx-auto mt-10 max-w-7xl border-t border-slate-200 px-4 py-8 text-center text-xs leading-6 text-slate-400">
        内容基于 Go 官方文档整理（go.dev / pkg.go.dev）。示例代码已使用 Go 1.27 编译与测试校验。学习进度保存在本地浏览器中。
      </footer>
    </div>
  );
}
