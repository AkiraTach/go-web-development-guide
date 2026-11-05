/** 代码块语言（用于语法高亮） */
export type Lang =
  | "go"
  | "bash"
  | "sql"
  | "html"
  | "css"
  | "json"
  | "yaml"
  | "dockerfile"
  | "text";

/** 章节正文中的内容块 */
export type Block =
  | { type: "h2"; text: string }
  | { type: "h3"; text: string }
  | { type: "p"; text: string }
  | { type: "ul"; items: string[] }
  | { type: "ol"; items: string[] }
  | { type: "tip" | "warn" | "note"; title?: string; text: string }
  // mod 仅用于离线校验（go vet / go test），不影响页面展示
  | { type: "code"; lang: Lang; file?: string; mod?: string; code: string }
  | { type: "output"; title?: string; text: string }
  | { type: "table"; head: string[]; rows: string[][] };

export interface Ref {
  title: string;
  url: string;
}

export interface Quiz {
  q: string;
  options: string[];
  /** 正确选项的下标（从 0 开始） */
  answer: number;
  explain: string;
}

export type Level = "入门" | "进阶" | "实战";

export interface Chapter {
  id: string;
  part: string;
  title: string;
  summary: string;
  level: Level;
  minutes: number;
  icon: string;
  goals: string[];
  body: Block[];
  exercises: string[];
  quiz: Quiz[];
  refs: Ref[];
}
