import type { Chapter } from "../../types";

// 反引号在模板字符串中需要转义，这里用占位符插入，便于书写 Go 结构体标签
const BT = "`";

export const ch09: Chapter = {
  id: "ch09",
  part: "第三部分：Web 开发核心",
  title: "net/http：编写第一个 Web 服务",
  summary: "用标准库 net/http 搭建 HTTP 服务、处理请求并返回 JSON，然后为处理函数编写测试，并配置生产级超时。",
  level: "入门",
  minutes: 60,
  icon: "🌐",
  goals: [
    "理解 HTTP 请求与响应的基本组成",
    "编写处理函数（handler），并使用 http.ServeMux 注册路由",
    "读取查询参数，返回 JSON 响应",
    "使用 httptest 测试处理函数",
    "为 http.Server 配置超时，避免慢速攻击耗尽资源",
  ],
  body: [
    { type: "h2", text: "1. HTTP 基础回顾" },
    {
      type: "ul",
      items: [
        "**请求（Request）**：包含方法（GET、POST、PUT、DELETE 等）、路径（如 /api/hello）、查询参数（如 ?name=Go）、请求头与请求体。",
        "**响应（Response）**：包含状态码（200 成功、404 未找到、500 服务器错误）、响应头（如 Content-Type）与响应体。",
        "Go 的 net/http 标准库足以构建生产级的 Web 服务，不依赖任何第三方框架；框架只是在此基础上提供额外的便利。",
      ],
    },

    { type: "h2", text: "2. 第一个 Web 服务" },
    {
      type: "p",
      text: "net/http 的核心是**处理函数（handler）**，签名为 `func(w http.ResponseWriter, r *http.Request)`：`w` 用来写响应，`r` 保存请求的全部信息。`http.NewServeMux()` 创建路由器，`mux.HandleFunc` 把路径映射到处理函数上。",
    },

    { type: "h2", text: "3. 读取参数与返回 JSON" },
    {
      type: "ul",
      items: [
        "用 `r.URL.Query().Get(\"name\")` 读取查询参数，没有该参数时返回空字符串。",
        "`w.Header().Set(...)` 设置响应头，必须在写入响应体之前调用。",
        "`json.NewEncoder(w).Encode(v)` 把结构体编码为 JSON 并直接写入响应。",
        `结构体字段的 JSON 名称由标签 ${BT}json:"text"${BT} 决定，只有首字母大写（导出）的字段才会被编码。`,
      ],
    },
    {
      type: "note",
      title: "Go 1.27 变化",
      text: "encoding/json 的底层已切换为 v2 实现，速度更快；v1 的 API 与行为保持兼容，但部分错误信息的文本可能变化。",
    },

    { type: "h2", text: "4. 完整示例" },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/hello-web",
      code: String.raw`package main

import (
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"
)

type Message struct {
	Text string ${BT}json:"text"${BT}
	Time string ${BT}json:"time"${BT}
}

// home 处理首页请求。
func home(w http.ResponseWriter, r *http.Request) {
	w.Header().Set("Content-Type", "text/plain; charset=utf-8")
	fmt.Fprintln(w, "欢迎来到 Go Web 服务器！试试访问 /api/hello?name=Go")
}

// hello 返回 JSON 格式的问候语。
func hello(w http.ResponseWriter, r *http.Request) {
	name := r.URL.Query().Get("name")
	if name == "" {
		name = "世界"
	}
	msg := Message{
		Text: "你好, " + name + "!",
		Time: time.Now().Format(time.DateTime),
	}
	w.Header().Set("Content-Type", "application/json; charset=utf-8")
	if err := json.NewEncoder(w).Encode(msg); err != nil {
		log.Printf("JSON 编码失败: %v", err)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/", home)
	mux.HandleFunc("/api/hello", hello)

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second, // 防止慢速请求头攻击
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      10 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	log.Println("服务器启动：http://localhost:8080")
	log.Fatal(srv.ListenAndServe())
}`,
    },
    { type: "code", lang: "bash", code: String.raw`go run .
curl "http://localhost:8080/api/hello?name=Go"` },
    {
      type: "output",
      title: "curl 的响应（时间会随运行时刻变化）",
      text: String.raw`{"text":"你好, Go!","time":"2026-10-01 12:00:00"}`,
    },

    { type: "h2", text: "5. 为处理函数编写测试" },
    {
      type: "p",
      text: "处理函数只是普通的函数，可以直接用 httptest 测试：`httptest.NewRequest` 构造请求，`httptest.NewRecorder` 记录响应，无需启动真实服务器。",
    },
    {
      type: "code",
      lang: "go",
      file: "main_test.go",
      mod: "example.com/hello-web",
      code: String.raw`package main

import (
	"encoding/json"
	"net/http"
	"net/http/httptest"
	"testing"
)

func TestHello(t *testing.T) {
	req := httptest.NewRequest(http.MethodGet, "/api/hello?name=Go", nil)
	rec := httptest.NewRecorder()

	hello(rec, req)

	if rec.Code != http.StatusOK {
		t.Fatalf("状态码 = %d，期望 200", rec.Code)
	}
	var msg Message
	if err := json.NewDecoder(rec.Body).Decode(&msg); err != nil {
		t.Fatalf("解析 JSON 失败: %v", err)
	}
	if msg.Text != "你好, Go!" {
		t.Errorf("Text = %q，期望 %q", msg.Text, "你好, Go!")
	}
}`,
    },
    { type: "code", lang: "bash", code: String.raw`go test ./...` },

    { type: "h2", text: "6. 生产环境的服务器配置" },
    {
      type: "p",
      text: "直接调用 `http.ListenAndServe` 使用的是默认配置，没有任何超时限制，恶意客户端可以故意慢慢发送数据，长期占用连接。因此应当创建 `http.Server` 并显式设置超时：",
    },
    {
      type: "ul",
      items: [
        "`ReadHeaderTimeout`：读取请求头的时限，专门用于防御慢速攻击（Slowloris）。",
        "`ReadTimeout` / `WriteTimeout`：读取整个请求、写入整个响应的时限。",
        "`IdleTimeout`：keep-alive 连接空闲多久后关闭。",
        "`MaxHeaderBytes`：限制请求头的最大字节数（默认 1 MB）。",
      ],
    },
    {
      type: "warn",
      text: "不要在生产代码中直接使用 `http.ListenAndServe(\":8080\", nil)` 而不设置超时。第 18 章还会介绍如何实现优雅关闭。",
    },
  ],
  exercises: [
    "新增 `/api/time` 路由，返回包含当前时间的 JSON。",
    "让 /api/hello 同时支持 POST 请求：从 JSON 请求体中读取 name（提示：使用 `json.NewDecoder(r.Body).Decode`）。",
    "为 hello 处理函数增加一个测试：没有传入 name 参数时，应返回「你好, 世界!」。",
  ],
  quiz: [
    {
      q: "net/http 中处理请求的函数签名是？",
      options: [
        "func(req Request)",
        "func(w http.ResponseWriter, r *http.Request)",
        "func(ctx Context)",
        "func(c *gin.Context)",
      ],
      answer: 1,
      explain: "ResponseWriter 用于写响应，*http.Request 用于读取请求信息。",
    },
    {
      q: "为什么生产环境应当为 http.Server 设置 ReadHeaderTimeout？",
      options: ["让页面加载更快", "防止客户端长时间慢速发送请求头，耗尽服务器连接", "自动启用 HTTPS", "压缩响应体"],
      answer: 1,
      explain: "没有超时限制时，恶意客户端可以长期占用连接，导致正常请求无法被处理。",
    },
    {
      q: "在处理函数中，应在什么时候设置响应头？",
      options: ["写入响应体之后", "写入响应体之前", "只能在 main 函数中设置", "随时都可以"],
      answer: 1,
      explain: "响应头必须在写入第一个字节的响应体之前设置，否则会被忽略。",
    },
  ],
  refs: [
    { title: "标准库 net/http", url: "https://pkg.go.dev/net/http" },
    { title: "pkg.go.dev：encoding/json", url: "https://pkg.go.dev/encoding/json" },
    { title: "pkg.go.dev：net/http/httptest", url: "https://pkg.go.dev/net/http/httptest" },
    { title: "Go 1.27 发布说明", url: "https://go.dev/doc/go1.27" },
  ],
};
