import type { Chapter } from "../../types";

export const ch13: Chapter = {
  id: "ch13",
  part: "第三部分：Web 开发核心",
  title: "中间件、表单与静态文件",
  summary: "理解中间件的洋葱模型，实现日志与 panic 恢复中间件，处理 HTML 表单，并用 embed 提供静态文件。",
  level: "进阶",
  minutes: 60,
  icon: "🧰",
  goals: [
    "理解中间件是「包裹 Handler 的 Handler」，并能组合多个中间件",
    "实现请求日志与 panic 恢复中间件",
    "解析 HTML 表单，并校验用户输入",
    "使用 http.FileServer 与 embed 提供静态文件",
  ],
  body: [
    { type: "h2", text: "1. 中间件：包裹处理函数的函数" },
    {
      type: "p",
      text: "中间件（middleware）是一个接收 `http.Handler`、返回新 `http.Handler` 的函数。它可以在业务处理函数执行之前或之后运行通用逻辑，例如记录日志、鉴权、限流、恢复 panic、压缩响应。多个中间件像洋葱一样层层包裹，请求由外向内穿过，响应再由内向外返回。",
    },
    {
      type: "ul",
      items: [
        "`http.HandlerFunc` 是一个适配器，可以把普通函数转换为 `http.Handler`。",
        "中间件的组合顺序很重要：`logRequests(recoverPanic(mux))` 中，请求先经过日志，再经过 panic 恢复，最后才到达路由。",
        "net/http 会为每个请求启动一个 goroutine，并在处理函数 panic 时打印堆栈、关闭该连接，因此单个请求的 panic 不会让整个服务退出。但客户端只会看到连接中断；recover 中间件可以让它收到明确的 500 响应。",
      ],
    },

    { type: "h2", text: "2. 表单处理" },
    {
      type: "p",
      text: "HTML 表单默认以 `application/x-www-form-urlencoded` 格式提交。服务端调用 `r.ParseForm()` 解析后，用 `r.PostForm.Get(\"name\")` 读取字段。`r.FormValue` 会同时读取查询参数与表单字段，使用更简便，但需要区分数据来源时应使用 `PostForm`。",
    },
    {
      type: "ul",
      items: [
        "用 `http.MaxBytesReader` 限制请求体大小，防止恶意用户提交超大数据耗尽内存。",
        "服务端必须校验所有输入：去除首尾空白、检查长度与格式。前端校验只是体验优化，不能替代服务端校验。",
        "校验失败时返回 4xx 状态码（如 422 Unprocessable Entity）并给出明确的提示。",
      ],
    },

    { type: "h2", text: "3. 静态文件" },
    {
      type: "p",
      text: "`http.FileServer` 可以直接提供目录中的 HTML、CSS、JavaScript 与图片。配合 `http.StripPrefix` 去掉 URL 前缀，再用 `http.FS` 把 `embed.FS` 当作文件系统使用，就能把静态资源打包进可执行文件，部署时只需要一个文件。",
    },

    { type: "h2", text: "4. 完整示例" },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/middleware",
      code: String.raw`package main

import (
	"embed"
	"fmt"
	"io/fs"
	"log"
	"net/http"
	"strings"
	"time"
)

//go:embed static
var staticFiles embed.FS

// logRequests 中间件：记录每个请求的方法、路径与耗时。
func logRequests(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		log.Printf("%s %s 耗时 %v", r.Method, r.URL.Path, time.Since(start))
	})
}

// recoverPanic 中间件：捕获处理函数中的 panic，返回 500 而不是中断连接。
func recoverPanic(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		defer func() {
			if v := recover(); v != nil {
				log.Printf("panic: %v", v)
				http.Error(w, "服务器内部错误", http.StatusInternalServerError)
			}
		}()
		next.ServeHTTP(w, r)
	})
}

// submitContact 处理表单提交。
func submitContact(w http.ResponseWriter, r *http.Request) {
	r.Body = http.MaxBytesReader(w, r.Body, 1<<20) // 请求体最大 1 MB
	if err := r.ParseForm(); err != nil {
		http.Error(w, "表单无效或内容过大", http.StatusBadRequest)
		return
	}
	name := strings.TrimSpace(r.PostForm.Get("name"))
	email := strings.TrimSpace(r.PostForm.Get("email"))
	if name == "" || !strings.Contains(email, "@") {
		http.Error(w, "姓名不能为空，邮箱格式不正确", http.StatusUnprocessableEntity)
		return
	}
	log.Printf("收到留言：%s <%s>", name, email)
	w.Header().Set("Content-Type", "text/plain; charset=utf-8") // 纯文本，避免用户输入被当作 HTML 执行
	fmt.Fprintf(w, "感谢你的留言，%s！我们会尽快回复。", name)
}

func main() {
	// fs.Sub 把 static 目录当作根目录使用
	sub, err := fs.Sub(staticFiles, "static")
	if err != nil {
		log.Fatal(err)
	}

	mux := http.NewServeMux()
	mux.Handle("GET /static/", http.StripPrefix("/static/", http.FileServer(http.FS(sub))))
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		http.Redirect(w, r, "/static/index.html", http.StatusFound)
	})
	mux.HandleFunc("POST /contact", submitContact)
	mux.HandleFunc("GET /boom", func(w http.ResponseWriter, r *http.Request) {
		panic("演示 panic")
	})

	// 洋葱模型：请求先经过 logRequests，再经过 recoverPanic，最后到达 mux
	handler := logRequests(recoverPanic(mux))

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           handler,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}
	log.Println("服务启动：http://localhost:8080")
	log.Fatal(srv.ListenAndServe())
}`,
    },
    {
      type: "code",
      lang: "html",
      file: "static/index.html",
      mod: "example.com/middleware",
      code: String.raw`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>首页</title></head>
<body>
  <h1>欢迎来到中间件示例</h1>
  <p><a href="/static/contact.html">联系我们</a></p>
  <p><a href="/boom">触发一次 panic（演示恢复机制）</a></p>
</body>
</html>`,
    },
    {
      type: "code",
      lang: "html",
      file: "static/contact.html",
      mod: "example.com/middleware",
      code: String.raw`<!DOCTYPE html>
<html lang="zh-CN">
<head><meta charset="utf-8"><title>联系我们</title></head>
<body>
  <h1>联系我们</h1>
  <form method="POST" action="/contact">
    <p><label>姓名 <input name="name" required></label></p>
    <p><label>邮箱 <input type="email" name="email" required></label></p>
    <p><label>留言 <textarea name="message" rows="4"></textarea></label></p>
    <button type="submit">提交</button>
  </form>
</body>
</html>`,
    },
    {
      type: "output",
      title: "用 curl 访问 /contact 与 /boom",
      text: String.raw`$ curl -X POST -d "name=Gopher&email=a@b.com" http://localhost:8080/contact
感谢你的留言，Gopher！我们会尽快回复。

$ curl -i http://localhost:8080/boom
HTTP/1.1 500 Internal Server Error
服务器内部错误`,
    },

    { type: "h2", text: "5. 超时与请求限制" },
    {
      type: "ul",
      items: [
        "`http.Server` 的 ReadTimeout、WriteTimeout 等字段限制整体连接的时间（第 9 章）。",
        "`http.TimeoutHandler(handler, 2*time.Second, \"请求超时\")` 可以为某一条路由单独设置处理时限。",
        "`http.MaxBytesReader` 限制单个请求体的大小，是防止资源耗尽的基本手段。",
      ],
    },
    {
      type: "tip",
      text: "中间件的 recover 只能捕获**当前 goroutine** 中的 panic。如果你在处理函数里又启动了新的 goroutine，那个 goroutine 中的 panic 需要在它自己内部恢复。",
    },
  ],
  exercises: [
    "新增一个计时中间件，把每个请求的耗时写入响应头 `X-Response-Time`（提示：在调用 next 之前设置头部）。",
    "为 /contact 增加简单限流：同一 IP 每分钟最多提交 5 次（提示：用 map 记录时间戳，并注意并发安全）。",
    "在 static 目录中增加 style.css，并在 index.html 中引用它，观察 /static/style.css 的响应。",
  ],
  quiz: [
    {
      q: "中间件的本质是什么？",
      options: ["一个全局变量", "接收并返回 http.Handler 的函数，用于包裹处理函数", "一个数据库连接池", "一种模板语法"],
      answer: 1,
      explain: "中间件就是 func(http.Handler) http.Handler，它可以在请求前后执行通用逻辑。",
    },
    {
      q: "为什么要用 http.MaxBytesReader 包装 r.Body？",
      options: ["加快解析速度", "限制请求体大小，防止超大请求耗尽内存", "压缩请求体", "自动解码 JSON"],
      answer: 1,
      explain: "未经限制的请求体可以无限增长，MaxBytesReader 会在超过上限时返回错误。",
    },
    {
      q: "在 http.FileServer 外层使用 http.StripPrefix 的原因是？",
      options: ["删除文件后缀", "去掉 URL 前缀，使路径能正确映射到文件系统", "加密文件内容", "强制浏览器下载文件"],
      answer: 1,
      explain: "例如 /static/a.css 需要映射为文件 a.css，StripPrefix 会先去掉 /static/ 前缀。",
    },
  ],
  refs: [
    { title: "pkg.go.dev：net/http（Handler、FileServer、MaxBytesReader）", url: "https://pkg.go.dev/net/http" },
    { title: "pkg.go.dev：io/fs", url: "https://pkg.go.dev/io/fs" },
    { title: "pkg.go.dev：embed", url: "https://pkg.go.dev/embed" },
    { title: "Go 安全最佳实践", url: "https://go.dev/doc/security/best-practices" },
  ],
};
