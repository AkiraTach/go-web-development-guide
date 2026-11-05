import type { Chapter } from "../../types";

export const ch15: Chapter = {
  id: "ch15",
  part: "第三部分：Web 开发核心",
  title: "结构化日志：log/slog",
  summary: "使用 Go 1.21 引入的 log/slog 输出结构化日志：理解级别、键值对、Handler、分组，以及如何安全地记录敏感数据。",
  level: "进阶",
  minutes: 45,
  icon: "📜",
  goals: [
    "理解结构化日志与普通文本日志的区别",
    "使用 slog.Info 等函数记录带键值对的日志",
    "创建 JSON 或文本格式的自定义 logger，并设置级别与源码位置",
    "使用 With、Group 组织日志字段，并用 LevelVar 动态调整级别",
    "通过 LogValuer 与 ReplaceAttr 实现日志脱敏",
  ],
  body: [
    { type: "h2", text: "1. 为什么需要结构化日志" },
    {
      type: "p",
      text: "传统日志是一段自由文本，例如「用户 42 登录失败，原因：密码错误」。人可以阅读，但程序很难检索、统计和告警。**结构化日志**则把信息拆成键值对，例如 `msg=登录失败 user_id=42 reason=密码错误`，并可以输出为 JSON，直接被日志平台（ELK、Loki、CloudWatch 等）解析。",
    },

    { type: "h2", text: "2. log 与 slog 的区别" },
    {
      type: "table",
      head: ["特性", "log（传统）", "log/slog（Go 1.21+）"],
      rows: [
        ["输出格式", "纯文本", "文本或 JSON，可自定义"],
        ["日志级别", "没有", "Debug、Info、Warn、Error，可自定义"],
        ["结构化字段", "没有，需要自己拼接", "键值对与分组（Group）"],
        ["扩展方式", "较弱", "Handler 接口，可以对接任何后端"],
      ],
    },
    {
      type: "ul",
      items: [
        "`slog.Info`、`slog.Warn` 等函数使用默认 logger。消息之后的参数是成对出现的键值（key, value）。",
        "`slog.New(slog.NewJSONHandler(os.Stdout, opts))` 创建自定义 logger，生产环境通常输出 JSON。",
        "`logger.With(...)` 为一组日志固定附加字段，例如请求 ID，避免每条日志重复书写。",
        "`slog.Group(...)` 把相关字段组织为嵌套对象，使日志结构更清晰。",
      ],
    },

    { type: "h2", text: "3. 完整示例" },
    {
      type: "code",
      lang: "go",
      file: "main.go",
      mod: "example.com/logdemo",
      code: String.raw`package main

import (
	"errors"
	"log"
	"log/slog"
	"os"
	"time"
)

type User struct {
	ID       int
	Email    string
	Password string
}

// LogValue 实现 slog.LogValuer 接口：日志中只输出脱敏后的字段，密码永远不会被记录。
func (u User) LogValue() slog.Value {
	return slog.GroupValue(
		slog.Int("id", u.ID),
		slog.String("email", u.Email),
		slog.String("password", "******"),
	)
}

func main() {
	// 1. 默认 logger：文本格式，输出到标准错误
	slog.Info("服务启动", "port", 8080, "env", "dev")

	// 2. 自定义 JSON 处理器：可动态调整级别，显示源码位置，并屏蔽 token 字段
	level := &slog.LevelVar{}
	level.Set(slog.LevelDebug)
	logger := slog.New(slog.NewJSONHandler(os.Stdout, &slog.HandlerOptions{
		Level:     level,
		AddSource: true,
		ReplaceAttr: func(groups []string, a slog.Attr) slog.Attr {
			if a.Key == "token" {
				return slog.String("token", "[REDACTED]")
			}
			return a
		},
	}))

	logger.Debug("调试信息", "module", "auth")

	// 3. With：为后续日志固定附加 request_id
	reqLog := logger.With("request_id", "req-42")
	reqLog.Info("请求开始", "path", "/books")

	// 4. Group：把相关字段组织为一个 JSON 对象
	reqLog.Info("请求完成",
		slog.Group("http",
			slog.String("method", "GET"),
			slog.Int("status", 200),
			slog.Duration("latency", 15*time.Millisecond),
		),
	)

	// 5. 错误与敏感数据
	reqLog.Error("查询失败", "err", errors.New("数据库连接超时"))
	reqLog.Info("用户登录",
		"user", User{ID: 1, Email: "a@b.com", Password: "secret"},
		"token", "abc123",
	)

	// 6. 设为默认 logger 后，标准库 log 的输出也会经过 slog 处理器
	slog.SetDefault(logger)
	log.Println("标准库 log 已接入 slog")

	// 7. 动态调整级别：提高到 Warn 后，Info 日志不再输出
	level.Set(slog.LevelWarn)
	slog.Info("这条 Info 日志不会出现")
	slog.Warn("磁盘空间不足", "free_mb", 120)
}`,
    },
    {
      type: "output",
      title: "运行结果（节选，时间与源码路径会因环境不同而不同）",
      text: String.raw`2026/10/01 12:00:00 INFO 服务启动 port=8080 env=dev
{"time":"2026-10-01T12:00:00.001+08:00","level":"DEBUG","source":{"function":"main.main","file":"/app/main.go","line":44},"msg":"调试信息","module":"auth"}
{"time":"2026-10-01T12:00:00.002+08:00","level":"INFO","source":{...},"msg":"请求开始","request_id":"req-42","path":"/books"}
{"time":"2026-10-01T12:00:00.002+08:00","level":"INFO","source":{...},"msg":"请求完成","request_id":"req-42","http":{"method":"GET","status":200,"latency":15000000}}
{"time":"2026-10-01T12:00:00.002+08:00","level":"ERROR","source":{...},"msg":"查询失败","request_id":"req-42","err":"数据库连接超时"}
{"time":"2026-10-01T12:00:00.003+08:00","level":"INFO","source":{...},"msg":"用户登录","request_id":"req-42","user":{"id":1,"email":"a@b.com","password":"******"},"token":"[REDACTED]"}
{"time":"2026-10-01T12:00:00.003+08:00","level":"INFO","source":{...},"msg":"标准库 log 已接入 slog"}
{"time":"2026-10-01T12:00:00.003+08:00","level":"WARN","source":{...},"msg":"磁盘空间不足","free_mb":120}`,
    },
    {
      type: "p",
      text: "注意第一行使用了默认的文本处理器，后面几行是我们自定义的 JSON 处理器输出。`level.Set(slog.LevelWarn)` 之后，Info 日志被过滤掉了。",
    },

    { type: "h2", text: "4. 进阶：LogValuer 与脱敏" },
    {
      type: "p",
      text: "让类型实现 `slog.LogValuer` 接口（即 `LogValue() slog.Value` 方法），就可以自定义它在日志中的表示方式，上例中的 User 就借此隐藏了密码。另外，`HandlerOptions.ReplaceAttr` 可以按键名统一处理字段，例如把 token 替换为 `[REDACTED]`。",
    },
    {
      type: "warn",
      text: "不要把密码、令牌、身份证号等敏感信息写入日志。即使做了脱敏，也应该只记录排查问题所必需的信息。",
    },

    { type: "h2", text: "5. 在 HTTP 中使用 slog" },
    {
      type: "p",
      text: "在中间件中记录请求信息是 slog 最常见的用法。下面的片段展示了核心思路，完整可运行的版本见第 19 章：",
    },
    {
      type: "code",
      lang: "go",
      code: String.raw`func logRequests(logger *slog.Logger, next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		start := time.Now()
		next.ServeHTTP(w, r)
		logger.InfoContext(r.Context(), "请求完成",
			"method", r.Method,
			"path", r.URL.Path,
			"duration", time.Since(start),
		)
	})
}`,
    },
    {
      type: "ul",
      items: [
        "**Debug**：开发调试的细节，生产环境通常关闭。",
        "**Info**：正常的业务事件，例如服务启动、用户登录成功。",
        "**Warn**：异常但可以恢复的情况，例如磁盘空间不足、重试成功。",
        "**Error**：需要人工关注的错误，例如数据库连接失败、未捕获的 panic。",
      ],
    },
  ],
  exercises: [
    "把示例改为文本格式输出（使用 slog.NewTextHandler），比较两种格式的可读性。",
    "定义一个自定义的 Order 类型并实现 LogValuer，使日志中只输出订单号与金额。",
    "思考：通过 HTTP 接口动态修改 LevelVar 的值，有什么运维上的好处？请尝试实现它。",
  ],
  quiz: [
    {
      q: "与标准库 log 相比，slog 的核心优势是什么？",
      options: ["运行速度快十倍", "结构化键值对、日志级别与可插拔的处理器", "自动发送邮件告警", "不需要 import"],
      answer: 1,
      explain: "slog 支持结构化字段、多级日志与 Handler 接口，能输出 JSON 等便于机器解析的格式。",
    },
    {
      q: "在 slog 中，如何让某个类型在日志里自动隐藏敏感字段？",
      options: ["修改标准库源码", "实现 LogValuer 接口的 LogValue 方法", "使用 unsafe 包", "把它定义为全局变量"],
      answer: 1,
      explain: "实现 LogValue() slog.Value 后，slog 会调用它来决定日志中的表示形式。",
    },
    {
      q: "哪种日志级别最适合记录「数据库连接失败，需要人工介入」的情况？",
      options: ["Debug", "Info", "Warn", "Error"],
      answer: 3,
      explain: "连接失败会影响服务正常运行，需要人工关注，应使用 Error 级别。",
    },
  ],
  refs: [
    { title: "Go 博客：Structured Logging with slog", url: "https://go.dev/blog/slog" },
    { title: "pkg.go.dev：log/slog", url: "https://pkg.go.dev/log/slog" },
    { title: "pkg.go.dev：log（标准库日志）", url: "https://pkg.go.dev/log" },
  ],
};
