import type { Chapter } from "../../types";

export const ch16: Chapter = {
  id: "ch16",
  part: "第四部分：安全、风格与上线",
  title: "安全最佳实践",
  summary: "基于官方「Security Best Practices for Go Developers」，掌握漏洞扫描、常见 Web 攻击的防御，以及 Go 1.24–1.27 中的新安全能力。",
  level: "进阶",
  minutes: 75,
  icon: "🔐",
  goals: [
    "使用 govulncheck、go vet、-race 与模糊测试建立安全检查流程",
    "识别 SQL 注入、XSS、CSRF、路径穿越、命令注入等常见风险并掌握防御方法",
    "使用 http.NewCrossOriginProtection 与 os.Root 等新的安全 API",
    "正确生成随机数、存储密码和配置 TLS",
    "形成一份可以落地的安全检查清单",
  ],
  body: [
    { type: "h2", text: "1. 安全是一个系统工程" },
    {
      type: "p",
      text: "Go 语言本身具有内存安全与强类型等优势，但这并不能保证应用安全。下面的内容以官方「Security Best Practices for Go Developers」为主线，并补充了 Web 开发中的常见实践。",
    },

    { type: "h2", text: "2. 官方推荐的安全实践" },
    {
      type: "ul",
      items: [
        "**扫描漏洞**：使用 govulncheck 扫描代码与依赖。它会结合 Go 漏洞数据库，只报告程序中真正会被调用到的已知漏洞。",
        "**保持更新**：及时升级到最新的 Go 次版本，它们包含安全修复；更新依赖时也要审查变更内容。",
        "**模糊测试**：用 FuzzXxx 自动发现边界输入引发的问题（第 8 章）。",
        "**竞态检测**：在测试和 CI 中使用 `go test -race`（第 6 章）。",
        "**静态检查**：定期运行 `go vet ./...`，发现可疑的代码结构。",
        "**关注安全公告**：订阅 golang-announce 邮件列表，提前了解安全版本的发布。",
      ],
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`go install golang.org/x/vuln/cmd/govulncheck@latest
govulncheck ./...
go vet ./...
go test -race ./...`,
    },

    { type: "h2", text: "3. 常见 Web 风险与 Go 中的防御" },
    {
      type: "table",
      head: ["风险", "典型攻击方式", "防御手段"],
      rows: [
        ["SQL 注入", "把用户输入拼接进 SQL 语句", "使用占位符参数（`?`、`$1`），见第 14 章"],
        ["XSS 跨站脚本", "在页面中注入 `<script>` 标签", "使用 html/template 自动转义；不要对用户输入使用 template.HTML"],
        ["CSRF 跨站请求伪造", "诱导已登录用户在其他网站上发起请求", "Go 1.25+ 使用 http.NewCrossOriginProtection；或使用 SameSite Cookie 与 CSRF Token"],
        ["路径穿越", "输入 `../../etc/passwd` 读取任意文件", "白名单校验文件名；使用 os.Root 限制访问范围（Go 1.24+）"],
        ["拒绝服务", "超大请求体、慢速请求、恶意的复杂输入", "http.MaxBytesReader、服务器超时、限流"],
        ["信息泄露", "把错误堆栈、内部地址返回给用户", "错误写入日志，只向用户返回通用信息"],
        ["命令注入", "把用户输入拼接进 shell 命令", "使用 exec.Command 传递参数列表，避免经过 shell 解析"],
        ["弱随机与弱密码", "用 math/rand 生成令牌，明文保存密码", "用 crypto/rand 生成随机数；用 bcrypt 或 argon2 保存密码哈希"],
      ],
    },

    { type: "h2", text: "4. 示例：安全的 HTTP 服务骨架" },
    {
      type: "p",
      text: "下面的程序演示三件事：添加安全响应头；使用 Go 1.25 新增的 http.NewCrossOriginProtection 防御 CSRF（无需 Token）；配置超时与请求头大小限制。",
    },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/secure",
      code: String.raw`package main

import (
	"fmt"
	"log"
	"net/http"
	"time"
)

// securityHeaders 为每个响应添加常用的安全响应头。
func securityHeaders(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		h := w.Header()
		h.Set("X-Content-Type-Options", "nosniff")
		h.Set("X-Frame-Options", "DENY")
		h.Set("Referrer-Policy", "strict-origin-when-cross-origin")
		h.Set("Content-Security-Policy", "default-src 'self'")
		next.ServeHTTP(w, r)
	})
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "首页（安全示例）")
	})
	mux.HandleFunc("POST /transfer", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintln(w, "转账成功（示例，仅用于演示 CSRF 防护）")
	})

	// Go 1.25+：根据 Fetch Metadata 请求头（如 Sec-Fetch-Site）拒绝跨站的非安全请求，无需 Token
	csrf := http.NewCrossOriginProtection()

	srv := &http.Server{
		Addr:              ":8080",
		Handler:           securityHeaders(csrf.Handler(mux)),
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
		MaxHeaderBytes:    1 << 20,
	}
	log.Println("安全示例启动：http://localhost:8080")
	log.Fatal(srv.ListenAndServe())
}`,
    },

    { type: "h2", text: "5. 路径安全：os.Root（Go 1.24+）" },
    {
      type: "p",
      text: "当用户可以指定文件名时，最可靠的防护是把访问限制在某个目录之内。`os.OpenRoot` 返回的 Root 对象只能访问该目录下的文件，越界访问（包括借助符号链接越界）都会失败。",
    },
    {
      type: "code",
      lang: "go",
      file: "rootfs/rootfs.go",
      mod: "example.com/secure",
      code: String.raw`package rootfs

import (
	"io"
	"os"
)

// ReadUpload 只能读取 uploads 目录内的文件。
// 即使传入 "../../etc/passwd" 这样的路径，os.Root 也会拒绝越界访问。
func ReadUpload(name string) ([]byte, error) {
	root, err := os.OpenRoot("uploads")
	if err != nil {
		return nil, err
	}
	defer root.Close()

	f, err := root.Open(name)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	return io.ReadAll(f)
}`,
    },

    { type: "h2", text: "6. 其他关键代码模式" },
    {
      type: "code",
      lang: "go",
      code: String.raw`// ✗ 危险：字符串拼接 SQL
q := "SELECT * FROM users WHERE name = '" + name + "'"
// ✓ 安全：使用占位符，参数与 SQL 分开传递
rows, err := db.QueryContext(ctx, "SELECT * FROM users WHERE name = ?", name)

// ✗ 危险：经过 shell 解析，输入中的 ; 或 $() 会被执行
exec.Command("sh", "-c", "git log "+userInput)
// ✓ 安全：参数直接传给程序，不经过 shell
exec.CommandContext(ctx, "git", "log", "-n", "5")`,
    },
    {
      type: "code",
      lang: "go",
      code: String.raw`// ✓ 使用 crypto/rand 生成令牌（不要用 math/rand）
b := make([]byte, 32)
if _, err := rand.Read(b); err != nil {
	return err
}
token := base64.RawURLEncoding.EncodeToString(b)`,
    },
    {
      type: "code",
      lang: "go",
      code: String.raw`// ✓ 生产环境使用 TLS，并禁止过旧的协议版本
srv := &http.Server{
	Addr:      ":8443",
	TLSConfig: &tls.Config{MinVersion: tls.VersionTLS12},
}
log.Fatal(srv.ListenAndServeTLS("cert.pem", "key.pem"))`,
    },
    {
      type: "note",
      title: "Go 1.27 新增：后量子签名",
      text: "Go 1.27 新增 crypto/mldsa 包，实现了后量子签名算法 ML-DSA（FIPS 204），并已集成到 crypto/x509 与 crypto/tls 中。",
    },

    { type: "h2", text: "7. 安全检查清单" },
    {
      type: "ol",
      items: [
        "所有外部输入都经过校验（长度、格式、取值范围）。",
        "数据库只使用参数化查询，从不拼接 SQL。",
        "页面输出使用 html/template，不把用户输入当作可信 HTML。",
        "HTTP 服务器设置超时，并限制请求体与请求头的大小。",
        "密码使用 bcrypt 或 argon2 哈希存储，令牌使用 crypto/rand 生成。",
        "密钥与口令通过环境变量或密钥管理服务注入，绝不提交到代码仓库。",
        "生产环境关闭调试与性能分析接口，或限制其访问来源。",
        "定期运行 govulncheck 与 go vet，并保持 Go 版本与依赖更新。",
      ],
    },
    {
      type: "warn",
      text: "安全没有一劳永逸的方案。请把上面的检查项放进 CI 流程，并在每次发布前重新检查。",
    },
  ],
  exercises: [
    "为 /transfer 编写测试：构造一个 Sec-Fetch-Site 为 cross-site 的 POST 请求，验证它会被拒绝。",
    "运行 `govulncheck ./...` 并阅读报告，理解每个漏洞的「调用路径」意味着什么。",
    "去掉服务器的超时设置，思考慢速攻击为什么能够耗尽服务器的连接资源。",
  ],
  quiz: [
    {
      q: "防止 SQL 注入最推荐的做法是？",
      options: ["对用户输入做字符串替换", "使用参数化查询（占位符）", "关闭数据库日志", "改用 GET 请求"],
      answer: 1,
      explain: "参数化查询把 SQL 结构与数据分开，数据库不会把参数当作 SQL 代码执行。",
    },
    {
      q: "html/template 默认会对输出做什么？",
      options: ["不做任何处理", "根据输出位置自动转义", "删除所有 HTML 标签", "压缩 HTML"],
      answer: 1,
      explain: "html/template 会根据上下文（HTML 正文、属性、JS、CSS、URL）自动选择转义方式。",
    },
    {
      q: "Go 1.25 引入的 http.NewCrossOriginProtection 主要用于？",
      options: ["压缩响应数据", "防止跨站请求伪造（CSRF）", "记录访问日志", "管理用户会话"],
      answer: 1,
      explain: "它基于浏览器提供的 Fetch Metadata 请求头判断请求来源，拒绝不安全的跨站请求，无需 Token。",
    },
  ],
  refs: [
    { title: "安全最佳实践（Security Best Practices for Go Developers）", url: "https://go.dev/doc/security/best-practices" },
    { title: "漏洞管理（Vulnerability Management）", url: "https://go.dev/doc/security/vuln/" },
    { title: "Tutorial: Getting started with govulncheck", url: "https://go.dev/doc/tutorial/govulncheck" },
    { title: "Tutorial: Getting started with fuzzing", url: "https://go.dev/doc/tutorial/fuzz" },
    { title: "pkg.go.dev：net/http CrossOriginProtection", url: "https://pkg.go.dev/net/http#CrossOriginProtection" },
    { title: "pkg.go.dev：os.Root", url: "https://pkg.go.dev/os#Root" },
  ],
};
