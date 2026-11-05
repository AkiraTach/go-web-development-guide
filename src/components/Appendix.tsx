import CodeBlock from "./CodeBlock";
import { officialTutorials, releaseDocs } from "../data/official";
import type { Lang } from "../types";

const SHEETS: { title: string; lang: Lang; code: string }[] = [
  {
    title: "模块与常用命令",
    lang: "bash",
    code: String.raw`go mod init example.com/app   # 创建模块
go mod tidy                   # 同步依赖（增删 go.mod / go.sum）
go get example.com/pkg@latest # 添加或升级依赖
go run .                      # 编译并运行当前包
go build -o app ./cmd/app     # 编译生成可执行文件
go install ./cmd/app          # 安装到 GOBIN
go test -v -race ./...        # 运行测试并检测数据竞争
go vet ./...                  # 静态检查
go fmt ./...                  # 格式化代码
go fix ./...                  # 应用现代化改写（modernizers）
govulncheck ./...             # 扫描已知漏洞（需先安装）`,
  },
  {
    title: "基础语法",
    lang: "go",
    code: String.raw`var name string = "Go"   // 变量（完整写法）
age := 15                // 短变量声明（只能在函数内使用）
const Pi = 3.14          // 常量
for i := range 3 { }     // Go 1.22+：遍历整数 0、1、2
for k, v := range m { }  // 遍历 map / slice / string
switch { case x > 0: }   // 无条件 switch（默认不贯穿）
defer f.Close()          // 函数返回前执行（后进先出）
p := new(42)             // Go 1.26+：new 可直接接受初始值`,
  },
  {
    title: "错误、接口与并发",
    lang: "go",
    code: String.raw`if err != nil {
	return fmt.Errorf("读取失败: %w", err) // 包装错误
}
errors.Is(err, ErrNotFound)         // 错误链中是否包含某个错误
var ve *ValidationError
errors.As(err, &ve)                 // 提取某种类型的错误
type Shape interface{ Area() float64 } // 隐式实现接口

go worker(jobs, results)            // 启动 goroutine
ch := make(chan int, 10)            // 带缓冲的 channel
v, ok := <-ch                       // ok 为 false 表示 channel 已关闭
select { case <-ctx.Done(): return } // 多路复用与取消
var wg sync.WaitGroup; wg.Go(f)     // Go 1.25+`,
  },
  {
    title: "net/http：服务与路由",
    lang: "go",
    code: String.raw`mux := http.NewServeMux()
mux.HandleFunc("GET /users/{id}", h)   // 方法 + 路径参数
id := r.PathValue("id")                // 读取路径参数
q := r.URL.Query().Get("q")            // 读取查询参数
r.ParseForm(); r.PostForm.Get("name")  // 读取表单
w.Header().Set("Content-Type", "application/json")
w.WriteHeader(http.StatusCreated)
http.Redirect(w, r, "/", http.StatusSeeOther)
srv := &http.Server{ReadHeaderTimeout: 5 * time.Second}
srv.Shutdown(ctx)                      // 优雅关闭`,
  },
  {
    title: "html/template 模板语法",
    lang: "html",
    code: String.raw`{{.Name}}                          <!-- 输出（自动转义） -->
{{if .OK}}通过{{else}}未通过{{end}}      <!-- 条件 -->
{{range $i, $v := .Items}}{{$v}}{{else}}空{{end}}  <!-- 循环，else 为空时 -->
{{define "content"}}...{{end}}           <!-- 定义模板 -->
{{template "content" .}}                 <!-- 引用模板 -->
{{block "footer" .}}默认页脚{{end}}      <!-- 可被覆盖的块 -->
{{.Price | printf "%.2f"}}               <!-- 管道与函数 -->`,
  },
  {
    title: "database/sql",
    lang: "go",
    code: String.raw`db, err := sql.Open("mysql", dsn)   // 惰性连接，只创建句柄
err = db.PingContext(ctx)               // 检查数据库是否可连接
rows, err := db.QueryContext(ctx, "SELECT id FROM t WHERE a = ?", a)
row := db.QueryRowContext(ctx, "SELECT name FROM t WHERE id = ?", id)
err = row.Scan(&name)                   // sql.ErrNoRows 表示没有记录
res, err := db.ExecContext(ctx, "INSERT INTO t (a) VALUES (?)", a)
id, _ := res.LastInsertId()
tx, err := db.BeginTx(ctx, nil)         // 事务：tx.Commit() / tx.Rollback()`,
  },
  {
    title: "log/slog 结构化日志",
    lang: "go",
    code: String.raw`slog.Info("用户登录", "user_id", 42)
logger := slog.New(slog.NewJSONHandler(os.Stdout, nil))
logger.With("req_id", id).Warn("慢查询", "ms", 320)
slog.Group("http", "method", "GET", "status", 200)
slog.SetDefault(logger)                 // 设为默认，log 包输出也会经过它`,
  },
  {
    title: "测试",
    lang: "go",
    code: String.raw`func TestAdd(t *testing.T) {
	if got := Add(1, 2); got != 3 {
		t.Errorf("Add(1, 2) = %d，期望 3", got)
	}
}
t.Run("子测试名", func(t *testing.T) { /* ... */ })
t.Helper()          // 标记辅助函数，报错时显示调用处
t.TempDir()         // 测试专用临时目录，测试结束自动删除
t.Cleanup(func() {}) // 测试结束时执行清理
func FuzzAdd(f *testing.F) {
	f.Add(1, 2)     // 种子输入
	f.Fuzz(func(t *testing.T, a, b int) { /* ... */ })
}
func BenchmarkAdd(b *testing.B) {
	for b.Loop() { Add(1, 2) }   // Go 1.24+
}
rec := httptest.NewRecorder()   // 记录 HTTP 响应，用于测试处理函数`,
  },
];

