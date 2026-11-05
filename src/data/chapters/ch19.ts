import type { Chapter } from "../../types";

export const ch19: Chapter = {
  id: "ch19",
  part: "第四部分：安全、风格与上线",
  title: "综合实战：待办事项（Todo）Web 应用",
  summary: "把全部知识串联起来：分层的模块结构、SQLite 数据层、路由与模板、中间件、日志、测试与优雅关闭，完成一个可以运行的完整应用。",
  level: "实战",
  minutes: 150,
  icon: "🏆",
  goals: [
    "按照 cmd/ 与 internal/ 的分层方式组织一个完整的 Go Web 项目",
    "使用 SQLite 与 database/sql 实现增删改查，并编写数据层测试",
    "使用路由模式、html/template 与 embed 完成页面渲染",
    "编写日志与 panic 恢复中间件，并用 httptest 测试 HTTP 层",
    "通过环境变量配置程序，并实现优雅关闭",
  ],
  body: [
    { type: "h2", text: "1. 项目概览" },
    {
      type: "p",
      text: "这是本教程的综合实战：一个带数据库的待办事项（Todo）应用。它会用到前面每一章的知识，包括模块布局（第 7 章）、测试（第 8 章）、路由（第 10 章）、模板（第 11 章）、中间件与表单（第 13 章）、数据库（第 14 章）、日志（第 15 章）、安全（第 16 章）以及部署（第 18 章）。",
    },
    {
      type: "table",
      head: ["功能", "路由", "说明"],
      rows: [
        ["查看待办列表", "`GET /`", "显示全部待办事项，以及已完成的数量"],
        ["新增待办", "`POST /todos`", "表单提交，校验标题不能为空且不超过 200 个字符"],
        ["切换完成状态", "`POST /todos/{id}/toggle`", "在「已完成」与「未完成」之间切换"],
        ["删除待办", "`POST /todos/{id}/delete`", "删除一条记录，不存在时返回 404"],
        ["健康检查", "`GET /healthz`", "返回 ok，供部署平台检测服务是否存活"],
      ],
    },

    { type: "h2", text: "2. 项目结构" },
    {
      type: "code",
      lang: "text",
      code: String.raw`todo/
├── go.mod
├── cmd/
│   └── todo/
│       └── main.go            # 入口：读取配置、组装依赖、启动与优雅关闭
└── internal/
    ├── store/
    │   ├── store.go           # 数据访问层：SQLite 的增删改查
    │   └── store_test.go      # 数据层测试（每个测试使用独立的临时数据库）
    └── web/
        ├── server.go          # 路由与处理函数
        ├── middleware.go      # 请求日志与 panic 恢复
        ├── server_test.go     # HTTP 层测试
        └── templates/
            ├── layout.html    # 页面骨架
            └── index.html     # 首页内容`,
    },
    {
      type: "p",
      text: "分层的思路很简单：**cmd** 只负责组装；**web** 负责与 HTTP 相关的工作，如解析请求、渲染模板、写响应；**store** 只关心数据。这样数据层可以独立测试，将来更换数据库时，也只需要修改 store 包。",
    },

    { type: "h2", text: "3. 第一步：创建模块并安装依赖" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`mkdir todo && cd todo
go mod init example.com/todo
go get modernc.org/sqlite   # 纯 Go 实现的 SQLite 驱动，无需 CGO 与外部数据库
go mod tidy`,
    },

    { type: "h2", text: "4. 数据层：store" },
    {
      type: "code",
      lang: "go",
      file: "internal/store/store.go",
      mod: "example.com/todo",
      code: String.raw`package store

import (
	"context"
	"database/sql"
	"errors"
	"fmt"

	_ "modernc.org/sqlite" // SQLite 驱动（纯 Go 实现，无需 CGO）
)

// ErrNotFound 表示记录不存在。
var ErrNotFound = errors.New("待办事项不存在")

// Todo 是一条待办事项。
type Todo struct {
	ID    int64
	Title string
	Done  bool
}

// Store 封装所有数据库操作。
type Store struct {
	db *sql.DB
}

const schema = "CREATE TABLE IF NOT EXISTS todos (id INTEGER PRIMARY KEY AUTOINCREMENT, title TEXT NOT NULL, done INTEGER NOT NULL DEFAULT 0)"

// Open 打开（或创建）SQLite 数据库文件，并初始化表结构。
func Open(ctx context.Context, path string) (*Store, error) {
	db, err := sql.Open("sqlite", path)
	if err != nil {
		return nil, err
	}
	// SQLite 同一时间只允许一个写入者，限制连接数可以避免 "database is locked"
	db.SetMaxOpenConns(1)
	if _, err := db.ExecContext(ctx, schema); err != nil {
		db.Close()
		return nil, fmt.Errorf("初始化表结构: %w", err)
	}
	return &Store{db: db}, nil
}

// Close 关闭数据库连接池。
func (s *Store) Close() error {
	return s.db.Close()
}

// List 返回所有待办事项（最新的在前）。
func (s *Store) List(ctx context.Context) ([]Todo, error) {
	rows, err := s.db.QueryContext(ctx, "SELECT id, title, done FROM todos ORDER BY id DESC")
	if err != nil {
		return nil, fmt.Errorf("查询待办: %w", err)
	}
	defer rows.Close()

	var todos []Todo
	for rows.Next() {
		var t Todo
		var done int
		if err := rows.Scan(&t.ID, &t.Title, &done); err != nil {
			return nil, fmt.Errorf("读取待办: %w", err)
		}
		t.Done = done == 1
		todos = append(todos, t)
	}
	return todos, rows.Err()
}

// Add 新增待办事项，并返回它的 ID。
func (s *Store) Add(ctx context.Context, title string) (int64, error) {
	res, err := s.db.ExecContext(ctx, "INSERT INTO todos (title) VALUES (?)", title)
	if err != nil {
		return 0, fmt.Errorf("新增待办: %w", err)
	}
	return res.LastInsertId()
}

// Toggle 切换完成状态。
func (s *Store) Toggle(ctx context.Context, id int64) error {
	return s.exec(ctx, "UPDATE todos SET done = 1 - done WHERE id = ?", id)
}

// Delete 删除待办事项。
func (s *Store) Delete(ctx context.Context, id int64) error {
	return s.exec(ctx, "DELETE FROM todos WHERE id = ?", id)
}

// exec 执行修改语句，并检查是否真的影响了一行记录。
func (s *Store) exec(ctx context.Context, query string, args ...any) error {
	res, err := s.db.ExecContext(ctx, query, args...)
	if err != nil {
		return fmt.Errorf("执行 SQL: %w", err)
	}
	n, err := res.RowsAffected()
	if err != nil {
		return err
	}
	if n == 0 {
		return ErrNotFound
	}
	return nil
}`,
    },
    {
      type: "code",
      lang: "go",
      file: "internal/store/store_test.go",
      mod: "example.com/todo",
      code: String.raw`package store

import (
	"context"
	"errors"
	"path/filepath"
	"testing"
)

// newTestStore 为每个测试创建独立的临时数据库。
func newTestStore(t *testing.T) *Store {
	t.Helper()
	s, err := Open(context.Background(), filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	t.Cleanup(func() { s.Close() })
	return s
}

func TestAddAndList(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)

	id, err := s.Add(ctx, "学习 Go")
	if err != nil {
		t.Fatal(err)
	}
	todos, err := s.List(ctx)
	if err != nil {
		t.Fatal(err)
	}
	if len(todos) != 1 || todos[0].ID != id || todos[0].Title != "学习 Go" || todos[0].Done {
		t.Fatalf("List() = %+v，结果不符合预期", todos)
	}
}

func TestToggleAndDelete(t *testing.T) {
	ctx := context.Background()
	s := newTestStore(t)
	id, _ := s.Add(ctx, "写测试")

	if err := s.Toggle(ctx, id); err != nil {
		t.Fatal(err)
	}
	todos, _ := s.List(ctx)
	if !todos[0].Done {
		t.Error("Toggle 之后应该为已完成")
	}

	if err := s.Delete(ctx, id); err != nil {
		t.Fatal(err)
	}
	if err := s.Delete(ctx, id); !errors.Is(err, ErrNotFound) {
		t.Errorf("重复删除应返回 ErrNotFound，实际为: %v", err)
	}
}`,
    },

    { type: "h2", text: "5. Web 层：路由、处理函数与中间件" },
    {
      type: "p",
      text: "Web 层的核心约定有三点：所有页面都先渲染到缓冲区再写入响应；所有错误都记录详细日志，但只向用户返回通用信息；表单提交成功后使用 303 See Other 重定向（POST-Redirect-GET），防止刷新页面时重复提交。",
    },
    {
      type: "code",
      lang: "go",
      file: "internal/web/middleware.go",
      mod: "example.com/todo",
      code: String.raw`package web

import (
	"log/slog"
	"net/http"
	"time"
)

// statusRecorder 记录响应的状态码，供日志中间件使用。
type statusRecorder struct {
	http.ResponseWriter
	status int
}

func (r *statusRecorder) WriteHeader(code int) {
	r.status = code
	r.ResponseWriter.WriteHeader(code)
}

// logRequests 记录每个请求的方法、路径、状态码与耗时。
func logRequests(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		rec := &statusRecorder{ResponseWriter: w, status: http.StatusOK}
		next.ServeHTTP(rec, r)
		logger.Info("请求完成",
			"method", r.Method,
			"path", r.URL.Path,
			"status", rec.status,
			"duration", time.Since(start),
		)
	})
}

// recoverPanic 捕获 panic，防止单个请求导致整个服务崩溃。
func recoverPanic(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				logger.Error("捕获到 panic", "panic", v)
				http.Error(w, "服务器内部错误", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}`,
    },
    {
      type: "code",
      lang: "go",
      file: "internal/web/server.go",
      mod: "example.com/todo",
      code: String.raw`package web

import (
	"bytes"
	"context"
	"embed"
	"errors"
	"html/template"
	"log/slog"
	"net/http"
	"strconv"
	"strings"

	"example.com/todo/internal/store"
)

//go:embed templates/*.html
var templateFS embed.FS

var tmpl = template.Must(template.ParseFS(templateFS, "templates/*.html"))

// Server 持有依赖（数据存储与日志），负责处理所有 HTTP 请求。
type Server struct {
	store *store.Store
	log   *slog.Logger
}

func NewServer(st *store.Store, logger *slog.Logger) *Server {
	return &Server{store: st, log: logger}
}

// Routes 注册路由，并套上中间件。
func (s *Server) Routes() http.Handler {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", s.handleIndex)
	mux.HandleFunc("POST /todos", s.handleCreate)
	mux.HandleFunc("POST /todos/{id}/toggle", s.handleToggle)
	mux.HandleFunc("POST /todos/{id}/delete", s.handleDelete)
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("ok"))
	})
	return recoverPanic(s.log, logRequests(s.log, mux))
}

// indexPage 是首页模板的数据。
type indexPage struct {
	Todos    []store.Todo
	Total    int
	Finished int
}

func (s *Server) handleIndex(w http.ResponseWriter, r *http.Request) {
	todos, err := s.store.List(r.Context())
	if err != nil {
		s.serverError(w, err)
		return
	}
	page := indexPage{Todos: todos, Total: len(todos)}
	for _, t := range todos {
		if t.Done {
			page.Finished++
		}
	}

	var buf bytes.Buffer
	if err := tmpl.ExecuteTemplate(&buf, "layout", page); err != nil {
		s.serverError(w, err)
		return
	}
	w.Header().Set("Content-Type", "text/html; charset=utf-8")
	buf.WriteTo(w)
}

func (s *Server) handleCreate(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 4<<10) // 表单最大 4 KB
	if err := r.ParseForm(); err != nil {
		http.Error(w, "请求无效", http.StatusBadRequest)
		return
	}
	title := strings.TrimSpace(r.PostForm.Get("title"))
	if title == "" || len([]rune(title)) > 200 {
		http.Error(w, "标题不能为空，且不超过 200 个字符", http.StatusUnprocessableEntity)
		return
	}
	id, err := s.store.Add(r.Context(), title)
	if err != nil {
		s.serverError(w, err)
		return
	}
	s.log.InfoContext(r.Context(), "新增待办", "id", id)
	http.Redirect(w, r, "/", http.StatusSeeOther) // PRG 模式：避免刷新页面时重复提交
}

func (s *Server) handleToggle(w http.ResponseWriter, r *http.Request) {
	s.mutate(w, r, s.store.Toggle)
}

func (s *Server) handleDelete(w http.ResponseWriter, r *http.Request) {
	s.mutate(w, r, s.store.Delete)
}

// mutate 解析路径参数 {id} 并执行修改操作，供切换与删除共用。
func (s *Server) mutate(w http.ResponseWriter, r *http.Request, op func(context.Context, int64) error) {
	id, err := strconv.ParseInt(r.PathValue("id"), 10, 64)
	if err != nil {
		http.NotFound(w, r)
		return
	}
	if err := op(r.Context(), id); err != nil {
		if errors.Is(err, store.ErrNotFound) {
			http.NotFound(w, r)
			return
		}
		s.serverError(w, err)
		return
	}
	http.Redirect(w, r, "/", http.StatusSeeOther)
}

// serverError 记录详细错误，但只向用户返回通用信息，不泄露内部细节。
func (s *Server) serverError(w http.ResponseWriter, err error) {
	s.log.Error("服务器内部错误", "err", err)
	http.Error(w, "服务器内部错误，请稍后再试", http.StatusInternalServerError)
}`,
    },
    {
      type: "code",
      lang: "go",
      file: "internal/web/server_test.go",
      mod: "example.com/todo",
      code: String.raw`package web

import (
	"context"
	"io"
	"log/slog"
	"net/http"
	"net/http/httptest"
	"path/filepath"
	"strings"
	"testing"

	"example.com/todo/internal/store"
)

func TestCreateValidation(t *testing.T) {
	st, err := store.Open(context.Background(), filepath.Join(t.TempDir(), "test.db"))
	if err != nil {
		t.Fatal(err)
	}
	defer st.Close()

	logger := slog.New(slog.NewTextHandler(io.Discard, nil)) // 测试时丢弃日志输出
	handler := NewServer(st, logger).Routes()

	// 只包含空白的标题应返回 422
	req := httptest.NewRequest(http.MethodPost, "/todos", strings.NewReader("title=+++"))
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	rec := httptest.NewRecorder()
	handler.ServeHTTP(rec, req)

	if rec.Code != http.StatusUnprocessableEntity {
		t.Errorf("状态码 = %d，期望 %d", rec.Code, http.StatusUnprocessableEntity)
	}
}`,
    },
    {
      type: "code",
      lang: "html",
      file: "internal/web/templates/layout.html",
      mod: "example.com/todo",
      code: String.raw`{{define "layout"}}
<!DOCTYPE html>
<html lang="zh-CN">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>待办事项 · Go Web 实战</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 640px; margin: 40px auto; padding: 0 16px; color: #1e293b; }
    h1 { color: #0e7490; }
    form.add { display: flex; gap: 8px; }
    input[name=title] { flex: 1; padding: 8px 12px; border: 1px solid #cbd5e1; border-radius: 8px; }
    button { padding: 8px 14px; border: 0; border-radius: 8px; background: #0891b2; color: #fff; cursor: pointer; }
    button.ghost { background: #e2e8f0; color: #334155; }
    ul.list { list-style: none; padding: 0; }
    ul.list li { display: flex; align-items: center; gap: 8px; padding: 10px 0; border-bottom: 1px solid #e2e8f0; }
    li.done span { text-decoration: line-through; color: #94a3b8; }
    li span { flex: 1; }
    form.inline { margin: 0; }
  </style>
</head>
<body>
  <h1>📝 待办事项</h1>
  {{template "content" .}}
</body>
</html>
{{end}}`,
    },
    {
      type: "code",
      lang: "html",
      file: "internal/web/templates/index.html",
      mod: "example.com/todo",
      code: String.raw`{{define "content"}}
<form class="add" method="POST" action="/todos">
  <input name="title" placeholder="要做什么？" maxlength="200" required autofocus>
  <button type="submit">添加</button>
</form>

<p>共 {{.Total}} 项，已完成 {{.Finished}} 项</p>

<ul class="list">
{{- range .Todos}}
  <li class="{{if .Done}}done{{end}}">
    <form class="inline" method="POST" action="/todos/{{.ID}}/toggle">
      <button class="ghost" type="submit">{{if .Done}}撤销{{else}}完成{{end}}</button>
    </form>
    <span>{{.Title}}</span>
    <form class="inline" method="POST" action="/todos/{{.ID}}/delete">
      <button class="ghost" type="submit">删除</button>
    </form>
  </li>
{{- else}}
  <li>还没有待办，先添加一个吧！</li>
{{- end}}
</ul>
{{end}}`,
    },

    { type: "h2", text: "6. 程序入口：组装与优雅关闭" },
    {
      type: "p",
      text: "入口文件只做三件事：读取环境变量配置、创建依赖（数据库与日志）、启动服务并在收到退出信号时优雅关闭。业务逻辑都不在这里。",
    },
    {
      type: "code",
      lang: "go",
      file: "cmd/todo/main.go",
      mod: "example.com/todo",
      code: String.raw`package main

import (
	"context"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"

	"example.com/todo/internal/store"
	"example.com/todo/internal/web"
)

func main() {
	logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
	if err := run(logger); err != nil {
		logger.Error("程序异常退出", "err", err)
		os.Exit(1)
	}
}

func run(logger *slog.Logger) error {
	// 配置通过环境变量读取，并提供默认值
	dbPath := getenv("TODO_DB", "todo.db")
	addr := ":" + getenv("PORT", "8080")

	// Ctrl+C 或 SIGTERM 时取消 ctx，触发优雅关闭
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	st, err := store.Open(ctx, dbPath)
	if err != nil {
		return err
	}
	defer st.Close()

	srv := &http.Server{
		Addr:              addr,
		Handler:           web.NewServer(st, logger).Routes(),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	errCh := make(chan error, 1)
	go func() {
		logger.Info("服务启动", "addr", addr, "db", dbPath)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh: // 服务启动失败或异常退出
		return err
	case <-ctx.Done(): // 收到退出信号
	}

	logger.Info("收到退出信号，开始优雅关闭")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	return srv.Shutdown(shutdownCtx)
}

func getenv(key, fallback string) string {
	if v := os.Getenv(key); v != "" {
		return v
	}
	return fallback
}`,
    },

    { type: "h2", text: "7. 运行与测试" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`go test ./...          # 运行全部测试
go run ./cmd/todo        # 启动服务，打开 http://localhost:8080
PORT=9000 go run ./cmd/todo   # 通过环境变量更换端口`,
    },
    {
      type: "output",
      title: "go test ./... 的输出",
      text: String.raw`?       example.com/todo/cmd/todo        [no test files]
ok      example.com/todo/internal/store  0.25s
ok      example.com/todo/internal/web    0.08s`,
    },
    {
      type: "output",
      title: "服务日志（JSON 格式，节选）",
      text: String.raw`{"time":"2026-10-01T12:00:00Z","level":"INFO","msg":"服务启动","addr":":8080","db":"todo.db"}
{"time":"2026-10-01T12:00:05Z","level":"INFO","msg":"新增待办","id":1}
{"time":"2026-10-01T12:00:05Z","level":"INFO","msg":"请求完成","method":"POST","path":"/todos","status":303,"duration":1830000}`,
    },
    {
      type: "tip",
      text: "用浏览器打开 http://localhost:8080 ，添加几条待办并尝试切换与删除。数据保存在 todo.db 文件中，重启服务后依然存在。也可以用 `curl -X POST -d \"title=学习 Go\" http://localhost:8080/todos` 添加待办。",
    },

    { type: "h2", text: "8. 回顾与扩展方向" },
    {
      type: "ul",
      items: [
        "**分层**：cmd 只组装依赖，web 只处理 HTTP，store 只处理数据。每一层都可以单独测试与替换。",
        "**错误**：底层错误用 `%w` 包装，store 返回哨兵错误 ErrNotFound，web 层把它转换为 404。",
        "**安全**：所有 SQL 使用占位符；模板自动转义；表单限制大小；错误细节只写入日志。",
        "**扩展**：编辑标题、按完成状态筛选、增加 JSON 接口（第 9 章）、用户登录与 CSRF 防护（第 16 章）、部署到服务器（第 18 章）。",
      ],
    },
  ],
  exercises: [
    "增加编辑功能：`POST /todos/{id}/edit` 接收新标题并更新数据库，同时补充对应的 store 方法与测试。",
    "增加筛选功能：`GET /?filter=done` 只显示已完成的待办。提示：在 SQL 中加入 WHERE 条件，并保持使用占位符。",
    "为 store.List 增加测试，验证返回顺序是「最新的在前」。",
    "参考第 18 章编写 Dockerfile，构建镜像并通过环境变量 TODO_DB 指定数据库文件的位置。",
    "为 /todos 增加 JSON 版本：请求头 Accept 为 application/json 时返回 JSON 数组（参考第 9 章）。",
  ],
  quiz: [
    {
      q: "为什么把 internal/ 作为项目的主要目录之一？",
      options: [
        "为了让代码运行更快",
        "防止外部模块依赖实现细节，便于之后重构",
        "internal 目录会自动生成文档",
        "internal 可以绕过 go.mod 的限制",
      ],
      answer: 1,
      explain: "internal 下的包不能被其他模块导入，因此可以放心地修改内部实现，而不破坏外部使用者。",
    },
    {
      q: "为什么表单处理成功后要使用 303 See Other 进行重定向？",
      options: ["让浏览器缓存页面", "防止刷新页面时重复提交表单", "减少服务器负载", "为了支持 HTTP/2"],
      answer: 1,
      explain: "这就是 POST-Redirect-GET 模式：POST 之后重定向到 GET 页面，刷新时只会重新 GET，不会重复提交。",
    },
    {
      q: "store 层为什么把 SQLite 的最大连接数设为 1？",
      options: [
        "SQLite 同一时间只允许一个写入者，限制连接数可以避免 database is locked 错误",
        "为了提高并发性能",
        "为了节省内存",
        "这是 modernc.org/sqlite 的硬性要求",
      ],
      answer: 0,
      explain: "SQLite 使用文件锁，多个连接同时写入时容易冲突。限制为 1 个连接可以让写入顺序执行，避免锁错误。",
    },
  ],
  refs: [
    { title: "官方的项目/模块布局指南", url: "https://go.dev/doc/modules/layout" },
    { title: "访问关系型数据库（Accessing a relational database）", url: "https://go.dev/doc/tutorial/database-access" },
    { title: "Go 1.22 路由增强（Routing Enhancements）", url: "https://go.dev/blog/routing-enhancements" },
    { title: "pkg.go.dev：html/template", url: "https://pkg.go.dev/html/template" },
    { title: "Go 博客：Structured logging with slog", url: "https://go.dev/blog/slog" },
    { title: "Tutorial: Developing a RESTful API with Go and Gin（进阶参考）", url: "https://go.dev/doc/tutorial/web-service-gin" },
  ],
};
