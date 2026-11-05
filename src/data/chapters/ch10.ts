import type { Chapter } from "../../types";

// 反引号在模板字符串中需要转义，这里用占位符插入，便于书写 Go 结构体标签
const BT = "`";

export const ch10: Chapter = {
  id: "ch10",
  part: "第三部分：Web 开发核心",
  title: "Go 1.22 路由增强：方法与路径参数",
  summary: "使用 net/http 内置的方法匹配、路径参数、通配符与精确匹配，写出清晰的 REST 风格路由，无需第三方路由库。",
  level: "进阶",
  minutes: 60,
  icon: "🛣️",
  goals: [
    "在路由模式中指定 HTTP 方法，例如 GET /posts/{id}",
    "使用 r.PathValue 读取路径参数，并正确转换类型",
    "区分 {name}、{name...} 与 {$} 三种通配符",
    "理解路由优先级（最具体的模式胜出）与冲突规则",
    "实现一个完整的 REST 风格图书 API",
  ],
  body: [
    { type: "h2", text: "1. 旧写法的问题" },
    {
      type: "p",
      text: "Go 1.22 之前，ServeMux 只能按路径前缀匹配，无法区分 HTTP 方法，也不支持路径参数。开发者只能在处理函数里手动检查 `r.Method`，再自己解析路径字符串。这既繁琐，又容易出错：例如 `DELETE /posts/234` 很可能误触发了查询逻辑。",
    },

    { type: "h2", text: "2. 方法 + 路径模式" },
    {
      type: "p",
      text: "从 Go 1.22 起，注册路由时可以在路径前加上方法名，中间用空格分隔：",
    },
    {
      type: "code",
      lang: "go",
      code: String.raw`mux.HandleFunc("GET /posts/{id}", showPost)
mux.HandleFunc("POST /posts", createPost)`,
    },
    {
      type: "ul",
      items: [
        "`GET` 同时匹配 `HEAD` 请求；其他方法都是精确匹配。",
        "路径存在但方法不匹配时，服务器自动返回 **405 Method Not Allowed**，并在 `Allow` 响应头中列出可用的方法。",
        "不写方法的模式（如 `/posts/`）仍然匹配所有方法，与旧版本完全兼容。",
      ],
    },

    { type: "h2", text: "3. 路径参数：r.PathValue" },
    {
      type: "p",
      text: "路径中的 `{名称}` 是**通配符**，匹配一个完整的路径段。处理函数中用 `r.PathValue(\"名称\")` 读取它。注意：结果总是字符串，需要用 strconv 等函数自行转换类型。",
    },

    { type: "h2", text: "4. 通配符、精确匹配与尾部斜杠" },
    {
      type: "table",
      head: ["模式", "匹配示例", "不匹配或特殊情况"],
      rows: [
        ["`/posts/{id}`", "`/posts/42`", "`/posts`、`/posts/42/comments`"],
        ["`/files/{path...}`", "`/files/a/b/c.txt`（匹配剩余所有段）", "`/files`"],
        ["`/{$}`", "`/`（只匹配根路径）", "`/index.html`"],
        ["`/posts/{$}`", "`/posts/`", "`/posts`、`/posts/42`"],
        ["`/posts/`", "`/posts/42`（前缀匹配）", "`/posts` 会被重定向到 `/posts/`"],
      ],
    },

    { type: "h2", text: "5. 完整示例：图书 API" },
    {
      type: "p",
      text: "下面的程序实现了一个基于内存的图书 API。仓库使用 sync.Mutex 保证并发安全，列表使用 Go 1.23 的 maps.Keys 与 slices.Sorted 保证输出顺序稳定。",
    },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/books",
      code: String.raw`package main

import (
	"encoding/json"
	"fmt"
	"log"
	"maps"
	"net/http"
	"slices"
	"strconv"
	"sync"
)

type Book struct {
	ID    int    ${BT}json:"id"${BT}
	Title string ${BT}json:"title"${BT}
}

// Store 是内存中的图书仓库，使用互斥锁保证并发安全。
type Store struct {
	mu     sync.Mutex
	nextID int
	books  map[int]Book
}

func NewStore() *Store {
	return &Store{nextID: 1, books: make(map[int]Book)}
}

func (s *Store) List() []Book {
	s.mu.Lock()
	defer s.mu.Unlock()
	ids := slices.Sorted(maps.Keys(s.books))
	out := make([]Book, 0, len(ids))
	for _, id := range ids {
		out = append(out, s.books[id])
	}
	return out
}

func (s *Store) Get(id int) (Book, bool) {
	s.mu.Lock()
	defer s.mu.Unlock()
	b, ok := s.books[id]
	return b, ok
}

func (s *Store) Create(title string) Book {
	s.mu.Lock()
	defer s.mu.Unlock()
	b := Book{ID: s.nextID, Title: title}
	s.books[b.ID] = b
	s.nextID++
	return b
}

func (s *Store) Delete(id int) bool {
	s.mu.Lock()
	defer s.mu.Unlock()
	if _, ok := s.books[id]; !ok {
		return false
	}
	delete(s.books, id)
	return true
}

// writeJSON 统一输出 JSON 响应。
func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	w.WriteHeader(status)
	if err := json.NewEncoder(w).Encode(v); err != nil {
		log.Printf("编码失败: %v", err)
	}
}

// parseID 读取路径参数 {id} 并转换为整数。
func parseID(r *http.Request) (int, error) {
	return strconv.Atoi(r.PathValue("id"))
}

func main() {
	store := NewStore()
	store.Create("Go 程序设计")
	store.Create("Web 开发实战")

	mux := http.NewServeMux()

	// {$} 表示精确匹配根路径 "/"，不会匹配其他未注册的路径
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "图书 API：GET /books、GET /books/{id}、POST /books、DELETE /books/{id}")
	})

	mux.HandleFunc("GET /books", func(w http.ResponseWriter, r *http.Request) {
		writeJSON(w, http.StatusOK, store.List())
	})

	mux.HandleFunc("GET /books/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, err := parseID(r)
		if err != nil {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "id 必须是整数"})
			return
		}
		book, ok := store.Get(id)
		if !ok {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "图书不存在"})
			return
		}
		writeJSON(w, http.StatusOK, book)
	})

	mux.HandleFunc("POST /books", func(w http.ResponseWriter, r *http.Request) {
		var in struct {
			Title string ${BT}json:"title"${BT}
		}
		if err := json.NewDecoder(r.Body).Decode(&in); err != nil || in.Title == "" {
			writeJSON(w, http.StatusBadRequest, map[string]string{"error": "请求体需要包含 title 字段"})
			return
		}
		writeJSON(w, http.StatusCreated, store.Create(in.Title))
	})

	mux.HandleFunc("DELETE /books/{id}", func(w http.ResponseWriter, r *http.Request) {
		id, err := parseID(r)
		if err != nil || !store.Delete(id) {
			writeJSON(w, http.StatusNotFound, map[string]string{"error": "图书不存在"})
			return
		}
		w.WriteHeader(http.StatusNoContent)
	})

	// 多段通配符 {path...} 匹配剩余的所有路径段
	mux.HandleFunc("GET /files/{path...}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "请求的文件路径：%s\n", r.PathValue("path"))
	})

	log.Println("图书 API 已启动：http://localhost:8080")
	log.Fatal(http.ListenAndServe(":8080", mux))
}`,
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`curl http://localhost:8080/books
curl -X POST -H "Content-Type: application/json" -d '{"title":"Go 并发"}' http://localhost:8080/books
curl -i http://localhost:8080/books/3
curl -i -X DELETE http://localhost:8080/books/1
curl -i -X PUT http://localhost:8080/books      # 路径存在但方法不对
curl http://localhost:8080/files/a/b/c.txt`,
    },
    {
      type: "output",
      title: "部分运行结果",
      text: String.raw`[{"id":1,"title":"Go 程序设计"},{"id":2,"title":"Web 开发实战"}]
{"id":3,"title":"Go 并发"}
HTTP/1.1 200 OK
HTTP/1.1 204 No Content
HTTP/1.1 405 Method Not Allowed    （响应头 Allow: GET, HEAD, POST）
请求的文件路径：a/b/c.txt`,
    },

    { type: "h2", text: "6. 路由优先级：最具体的模式胜出" },
    {
      type: "p",
      text: "当多个模式都能匹配同一个请求时，Go 选择**最具体（most specific）**的模式，与注册顺序无关。如果两个模式互相重叠且都不更具体，那么注册时就会 panic，提前暴露冲突。",
    },
    {
      type: "table",
      head: ["模式 A", "模式 B", "请求", "结果"],
      rows: [
        ["`/posts/latest`", "`/posts/{id}`", "`/posts/latest`", "A 胜出：字面量比通配符更具体"],
        ["`GET /posts/{id}`", "`/posts/{id}`", "`GET /posts/1`", "A 胜出：限定了请求方法"],
        ["`/posts/{id}`", "`/{resource}/latest`", "`/posts/latest`", "**冲突**：两者都不更具体，注册时 panic"],
      ],
    },

    { type: "h2", text: "7. 兼容性与 GODEBUG" },
    {
      type: "p",
      text: "旧版本会把模式中的 `{` 与 `}` 当作普通字符，Go 1.22 起它们成为通配符语法。如果旧项目依赖旧行为，可以设置环境变量 `GODEBUG=httpmuxgo121=1` 恢复旧的路由规则。GODEBUG 的默认值由 go.mod 中的 go 版本决定。",
    },
    {
      type: "warn",
      text: "`mux.HandleFunc(\"/\", ...)` 会匹配所有未被其他模式匹配的路径（包括 favicon.ico 等）。只想匹配首页时，应当写成 `GET /{$}`。",
    },
  ],
  exercises: [
    "为图书 API 增加 `PUT /books/{id}`，允许修改书名。",
    "增加 `GET /books/{id}/reviews` 路由，用 r.PathValue 读取 id 并返回一段示例文字。再思考：如果增加 `GET /books/latest`，它会与 `GET /books/{id}` 冲突吗？用实验验证你的结论。",
    "使用 curl 验证 `PUT /books` 会返回 405，并观察响应头中的 Allow 字段。",
  ],
  quiz: [
    {
      q: "Go 1.22 中，哪种写法表示只匹配 GET 方法的 /posts/{id}？",
      options: ["/posts/{id} GET", "GET /posts/{id}", "/get/posts/{id}", "method(GET) /posts/{id}"],
      answer: 1,
      explain: "方法名放在路径前面，中间用空格分隔，例如 `GET /posts/{id}`。",
    },
    {
      q: "在处理函数中，应使用哪个方法读取路径参数 {id}？",
      options: ["r.Param(\"id\")", "r.URL.Query().Get(\"id\")", "r.PathValue(\"id\")", "mux.Vars(r)[\"id\"]"],
      answer: 2,
      explain: "r.PathValue 读取路由模式中定义的通配符值。查询参数（?id=）则要用 r.URL.Query()。",
    },
    {
      q: "当 /posts/latest 与 /posts/{id} 同时注册时，请求 /posts/latest 由谁处理？",
      options: ["/posts/{id}，因为它先注册", "/posts/latest，因为它更具体", "随机选择一个", "返回 500 错误"],
      answer: 1,
      explain: "Go 1.22 的优先级规则是「最具体的模式胜出」，字面量路径比通配符更具体。",
    },
  ],
  refs: [
    { title: "Go 1.22 路由增强（Routing Enhancements）", url: "https://go.dev/blog/routing-enhancements" },
    { title: "pkg.go.dev：net/http ServeMux", url: "https://pkg.go.dev/net/http#ServeMux" },
    { title: "Go 1.22 发布说明", url: "https://go.dev/doc/go1.22" },
    { title: "pkg.go.dev：slices 包", url: "https://pkg.go.dev/slices" },
  ],
};