const STDLIB: { pkg: string; use: string }[] = [
  { pkg: "fmt", use: "格式化输入输出：Println、Printf、Sprintf、Errorf" },
  { pkg: "strings / strconv", use: "字符串处理；字符串与数字互相转换" },
  { pkg: "errors", use: "创建、包装（%w）、判断（Is）与提取（As）错误" },
  { pkg: "os / io / io/fs", use: "文件读写、环境变量、通用 Reader 与 Writer 接口、文件系统抽象" },
  { pkg: "time", use: "时间与时长、定时器与超时" },
  { pkg: "context", use: "取消信号与超时控制，贯穿整个请求链路" },
  { pkg: "sync / sync/atomic", use: "互斥锁、WaitGroup、原子操作" },
  { pkg: "encoding/json", use: "JSON 编解码（Go 1.27 起由 v2 实现驱动，v1 接口保持兼容）" },
  { pkg: "net/http", use: "HTTP 客户端与服务端，ServeMux 路由（Go 1.22+ 支持方法与路径参数）" },
  { pkg: "html/template", use: "安全的 HTML 模板，自动转义" },
  { pkg: "database/sql", use: "通用数据库接口，配合驱动访问 MySQL、PostgreSQL、SQLite 等" },
  { pkg: "log/slog", use: "结构化日志，支持 JSON 与文本格式" },
  { pkg: "testing", use: "单元测试、子测试、基准测试与模糊测试" },
];

const FAQ: { q: string; a: string }[] = [
  {
    q: "运行 go run . 提示 go.mod file not found 或 cannot find main module？",
    a: "说明当前目录不在模块中。请切换到包含 go.mod 的目录；如果还没有模块，在项目根目录执行 go mod init 模块路径。",
  },
  {
    q: "提示 no required module provides package xxx 怎么办？",
    a: "第三方包还没有加入依赖。执行 go get 包路径，或运行 go mod tidy；同时确认 import 路径拼写与模块路径一致。",
  },
  {
    q: "下载依赖很慢或超时？",
    a: "在中国大陆可以设置模块代理：go env -w GOPROXY=https://goproxy.cn,direct。用 go env GOPROXY 查看当前配置。",
  },
  {
    q: "启动服务时提示 address already in use？",
    a: "端口已被占用，通常是上一次运行的程序没有退出。关闭旧进程，或通过 PORT 环境变量换一个端口（例如 9000）。",
  },
  {
    q: "修改代码后页面没有变化？",
    a: "Go 不会热更新：需要停止旧进程后重新 go run。浏览器可按 Ctrl+F5 强制刷新，并确认访问的是新进程的端口。",
  },
  {
    q: "Go 为什么没有 while 和三元运算符？",
    a: "Go 追求简洁：for 可以表达所有循环形式（for 条件 { } 就是 while）；需要按条件赋值时使用 if / else 即可。",
  },
  {
    q: "切片修改后，原来的数组也跟着变了？",
    a: "切片与原数据共享底层存储。需要独立副本时，使用 slices.Clone 或 make 新切片后 copy。",
  },
  {
    q: "往 map 写数据报 assignment to entry in nil map？",
    a: "只声明未初始化的 map 是 nil，只能读不能写。使用 make(map[K]V) 或字面量初始化之后再写入。",
  },
  {
    q: "Windows 下中文输出乱码怎么办？",
    a: "建议使用 Windows Terminal 或 PowerShell 7，并确保源文件以 UTF-8 保存。Go 源码与字符串默认使用 UTF-8。",
  },
  {
    q: "学完本教程后下一步做什么？",
    a: "继续阅读 Go 官方教程中的泛型、模糊测试与 govulncheck；用 Gin 重写第 19 章的待办应用；最后把它部署到一台服务器上。",
  },
];

const COMMUNITY: { title: string; url: string; desc: string }[] = [
  { title: "A Tour of Go", url: "https://go.dev/tour/", desc: "交互式入门，逐步练习语法与并发" },
  { title: "Go 博客", url: "https://go.dev/blog/", desc: "语言与工具链的设计文章与版本公告" },
  { title: "Go Wiki：Code Review Comments", url: "https://go.dev/wiki/CodeReviewComments", desc: "代码评审中的常见建议，写出地道的 Go" },
  { title: "Go FAQ", url: "https://go.dev/doc/faq", desc: "语言设计、工具与使用中的常见问题" },
  { title: "pkg.go.dev", url: "https://pkg.go.dev/", desc: "标准库与第三方包的官方文档检索站点" },
];

