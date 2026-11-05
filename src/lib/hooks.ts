import { useCallback, useEffect, useState } from "react";

export type Route =
  | { page: "home" }
  | { page: "chapter"; id: string }
  | { page: "cheatsheet" }
  | { page: "resources" };

/** 把 URL 哈希解析为页面路由，例如 #/chapter/ch01 */
export function parseHash(hash: string): Route {
  const path = hash.replace(/^#\/?/, "");
  const [head, id] = path.split("/");
  if (head === "chapter" && id) return { page: "chapter", id };
  if (head === "cheatsheet") return { page: "cheatsheet" };
  if (head === "resources") return { page: "resources" };
  return { page: "home" };
}

/** 监听哈希变化，返回当前路由 */
export function useHashRoute(): Route {
  const [route, setRoute] = useState<Route>(() => parseHash(window.location.hash));

  useEffect(() => {
    const onChange = () => setRoute(parseHash(window.location.hash));
    window.addEventListener("hashchange", onChange);
    return () => window.removeEventListener("hashchange", onChange);
  }, []);

  return route;
}

const STORAGE_KEY = "go-web-tutorial:completed";

function readCompleted(): string[] {
  try {
    const parsed: unknown = JSON.parse(localStorage.getItem(STORAGE_KEY) ?? "[]");
    return Array.isArray(parsed) ? parsed.filter((v): v is string => typeof v === "string") : [];
  } catch {
    return [];
  }
}

/** 学习进度：已完成的章节 ID 保存在 localStorage 中 */
export function useProgress() {
  const [done, setDone] = useState<string[]>(readCompleted);

  const toggle = useCallback((id: string) => {
    setDone((prev) => {
      const next = prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // 隐私模式等情况下忽略存储错误
      }
      return next;
    });
  }, []);

  return { done, toggle };
}
