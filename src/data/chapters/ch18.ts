import type { Chapter } from "../../types";

export const ch18: Chapter = {
  id: "ch18",
  part: "第四部分：安全、风格与上线",
  title: "构建、部署与优雅关闭",
  summary: "把 Go 服务编译为单个二进制文件，通过环境变量配置，实现优雅关闭与健康检查，并用 Docker 与反向代理部署上线。",
  level: "实战",
  minutes: 60,
  icon: "🚀",
  goals: [
    "使用 go build 的常用参数生成可复现的二进制文件，并注入版本号",
    "使用 GOOS、GOARCH 进行交叉编译",
    "通过环境变量读取配置，并理解十二要素应用的原则",
    "使用 signal.NotifyContext 与 srv.Shutdown 实现优雅关闭",
    "了解 Docker 多阶段构建、反向代理与 HTTPS 的基本做法",
  ],
  body: [
    { type: "h2", text: "1. 上线前的目标" },
    {
      type: "p",
      text: "一个可以上线的 Go 服务通常需要满足：**可配置**（端口、数据库地址通过环境变量注入）、**可观测**（结构化日志、健康检查、性能分析）、**可优雅退出**（收到停止信号后完成正在处理的请求）、**可复现构建**（版本号与构建参数可以追溯）。",
    },

    { type: "h2", text: "2. 编译：生成单个二进制文件" },
    {
      type: "code",
      lang: "bash",
      code: String.raw`# 1. 推荐的生产构建：去掉绝对路径与调试信息
go build -trimpath -ldflags="-s -w" -o bin/app ./cmd/app

# 2. 注入版本号（对应代码中的 var version 变量）
go build -ldflags="-X main.version=1.0.0" -o bin/app ./cmd/app

# 3. 查看二进制中记录的 Go 版本、模块依赖与构建参数
go version -m bin/app`,
    },
    {
      type: "ul",
      items: [
        "`-trimpath` 去掉编译产物中的本机绝对路径，让相同的源码在不同机器上生成一致的产物。",
        "`-ldflags=\"-s -w\"` 去掉符号表与 DWARF 调试信息，明显减小文件体积。",
        "`-ldflags=\"-X 包路径.变量=值\"` 在编译时修改字符串变量的值，常用于注入版本号与提交哈希。",
      ],
    },

    { type: "h2", text: "3. 交叉编译" },
    {
      type: "p",
      text: "Go 只需设置 `GOOS` 与 `GOARCH` 环境变量，就能在一台机器上编译出其他平台的程序。纯 Go 代码配合 `CGO_ENABLED=0`，还能生成静态链接的二进制文件，便于部署到任何 Linux 发行版。",
    },
    {
      type: "table",
      head: ["GOOS / GOARCH", "适用场景"],
      rows: [
        ["`linux` / `amd64`", "常见的 x86-64 云服务器"],
        ["`linux` / `arm64`", "ARM 架构的服务器（如 AWS Graviton）"],
        ["`windows` / `amd64`", "64 位 Windows 系统"],
        ["`darwin` / `arm64`", "Apple 芯片（M 系列）的 Mac"],
      ],
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`# 在 macOS 或 Windows 上为 Linux 服务器编译（Windows PowerShell 使用 $env:GOOS="linux" 等写法）
CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -trimpath -ldflags="-s -w" -o bin/app-linux ./cmd/app`,
    },

    { type: "h2", text: "4. 配置：使用环境变量" },
    {
      type: "p",
      text: "十二要素应用（Twelve-Factor App）建议把与环境相关的配置放在环境变量中，而不是写死在代码里。这样同一个二进制文件可以在开发、测试与生产环境中运行，只需改变环境变量。",
    },

    { type: "h2", text: "5. 完整示例：可优雅退出的服务" },
    {
      type: "p",
      text: "下面的程序具备上线所需的基本要素：从 PORT 环境变量读取端口、健康检查接口、JSON 日志、超时配置，以及收到 Ctrl+C 或 SIGTERM 时的优雅关闭。",
    },
    {
      type: "code",
      lang: "go",
      file: "cmd/app/main.go",
      mod: "example.com/app",
      code: String.raw`package main

import (
	"context"
	"fmt"
	"log/slog"
	"net/http"
	"os"
	"os/signal"
	"syscall"
	"time"
)

// version 可在编译时通过 -ldflags "-X main.version=1.0.0" 注入。
var version = "dev"

func main() {
	slog.SetDefault(slog.New(slog.NewJSONHandler(os.Stdout, nil)))

	port := os.Getenv("PORT") // 配置来自环境变量
	if port == "" {
		port = "8080"
	}

	mux := http.NewServeMux()
	mux.HandleFunc("GET /healthz", func(w http.ResponseWriter, r *http.Request) {
		w.WriteHeader(http.StatusOK)
		fmt.Fprintln(w, "ok")
	})
	mux.HandleFunc("GET /{$}", func(w http.ResponseWriter, r *http.Request) {
		fmt.Fprintf(w, "Hello from %s\n", version)
	})

	srv := &http.Server{
		Addr:              ":" + port,
		Handler:           mux,
		ReadHeaderTimeout: 5 * time.Second,
		ReadTimeout:       10 * time.Second,
		WriteTimeout:      15 * time.Second,
		IdleTimeout:       60 * time.Second,
	}

	// Ctrl+C（os.Interrupt）或 SIGTERM 到达时，ctx 会被取消
	ctx, stop := signal.NotifyContext(context.Background(), os.Interrupt, syscall.SIGTERM)
	defer stop()

	errCh := make(chan error, 1)
	go func() {
		slog.Info("服务启动", "addr", srv.Addr, "version", version)
		errCh <- srv.ListenAndServe()
	}()

	select {
	case err := <-errCh: // 服务启动失败或异常退出
		slog.Error("服务异常退出", "err", err)
		os.Exit(1)
	case <-ctx.Done(): // 收到退出信号
	}

	slog.Info("收到退出信号，开始优雅关闭")
	shutdownCtx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()
	if err := srv.Shutdown(shutdownCtx); err != nil {
		slog.Error("优雅关闭失败", "err", err)
		os.Exit(1)
	}
	slog.Info("服务已安全退出")
}`,
    },
    {
      type: "output",
      title: "运行并按 Ctrl+C 之后的日志（JSON 格式）",
      text: String.raw`{"time":"2026-10-01T12:00:00Z","level":"INFO","msg":"服务启动","addr":":8080","version":"dev"}
{"time":"2026-10-01T12:00:30Z","level":"INFO","msg":"收到退出信号，开始优雅关闭"}
{"time":"2026-10-01T12:00:30Z","level":"INFO","msg":"服务已安全退出"}`,
    },

    { type: "h2", text: "6. 优雅关闭的原理" },
    {
      type: "ul",
      items: [
        "`signal.NotifyContext` 监听 Ctrl+C（os.Interrupt）与 SIGTERM（容器平台和进程管理器发出的停止信号）。收到信号后，返回的 ctx 会被取消。",
        "`srv.Shutdown(ctx)` 会停止接收新连接，并等待正在处理的请求完成；如果超过 10 秒仍未结束，则放弃等待并返回错误。",
        "与之相对，`srv.Close()` 会立即关闭所有连接，只适合在不得不强制退出时使用。",
      ],
    },

    { type: "h2", text: "7. 健康检查与性能分析" },
    {
      type: "p",
      text: "`/healthz` 是容器编排系统（如 Kubernetes）常用的健康检查端点，返回 200 表示服务正常。对于性能与 goroutine 泄漏排查，可以使用 net/http/pprof。Go 1.27 中，goroutine 泄漏分析（goroutineleak 性能分析）已正式可用，启用 pprof 后可以访问 /debug/pprof/goroutineleak。",
    },
    {
      type: "warn",
      text: "net/http/pprof 默认把处理函数注册到 http.DefaultServeMux。如果你使用自定义的 ServeMux，需要手动挂载这些处理函数，并且务必限制访问来源，不要把调试接口暴露给公网。",
    },

    { type: "h2", text: "8. Docker 多阶段构建" },
    {
      type: "p",
      text: "多阶段构建的思路是：第一阶段使用完整的 Go 镜像编译程序，第二阶段只复制生成的二进制文件到极小的运行时镜像中。这样最终镜像不包含编译器与源码，体积小、攻击面也更小。",
    },
    {
      type: "code",
      lang: "dockerfile",
      file: "Dockerfile",
      code: String.raw`# 第一阶段：编译
FROM golang:1.27 AS build
WORKDIR /src
COPY go.mod go.sum* ./
RUN go mod download
COPY . .
RUN CGO_ENABLED=0 go build -trimpath -ldflags="-s -w" -o /out/app ./cmd/app

# 第二阶段：只包含可执行文件的极小运行时镜像
FROM gcr.io/distroless/static-debian12:nonroot
COPY --from=build /out/app /app
EXPOSE 8080
ENTRYPOINT ["/app"]`,
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`docker build -t todo-app .
docker run --rm -p 8080:8080 -e PORT=8080 todo-app`,
    },

    { type: "h2", text: "9. 反向代理与 HTTPS" },
    {
      type: "p",
      text: "在生产环境中，通常由 Caddy、Nginx 或云负载均衡器负责 HTTPS 证书与 TLS 终止，Go 服务只在本机的 HTTP 端口上监听。以 Caddy 为例，它可以自动申请并续期 Let's Encrypt 证书：",
    },
    {
      type: "code",
      lang: "bash",
      code: String.raw`caddy reverse-proxy --from example.com --to localhost:8080`,
    },

    { type: "h2", text: "10. 上线检查清单" },
    {
      type: "ol",
      items: [
        "使用 `CGO_ENABLED=0` 与 `-trimpath` 构建，并记录版本号与提交信息。",
        "所有配置通过环境变量注入，代码与仓库中不包含密钥。",
        "HTTP 服务器设置超时，并实现优雅关闭。",
        "提供 /healthz 健康检查；日志输出为 JSON，并接入日志平台。",
        "由反向代理提供 HTTPS；调试接口只对内网开放。",
        "数据库设置连接池参数；数据库迁移脚本可以重复执行。",
        "上线前运行 `go test -race ./...` 与 `govulncheck ./...`。",
      ],
    },
  ],
  exercises: [
    "为应用增加 /version 接口，返回通过 -ldflags 注入的版本号。",
    "编写 Dockerfile（参考上文），构建镜像并运行，然后用 `curl` 访问 /healthz 验证服务可用。",
    "使用 `PORT=9000 go run ./cmd/app` 启动服务，确认它监听的端口已经改为 9000。",
  ],
  quiz: [
    {
      q: "想让 Go 生成不依赖 C 库的静态二进制文件（便于跨平台部署），通常设置哪个环境变量？",
      options: ["GOOS=0", "CGO_ENABLED=0", "GOPATH=off", "STATIC=1"],
      answer: 1,
      explain: "CGO_ENABLED=0 会禁用 cgo，纯 Go 代码就会静态链接为单个文件。",
    },
    {
      q: "为了优雅关闭 HTTP 服务器，应当调用哪个方法？",
      options: ["os.Exit(0)", "srv.Shutdown(ctx)", "srv.Close()", "panic(\"stop\")"],
      answer: 1,
      explain: "Shutdown 会停止接收新连接，并等待正在处理的请求完成；Close 会立即关闭所有连接。",
    },
    {
      q: "要交叉编译出 64 位 Windows 程序，应设置哪组环境变量？",
      options: ["GOOS=windows GOARCH=amd64", "GOOS=win64", "TARGET=windows", "GOARCH=x86_64 GOOS=win"],
      answer: 0,
      explain: "GOOS 指定操作系统，GOARCH 指定处理器架构，两者组合即可交叉编译。",
    },
  ],
  refs: [
    { title: "Tutorial: Compile and install（编译与安装）", url: "https://go.dev/doc/tutorial/compile-install" },
    { title: "pkg.go.dev：os/signal（NotifyContext）", url: "https://pkg.go.dev/os/signal" },
    { title: "pkg.go.dev：net/http Server.Shutdown", url: "https://pkg.go.dev/net/http#Server.Shutdown" },
    { title: "Go 1.27 发布说明", url: "https://go.dev/doc/go1.27" },
    { title: "Go 工具链管理（Toolchains）", url: "https://go.dev/doc/toolchain" },
  ],
};