export function CheatSheet() {
  return (
    <div className="mx-auto max-w-5xl">
      <p className="text-sm font-semibold text-cyan-700">速查手册</p>
      <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">⚡ Go Web 开发速查表</h1>
      <p className="mt-3 leading-7 text-slate-600">
        学完全部章节后，可以把这里当作日常开发的备忘录。所有示例都基于 Go 1.27，需要 Go 1.25 及以上版本的特性已在注释中标明。
      </p>

      <div className="mt-8 grid gap-6 lg:grid-cols-2">
        {SHEETS.map((s) => (
          <section key={s.title} className="min-w-0 space-y-3">
            <h2 className="font-semibold text-slate-900">{s.title}</h2>
            <CodeBlock lang={s.lang} code={s.code} />
          </section>
        ))}
      </div>

      <section className="mt-12">
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">📦 常用标准库速览</h2>
        <div className="mt-4 overflow-x-auto rounded-2xl border border-slate-200 bg-white">
          <table className="min-w-full text-left text-sm">
            <thead className="bg-slate-50 text-slate-600">
              <tr>
                <th className="px-4 py-3 font-semibold">包</th>
                <th className="px-4 py-3 font-semibold">用途</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {STDLIB.map((s) => (
                <tr key={s.pkg}>
                  <td className="px-4 py-2.5 font-mono text-cyan-800">{s.pkg}</td>
                  <td className="px-4 py-2.5 text-slate-700">{s.use}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}

function LinkCard({ title, url, desc }: { title: string; url: string; desc: string }) {
  return (
    <a
      href={url}
      target="_blank"
      rel="noreferrer"
      className="block rounded-xl border border-slate-200 bg-white p-4 transition hover:border-cyan-400 hover:shadow-sm"
    >
      <p className="font-medium text-slate-900">{title} ↗</p>
      <p className="mt-1 text-sm leading-6 text-slate-600">{desc}</p>
    </a>
  );
}

export function ResourcesPage() {
  return (
    <div className="mx-auto max-w-5xl space-y-12">
      <header>
        <p className="text-sm font-semibold text-cyan-700">学习资源</p>
        <h1 className="mt-1 text-3xl font-extrabold tracking-tight text-slate-900">📚 资源、版本与常见问题</h1>
        <p className="mt-3 leading-7 text-slate-600">
          这里汇总了 Go 官方教程合集、各版本发布说明、常见问题和社区资源。链接均指向 go.dev 或 pkg.go.dev。
        </p>
      </header>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">🧭 官方教程合集</h2>
        <p className="mt-2 text-slate-600">来自 go.dev/doc/tutorial/ 的全部官方教程，可以在学完本站对应章节后继续深入。</p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {officialTutorials.map((t) => (
            <LinkCard key={t.url} title={t.topic} url={t.url} desc={t.desc} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">🆕 版本与发布说明</h2>
        <p className="mt-2 text-slate-600">
          Go 每年发布两个主版本（通常在 2 月与 8 月）。本教程以 Go 1.27 为基准，并标注了各特性所需的最低版本。
        </p>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {releaseDocs.map((r) => (
            <LinkCard key={r.url} title={r.topic} url={r.url} desc={r.desc} />
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">❓ 常见问题（FAQ）</h2>
        <div className="mt-5 divide-y divide-slate-100 rounded-2xl border border-slate-200 bg-white">
          {FAQ.map((item) => (
            <details key={item.q} className="group p-5">
              <summary className="cursor-pointer list-none font-medium text-slate-900 marker:content-none">
                <span className="mr-2 text-cyan-600 group-open:rotate-90 inline-block transition">▸</span>
                {item.q}
              </summary>
              <p className="mt-3 pl-5 leading-7 text-slate-600">{item.a}</p>
            </details>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-bold tracking-tight text-slate-900">🌱 社区与进阶阅读</h2>
        <div className="mt-5 grid gap-3 md:grid-cols-2">
          {COMMUNITY.map((c) => (
            <LinkCard key={c.url} title={c.title} url={c.url} desc={c.desc} />
          ))}
        </div>
      </section>

      <section className="rounded-2xl border border-cyan-100 bg-cyan-50/60 p-6">
        <h2 className="font-semibold text-cyan-900">🚀 推荐的下一步</h2>
        <ol className="mt-3 list-decimal space-y-2 pl-6 leading-7 text-slate-700">
          <li>阅读 Go 1.27 发布说明，了解泛型方法与 encoding/json v2 等新特性。</li>
          <li>完成官方 “Developing a RESTful API with Go and Gin” 教程，对比框架与标准库的写法。</li>
          <li>为自己的项目加上 CI：go vet、go test -race 与 govulncheck。</li>
          <li>把综合项目部署到云服务器，并配置 HTTPS 与日志采集。</li>
        </ol>
      </section>
    </div>
  );
}
